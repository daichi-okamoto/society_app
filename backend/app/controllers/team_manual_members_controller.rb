class TeamManualMembersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_team
  before_action :authorize_team_captain_or_admin!
  before_action :set_manual_member, only: [:update, :destroy]

  def create
    member = @team.team_manual_members.new(
      created_by_user: current_user,
      name: params[:name],
      name_kana: params[:name_kana],
      phone: params[:phone],
      postal_code: params[:postal_code],
      prefecture: params[:prefecture],
      city_block: params[:city_block],
      building: params[:building],
      position: params[:position].presence || "MF",
      jersey_number: normalize_jersey_number(params[:jersey_number]),
      avatar_data_url: params[:avatar_data_url]
    )

    if member.save
      render json: { manual_member: manual_member_json(member) }, status: :created
    else
      render json: { error: { code: "validation_error", details: member.errors } }, status: :unprocessable_entity
    end
  end

  def update
    if @manual_member.update(
      name: params[:name],
      name_kana: params[:name_kana],
      phone: params[:phone],
      postal_code: params[:postal_code],
      prefecture: params[:prefecture],
      city_block: params[:city_block],
      building: params[:building],
      position: params[:position].presence || @manual_member.position,
      jersey_number: normalize_jersey_number(params[:jersey_number]),
      avatar_data_url: params[:avatar_data_url]
    )
      render json: { manual_member: manual_member_json(@manual_member) }, status: :ok
    else
      render json: { error: { code: "validation_error", details: @manual_member.errors } }, status: :unprocessable_entity
    end
  end

  def destroy
    @manual_member.destroy!
    render json: { deleted: true }, status: :ok
  end

  private

  def set_team
    @team = Team.find(params[:team_id])
  end

  def set_manual_member
    @manual_member = @team.team_manual_members.find(params[:id])
  end

  def authorize_team_captain_or_admin!
    return if current_user&.admin?
    return if @team.captain_user_id == current_user.id

    render json: { error: { code: "forbidden" } }, status: :forbidden
  end

  def normalize_jersey_number(value)
    return nil if value.nil? || value == ""

    value.to_i
  end

  def manual_member_json(member)
    {
      id: member.id,
      team_id: member.team_id,
      name: member.name,
      name_kana: member.name_kana,
      phone: member.phone,
      postal_code: member.postal_code,
      prefecture: member.prefecture,
      city_block: member.city_block,
      building: member.building,
      position: member.position,
      jersey_number: member.jersey_number,
      avatar_data_url: member.avatar_data_url,
      created_at: member.created_at
    }
  end
end
