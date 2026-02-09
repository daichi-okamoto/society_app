class TeamMembersController < ApplicationController
  before_action :authenticate_user!

  def destroy
    member = TeamMember.find(params[:id])
    team = member.team

    authorize_team_captain!(team)

    if member.captain?
      return render json: { error: { code: "conflict" } }, status: :conflict
    end

    member.update!(status: :removed, removed_at: Time.current)
    render json: { deleted: true }, status: :ok
  end

  private

  def authorize_team_captain!(team)
    return if current_user.admin?
    return if team.captain_user_id == current_user.id

    render json: { error: { code: "forbidden" } }, status: :forbidden
  end
end
