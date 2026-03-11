class NotificationsController < ApplicationController
  include ActionController::Live

  before_action :authenticate_user!

  def index
    promote_scheduled_notifications!
    notifications = notifications_for_user(current_user).sort_by(&:sent_at).reverse
    reads = NotificationRead.where(user_id: current_user.id).pluck(:notification_id).to_set
    unread = notifications.reject { |n| reads.include?(n.id) }

    render json: {
      notifications: unread.map { |n| notification_json(n) },
      unread_count: unread.length
    }, status: :ok
  end

  def history
    promote_scheduled_notifications!
    reads = NotificationRead.where(user_id: current_user.id).includes(:notification).order(read_at: :desc).limit(100)
    render json: {
      notifications: reads.map { |r| notification_json(r.notification).merge(read_at: r.read_at) }
    }, status: :ok
  end

  def admin_index
    require_admin!
    return if performed?

    promote_scheduled_notifications!
    notifications = Notification.order(created_at: :desc).limit(100)
    render json: { notifications: notifications.map { |n| notification_json(n) } }, status: :ok
  end

  def create
    require_admin!
    return if performed?

    draft = boolean_param(:draft, default: false)
    send_now = boolean_param(:send_now, default: true)
    delivery_scope = params[:delivery_scope].presence || legacy_delivery_scope
    target_specs = build_target_specs(delivery_scope)
    scheduled_at = normalized_scheduled_at(draft: draft, send_now: send_now)

    return render_invalid_scope if target_specs.nil?
    return render_missing_schedule if !draft && !send_now && scheduled_at.nil?
    return render_missing_targets if target_specs.empty?

    notification = Notification.new(
      title: params[:title],
      body: params[:body],
      scheduled_at: scheduled_at,
      sent_at: send_now && !draft ? Time.current : nil,
      created_by: current_user.id,
      delivery_scope: delivery_scope,
      deliver_via_push: boolean_param(:deliver_via_push, default: true),
      deliver_via_email: boolean_param(:deliver_via_email, default: false)
    )

    Notification.transaction do
      notification.save!
      target_specs.each do |target_type, target_id|
        NotificationTarget.create!(notification: notification, target_type: target_type, target_id: target_id)
      end
      send_notification_emails!(notification) if notification.sent_at.present? && notification.deliver_via_email?
    end

    render json: { notification: notification_json(notification) }, status: :created
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: { code: "validation_error", details: e.record.errors } }, status: :unprocessable_entity
  end

  def destroy
    require_admin!
    return if performed?

    notification = Notification.find(params[:id])
    if notification.sent_at.present?
      return render json: { error: { code: "conflict" } }, status: :conflict
    end

    notification.destroy!
    render json: { deleted: true }, status: :ok
  end

  def read
    notification = Notification.find(params[:id])
    NotificationRead.find_or_create_by!(notification: notification, user: current_user) do |r|
      r.read_at = Time.current
    end
    render json: { read: true }, status: :ok
  end

  def stream
    if !Rails.env.production? && ENV["ENABLE_NOTIFICATION_SSE"] != "true"
      return head :no_content
    end

    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"

    last_id = request.headers["Last-Event-ID"].to_i

    sse = SSE.new(response.stream, event: "notification")
    deadline = Time.current + 25.seconds

    while Time.current < deadline
      break if response.stream.closed?

      promote_scheduled_notifications!

      notifications = notifications_for_user(current_user).select { |n| n.id > last_id }
      notifications.sort_by(&:id).each do |notification|
        sse.write(notification_json(notification), id: notification.id)
        last_id = notification.id
      end

      sse.write("", event: "keep-alive")
      sleep 3
    end
  rescue IOError, ActionController::Live::ClientDisconnected
  ensure
    sse.close if sse
    response.stream.close
  end

  private

  def render_invalid_scope
    render json: { error: { code: "validation_error", details: { delivery_scope: ["is invalid"] } } }, status: :unprocessable_entity
  end

  def render_missing_schedule
    render json: { error: { code: "validation_error", details: { scheduled_at: ["is required"] } } }, status: :unprocessable_entity
  end

  def render_missing_targets
    render json: { error: { code: "validation_error", details: { targets: ["must be selected"] } } }, status: :unprocessable_entity
  end

  def notification_json(notification)
    {
      id: notification.id,
      title: notification.title,
      body: notification.body,
      sent_at: notification.sent_at,
      scheduled_at: notification.scheduled_at,
      delivery_scope: notification.delivery_scope,
      deliver_via_push: notification.deliver_via_push,
      deliver_via_email: notification.deliver_via_email
    }
  end

  def notifications_for_user(user)
    return [] unless user

    notifications = Notification.where.not(sent_at: nil).includes(:notification_targets).to_a
    team_ids = TeamMember.where(user_id: user.id, status: :active).pluck(:team_id)
    tournament_ids = TournamentEntry.approved.where(team_id: team_ids).pluck(:tournament_id)

    notifications.select do |notification|
      notification.notification_targets.any? do |target|
        target.everyone? ||
          (target.user? && target.target_id == user.id) ||
          (target.team? && team_ids.include?(target.target_id)) ||
          (target.tournament? && tournament_ids.include?(target.target_id))
      end
    end
  end

  def promote_scheduled_notifications!
    Notification.where(sent_at: nil).where.not(scheduled_at: nil).where("scheduled_at <= ?", Time.current).find_each do |notification|
      notification.update_columns(sent_at: Time.current, updated_at: Time.current)
      send_notification_emails!(notification) if notification.deliver_via_email?
    end
  end

  def normalized_scheduled_at(draft:, send_now:)
    return nil if draft
    return Time.current if send_now

    raw = params[:scheduled_at].presence
    return nil if raw.blank?

    Time.zone.parse(raw)
  rescue ArgumentError, TypeError
    nil
  end

  def legacy_delivery_scope
    case params[:target_type].to_s
    when "everyone" then "everyone"
    when "tournament" then "tournament_teams"
    when "team" then "specific_teams"
    else nil
    end
  end

  def boolean_param(key, default:)
    return default if params[key].nil?

    ActiveModel::Type::Boolean.new.cast(params[key])
  end

  def build_target_specs(delivery_scope)
    case delivery_scope
    when "everyone"
      [[:everyone, nil]]
    when "tournament_teams"
      tournament_id = params[:tournament_id].to_i
      return [] unless tournament_id.positive?

      [[:tournament, tournament_id]]
    when "specific_teams"
      Array(params[:team_ids]).map(&:to_i).select(&:positive?).uniq.map { |team_id| [:team, team_id] }
    when "captains"
      Team.distinct.pluck(:captain_user_id).compact.map { |user_id| [:user, user_id] }
    else
      nil
    end
  end

  def send_notification_emails!(notification)
    recipients_for_notification(notification).find_each do |user|
      UserMailer.admin_notification(user, notification).deliver_now
    end
  end

  def recipients_for_notification(notification)
    ids = notification.notification_targets.flat_map do |target|
      if target.everyone?
        User.pluck(:id)
      elsif target.user?
        [target.target_id]
      elsif target.team?
        TeamMember.where(team_id: target.target_id, status: :active).pluck(:user_id)
      elsif target.tournament?
        team_ids = TournamentEntry.approved.where(tournament_id: target.target_id).pluck(:team_id)
        TeamMember.where(team_id: team_ids, status: :active).pluck(:user_id)
      else
        []
      end
    end

    User.where(id: ids.uniq)
  end
end
