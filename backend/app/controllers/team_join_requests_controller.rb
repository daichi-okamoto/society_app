class TeamJoinRequestsController < ApplicationController
  before_action :authenticate_user!

  def join_by_code
    team = Team.find_by(join_code: params[:join_code].to_s.strip.upcase)
    return render json: { error: { code: "not_found" } }, status: :not_found if team.nil?

    create_join_request_for!(team)
  end

  def create
    team = Team.find(params[:team_id])
    return render json: { error: { code: "validation_error" } }, status: :unprocessable_entity if team.join_code != params[:join_code].to_s.strip.upcase

    create_join_request_for!(team)
  end

  def index
    team = Team.find(params[:team_id])
    authorize_team_captain!(team)
    return if performed?

    requests = team.team_join_requests.pending.includes(:user).order(created_at: :desc)
    render json: { join_requests: requests.map { |r| join_request_json(r) } }, status: :ok
  end

  def update
    req = TeamJoinRequest.find(params[:id])
    team = req.team
    authorize_team_captain!(team)
    return if performed?

    if !req.pending?
      return render json: { error: { code: "conflict" } }, status: :conflict
    end

    status = params[:status]
    unless %w[approved rejected].include?(status)
      return render json: { error: { code: "validation_error" } }, status: :unprocessable_entity
    end

    req.update!(
      status: status,
      decided_at: Time.current,
      decided_by: current_user.id
    )

    if req.approved?
      TeamMember.create!(team: team, user: req.user, role: :member, status: :active, joined_at: Time.current)
    end

    UserMailer.team_join_decision(req.user, team, req.status).deliver_now

    render json: { join_request: { id: req.id, status: req.status } }, status: :ok
  end

  private

  def create_join_request_for!(team)
    if TeamMember.exists?(team_id: team.id, user_id: current_user.id)
      return render json: { error: { code: "conflict" } }, status: :conflict
    end

    if TeamJoinRequest.exists?(team_id: team.id, user_id: current_user.id, status: :pending)
      return render json: { error: { code: "conflict" } }, status: :conflict
    end

    req = nil

    TeamJoinRequest.transaction do
      req = TeamJoinRequest.create!(
        team: team,
        user: current_user,
        status: :pending,
        requested_at: Time.current
      )
      create_captain_notification!(team, req)
    end

    render json: { join_request: { id: req.id, status: req.status }, team: { id: team.id, name: team.name } }, status: :created
  end

  def authorize_team_captain!(team)
    return if team.captain_user_id == current_user.id

    render json: { error: { code: "forbidden" } }, status: :forbidden
  end

  def join_request_json(req)
    {
      id: req.id,
      user_id: req.user_id,
      user_name: req.user&.name,
      user_name_kana: req.user&.name_kana,
      user_email: req.user&.email,
      user_phone: req.user&.phone,
      user_address: req.user&.address,
      status: req.status,
      requested_at: req.requested_at
    }
  end

  def create_captain_notification!(team, join_request)
    return if team.captain_user_id.blank?

    notification = Notification.create!(
      title: "新しい参加申請があります",
      body: "#{join_request.user&.name || 'ユーザー'}さんが#{team.name}へ参加申請しました。",
      link_path: "/teams/#{team.id}/requests",
      scheduled_at: Time.current,
      sent_at: Time.current,
      created_by: current_user.id,
      delivery_scope: "specific_users",
      deliver_via_push: true,
      deliver_via_email: false
    )

    NotificationTarget.create!(
      notification: notification,
      target_type: :user,
      target_id: team.captain_user_id
    )
  end
end
