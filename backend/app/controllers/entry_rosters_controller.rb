class EntryRostersController < ApplicationController
  before_action :authenticate_user!
  before_action :set_tournament
  before_action :set_entry

  def show
    roster = @entry.entry_roster
    render json: { roster: roster_json(roster) }, status: :ok
  end

  def upsert
    players = params[:players]
    unless players.is_a?(Array)
      return render json: { error: { code: "validation_error", details: { players: ["must be an array"] } } }, status: :unprocessable_entity
    end

    roster = @entry.entry_roster || @entry.build_entry_roster
    roster.submitted_by_user = current_user
    roster.submitted_at = Time.current

    EntryRoster.transaction do
      roster.save!
      roster.entry_roster_players.destroy_all
      players.each do |player|
        create_roster_player!(roster, player)
      end
    end

    render json: { roster: roster_json(roster.reload) }, status: :ok
  rescue ActiveRecord::RecordInvalid => e
    render json: { error: { code: "validation_error", details: e.record.errors } }, status: :unprocessable_entity
  end

  private

  def set_tournament
    @tournament = Tournament.find(params[:tournament_id])
  end

  def set_entry
    team_ids = TeamMember.where(user_id: current_user.id, status: :active).pluck(:team_id)
    scope = TournamentEntry.where(tournament_id: @tournament.id, team_id: team_ids)

    requested_team_id = params[:team_id].to_i
    scope = scope.where(team_id: requested_team_id) if requested_team_id.positive?

    @entry = scope.order(created_at: :desc).first
    return if @entry

    render json: { error: { code: "not_found" } }, status: :not_found
  end

  def create_roster_player!(roster, payload)
    source = payload[:source].to_s
    if source == "team_member"
      team_member_id = payload[:team_member_id].to_i
      team_member = TeamMember.find_by(id: team_member_id, team_id: @entry.team_id, status: :active)
      raise ActiveRecord::RecordInvalid.new(roster) unless team_member

      roster.entry_roster_players.create!(
        source: :team_member,
        team_member_id: team_member.id,
        name: payload[:name].presence || team_member.user&.name || "未設定",
        name_kana: payload[:name_kana].presence || team_member.user&.name_kana,
        phone: payload[:phone].presence || team_member.user&.phone,
        email: payload[:email].presence || team_member.user&.email,
        address: payload[:address].presence || team_member.user&.address,
        position: payload[:position],
        jersey_number: normalize_number(payload[:jersey_number])
      )
      return
    end

    roster.entry_roster_players.create!(
      source: :guest,
      name: payload[:name],
      name_kana: payload[:name_kana],
      phone: payload[:phone],
      email: payload[:email],
      address: payload[:address],
      position: payload[:position],
      jersey_number: normalize_number(payload[:jersey_number])
    )
  end

  def normalize_number(value)
    return nil if value.nil? || value == ""

    value.to_i
  end

  def roster_json(roster)
    return nil unless roster

    {
      id: roster.id,
      tournament_entry_id: roster.tournament_entry_id,
      submitted_at: roster.submitted_at,
      submitted_by_user_id: roster.submitted_by_user_id,
      players: roster.entry_roster_players.order(:id).map do |player|
        {
          id: player.id,
          source: player.source,
          team_member_id: player.team_member_id,
          name: player.name,
          name_kana: player.name_kana,
          phone: player.phone,
          email: player.email,
          address: player.address,
          position: player.position,
          jersey_number: player.jersey_number
        }
      end
    }
  end
end
