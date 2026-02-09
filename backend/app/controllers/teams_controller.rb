class TeamsController < ApplicationController
  before_action :authenticate_user!, only: [:index, :create, :show, :update]

  def index
    teams = Team.includes(:captain_user).order(created_at: :desc)
    render json: { teams: teams.map { |t| team_summary(t) } }, status: :ok
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

    render json: { team: team_detail(team) }, status: :ok
  end

  def update
    team = Team.find(params[:id])
    authorize_team_captain!(team)

    if team.update(name: params[:name])
      render json: { team: team_detail(team) }, status: :ok
    else
      render json: { error: { code: "validation_error", details: team.errors } }, status: :unprocessable_entity
    end
  end

  def transfer_captain
    team = Team.find(params[:id])
    authorize_team_captain!(team)

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
    loop do
      code = SecureRandom.alphanumeric(6).upcase
      return code unless Team.exists?(join_code: code)
    end
  end

  def team_summary(team)
    {
      id: team.id,
      name: team.name,
      captain_name: team.captain_user.name,
      past_results: []
    }
  end

  def team_detail(team)
    {
      id: team.id,
      name: team.name,
      join_code: team.join_code,
      captain_user_id: team.captain_user_id,
      members: team.team_members.active.map { |m| { user_id: m.user_id, name: m.user.name, role: m.role } }
    }
  end
end
