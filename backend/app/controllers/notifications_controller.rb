class NotificationsController < ApplicationController
  include ActionController::Live

  before_action :authenticate_user!

  def index
    notifications = notifications_for_user(current_user).sort_by(&:sent_at).reverse
    reads = NotificationRead.where(user_id: current_user.id).pluck(:notification_id).to_set
    unread = notifications.reject { |n| reads.include?(n.id) }

    render json: {
      notifications: unread.map { |n| notification_json(n) },
      unread_count: unread.length
    }, status: :ok
  end

  def history
    reads = NotificationRead.where(user_id: current_user.id).includes(:notification).order(read_at: :desc).limit(100)
    render json: {
      notifications: reads.map { |r| notification_json(r.notification).merge(read_at: r.read_at) }
    }, status: :ok
  end

  def admin_index
    require_admin!
    return if performed?

    notifications = Notification.order(created_at: :desc).limit(100)
    render json: { notifications: notifications.map { |n| notification_json(n) } }, status: :ok
  end

  def create
    require_admin!
    return if performed?

    notification = Notification.new(
      title: params[:title],
      body: params[:body],
      scheduled_at: params[:scheduled_at],
      created_by: current_user.id
    )

    target_type = params[:target_type]
    target_ids = params[:target_ids] || (params[:target_id].present? ? [params[:target_id]] : [])

    if notification.save
      if target_type == "everyone"
        NotificationTarget.create!(
          notification: notification,
          target_type: target_type,
          target_id: nil
        )
      else
        if target_ids.empty?
          notification.destroy!
          return render json: { error: { code: "validation_error" } }, status: :unprocessable_entity
        end
        target_ids.each do |tid|
          NotificationTarget.create!(
            notification: notification,
            target_type: target_type,
            target_id: tid
          )
        end
      end

      if notification.scheduled_at <= Time.current
        notification.update!(sent_at: Time.current)
      end

      render json: { notification: { id: notification.id } }, status: :created
    else
      render json: { error: { code: "validation_error", details: notification.errors } }, status: :unprocessable_entity
    end
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
    # In development, disable long-lived SSE unless explicitly enabled.
    # This avoids hanging Puma workers and makes Ctrl+C shutdown reliable.
    if !Rails.env.production? && ENV["ENABLE_NOTIFICATION_SSE"] != "true"
      return head :no_content
    end

    response.headers["Content-Type"] = "text/event-stream"
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"

    last_id = request.headers["Last-Event-ID"].to_i

    sse = SSE.new(response.stream, event: "notification")
    # Keep each SSE request short-lived so Puma can shut down cleanly on Ctrl+C in development.
    # The client can reconnect with Last-Event-ID to continue from the latest event.
    deadline = Time.current + 25.seconds

    while Time.current < deadline
      break if response.stream.closed?

      # promote scheduled notifications
      Notification.where(sent_at: nil).where("scheduled_at <= ?", Time.current).find_each do |n|
        n.update_columns(sent_at: Time.current, updated_at: Time.current)
      end

      notifications = notifications_for_user(current_user).select { |n| n.id > last_id }
      notifications.sort_by(&:id).each do |n|
        sse.write(notification_json(n), id: n.id)
        last_id = n.id
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

  def notification_json(n)
    {
      id: n.id,
      title: n.title,
      body: n.body,
      sent_at: n.sent_at,
      scheduled_at: n.scheduled_at
    }
  end

  def notifications_for_user(user)
    return [] unless user

    notifications = Notification.where.not(sent_at: nil).includes(:notification_targets).to_a
    team_ids = TeamMember.where(user_id: user.id, status: :active).pluck(:team_id)
    tournament_ids = TournamentEntry.approved.where(team_id: team_ids).pluck(:tournament_id)

    notifications.select do |n|
      n.notification_targets.any? do |t|
        t.everyone? ||
          (t.user? && t.target_id == user.id) ||
          (t.team? && team_ids.include?(t.target_id)) ||
          (t.tournament? && tournament_ids.include?(t.target_id))
      end
    end
  end
end
