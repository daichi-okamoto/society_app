class TeamsController < ApplicationController
  before_action :authenticate_user!, only: [:index, :create, :show, :update]

  def index
    teams = Team.includes(:captain_user).order(created_at: :desc)
    my_team_ids = TeamMember.where(user_id: current_user.id, status: :active).pluck(:team_id)
    team_ids = teams.map(&:id)
    member_counts = TeamMember.where(team_id: team_ids, status: :active).group(:team_id).count
    pending_counts = TeamJoinRequest.where(team_id: team_ids, status: :pending).group(:team_id).count

    render json: {
      teams: teams.map do |team|
        team_summary(
          team,
          my_team_ids.include?(team.id),
          member_counts.fetch(team.id, 0),
          pending_counts.fetch(team.id, 0)
        )
      end
    }, status: :ok
  end

  def create
    team = Team.new(
      name: params[:name],
      join_code: generate_join_code,
      captain_user_id: current_user.id,
      created_by: current_user.id
    )

    if team.save
      TeamMember.create!(team: team, user: current_user, role: :captain, status: :active, joined_at: Time.current)
      render json: { team: team_detail(team) }, status: :created
    else
      render json: { error: { code: "validation_error", details: team.errors } }, status: :unprocessable_entity
    end
  end

  def show
    team = Team.find(params[:id])
    authorize_team_member!(team)
    return if performed?

    render json: { team: team_detail(team) }, status: :ok
  end

  def update
    team = Team.find(params[:id])
    authorize_team_captain!(team)
    return if performed?

    if team.update(name: params[:name])
      render json: { team: team_detail(team) }, status: :ok
    else
      render json: { error: { code: "validation_error", details: team.errors } }, status: :unprocessable_entity
    end
  end

  def transfer_captain
    team = Team.find(params[:id])
    authorize_team_captain!(team)
    return if performed?

    new_captain_id = params[:new_captain_user_id]
    unless TeamMember.exists?(team_id: team.id, user_id: new_captain_id, status: :active)
      return render json: { error: { code: "validation_error" } }, status: :unprocessable_entity
    end

    TeamMember.where(team_id: team.id, role: :captain).update_all(role: :member)
    TeamMember.where(team_id: team.id, user_id: new_captain_id).update_all(role: :captain)
    team.update!(captain_user_id: new_captain_id)

    render json: { team: team_detail(team) }, status: :ok
  end

  private

  def authorize_team_member!(team)
    return if current_user.admin?
    return if TeamMember.exists?(team_id: team.id, user_id: current_user.id, status: :active)

    render json: { error: { code: "forbidden" } }, status: :forbidden
  end

  def authorize_team_captain!(team)
    return if current_user.admin?
    return if team.captain_user_id == current_user.id

    render json: { error: { code: "forbidden" } }, status: :forbidden
  end

  def generate_join_code
    # Format: TS-123456
    loop do
      code = format("TS-%06d", SecureRandom.random_number(1_000_000))
      return code unless Team.exists?(join_code: code)
    end
  end

  def team_summary(team, is_member, member_count, pending_join_requests_count)
    status =
      if pending_join_requests_count.positive?
        "pending"
      elsif team.captain_user&.suspended?
        "suspended"
      else
        "approved"
      end

    {
      id: team.id,
      name: team.name,
      captain_name: team.captain_user&.name,
      captain_address: team.captain_user&.address,
      captain_status: team.captain_user&.status,
      member_count: member_count,
      pending_join_requests_count: pending_join_requests_count,
      status: status,
      created_at: team.created_at,
      is_member: is_member,
      past_results: []
    }
  end

  def team_detail(team)
    {
      id: team.id,
      name: team.name,
      join_code: team.join_code,
      captain_user_id: team.captain_user_id,
      members: team.team_members.active.includes(:user).map do |member|
        {
          id: member.id,
          user_id: member.user_id,
          name: member.user&.name,
          name_kana: member.user&.name_kana,
          phone: member.user&.phone,
          email: member.user&.email,
          role: member.role,
          address: member.user&.address
        }
      end
    }
  end
end
