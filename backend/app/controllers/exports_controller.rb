require "csv"

class ExportsController < ApplicationController
  before_action :require_admin!

  def insurance
    rosters = EntryRoster
      .joins(:tournament_entry)
      .includes(:entry_roster_players, tournament_entry: [:tournament, :team])
      .order(submitted_at: :desc)
    rosters = rosters.where(tournament_entries: { tournament_id: params[:tournament_id] }) if params[:tournament_id].present?

    csv = CSV.generate(headers: true) do |row|
      row << ["提出日時", "大会名", "大会日", "チーム名", "選手区分", "氏名", "ふりがな", "電話", "メール", "住所", "ポジション", "背番号"]
      rosters.each do |roster|
        tournament = roster.tournament_entry&.tournament
        team = roster.tournament_entry&.team
        roster.entry_roster_players.each do |player|
          row << [
            roster.submitted_at&.iso8601,
            tournament&.name,
            tournament&.event_date,
            team&.name,
            player.source == "team_member" ? "チームメンバー" : "大会限定ゲスト",
            player.name,
            player.name_kana,
            player.phone,
            player.email,
            player.address,
            player.position,
            player.jersey_number
          ]
        end
      end
    end

    suffix = params[:tournament_id].present? ? "_t#{params[:tournament_id]}" : "_all"
    send_data csv, filename: "insurance_roster#{suffix}.csv"
  end
end
