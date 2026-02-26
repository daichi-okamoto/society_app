class TeamsController < ApplicationController
  before_action :authenticate_user!, only: [:index, :create, :show, :update]

  def index
    filtered = filtered_teams
    teams = apply_sort(filtered)
    my_team_ids = TeamMember.where(user_id: current_user.id, status: :active).pluck(:team_id)
    total_count = filtered.distinct.count(:id)
    teams = apply_pagination(teams)
    team_ids = teams.pluck(:id)
    member_counts = TeamMember.where(team_id: team_ids, status: :active).group(:team_id).count
    manual_member_counts = TeamManualMember.where(team_id: team_ids).group(:team_id).count
    pending_counts = TeamJoinRequest.where(team_id: team_ids, status: :pending).group(:team_id).count
    limit_value = normalized_limit
    offset_value = normalized_offset
    has_more = limit_value.present? ? (offset_value + teams.size < total_count) : false

    render json: {
      teams: teams.map do |team|
          team_summary(
          team,
          my_team_ids.include?(team.id),
          member_counts.fetch(team.id, 0) + manual_member_counts.fetch(team.id, 0),
          pending_counts.fetch(team.id, 0)
        )
      end,
      meta: {
        total_count: total_count,
        limit: limit_value,
        offset: offset_value,
        has_more: has_more
      },
      summary: {
        total_teams: Team.count,
        pending_teams: Team.pending.count
      }
    }, status: :ok
  end

  def create
    team = Team.new(
      name: params[:name],
      join_code: generate_join_code,
      captain_user_id: current_user.id,
      created_by: current_user.id,
      approval_status: :pending
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

  def moderate
    team = Team.find(params[:id])
    require_admin!
    return if performed?

    decision = params[:decision].to_s
    case decision
    when "approve"
      team.update!(approval_status: :approved)
      approve_team_requests!(team)
      render json: { team: team_detail(team) }, status: :ok
    when "suspend"
      team.captain_user&.update!(status: :suspended)
      render json: { team: team_detail(team) }, status: :ok
    else
      render json: { error: { code: "validation_error", details: { decision: ["is invalid"] } } }, status: :unprocessable_entity
    end
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

  def filtered_teams
    scope = Team.left_joins(:captain_user).includes(:captain_user)
    q = params[:q].to_s.strip
    if q.present?
      escaped = ActiveRecord::Base.sanitize_sql_like(q)
      like = "%#{escaped}%"
      scope = scope.where(
        "teams.name ILIKE :q OR users.name ILIKE :q OR users.address ILIKE :q",
        q: like
      )
    end

    case params[:status].to_s
    when "pending"
      scope = scope.where(approval_status: Team.approval_statuses[:pending])
    when "suspended"
      scope = scope.where(users: { status: User.statuses[:suspended] })
    when "approved"
      scope = scope.where(approval_status: Team.approval_statuses[:approved])
      scope = scope.where(users: { status: User.statuses[:active] })
    end

    scope
  end

  def apply_sort(scope)
    case params[:sort].to_s
    when "created_asc"
      scope.order(created_at: :asc)
    when "members_desc"
      scope
        .left_joins(:team_members)
        .where("team_members.status = ? OR team_members.id IS NULL", TeamMember.statuses[:active])
        .group("teams.id")
        .order(Arel.sql("COUNT(team_members.id) DESC, teams.created_at DESC"))
    else
      scope.order(created_at: :desc)
    end
  end

  def apply_pagination(scope)
    limit_value = normalized_limit
    return scope unless limit_value.present?

    scope.limit(limit_value).offset(normalized_offset)
  end

  def normalized_limit
    return nil if params[:limit].blank?

    [[params[:limit].to_i, 1].max, 100].min
  end

  def normalized_offset
    [params[:offset].to_i, 0].max
  end

  def team_summary(team, is_member, member_count, pending_join_requests_count)
    status =
      if team.captain_user&.suspended?
        "suspended"
      else
        team.approval_status
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
    pending_join_requests_count = team.team_join_requests.pending.count
    member_scope = team.team_members.active.includes(:user)
    manual_member_scope = team.team_manual_members.order(created_at: :desc)
    captain_member = member_scope.find { |m| m.role == "captain" } || member_scope.first
    status =
      if team.captain_user&.suspended?
        "suspended"
      else
        team.approval_status
      end

    {
      id: team.id,
      name: team.name,
      join_code: team.join_code,
      captain_user_id: team.captain_user_id,
      status: status,
      created_at: team.created_at,
      pending_join_requests_count: pending_join_requests_count,
      member_count: member_scope.size + manual_member_scope.size,
      captain: {
        id: captain_member&.user_id,
        name: captain_member&.user&.name || team.captain_user&.name,
        email: captain_member&.user&.email || team.captain_user&.email,
        phone: captain_member&.user&.phone || team.captain_user&.phone,
        address: captain_member&.user&.address || team.captain_user&.address
      },
      members: member_scope.map do |member|
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
      end,
      manual_members: manual_member_scope.map do |member|
        {
          id: member.id,
          name: member.name,
          name_kana: member.name_kana,
          phone: member.phone,
          email: nil,
          role: "member",
          address: [member.prefecture, member.city_block, member.building].compact.join(""),
          postal_code: member.postal_code,
          prefecture: member.prefecture,
          city_block: member.city_block,
          building: member.building,
          position: member.position,
          jersey_number: member.jersey_number,
          avatar_data_url: member.avatar_data_url,
          source: "manual"
        }
      end
    }
  end

  def approve_team_requests!(team)
    TeamJoinRequest.transaction do
      team.team_join_requests.pending.find_each do |req|
        req.update!(status: :approved, decided_at: Time.current, decided_by: current_user.id)
        next if TeamMember.exists?(team_id: team.id, user_id: req.user_id)

        TeamMember.create!(
          team_id: team.id,
          user_id: req.user_id,
          role: :member,
          status: :active,
          joined_at: Time.current
        )
      end
      team.captain_user&.update!(status: :active)
    end
  end
end
