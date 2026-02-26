# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Exports", type: :request do
  it "allows admin to download insurance CSV" do
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9999",
      email: "admin7@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap12@example.com",
      address: "東京都",
      password: "password"
    )

    login_as(captain)
    post "/teams", params: { name: "FC Example" }
    team_id = json["team"]["id"]
    tournament = Tournament.create!(
      name: "保険CSV確認大会",
      event_date: Date.current + 7.days,
      venue: "渋谷スポーツセンター",
      match_half_minutes: 12,
      max_teams: 16,
      entry_fee_amount: 8000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: Date.current + 2.days,
      description: "csv spec test"
    )
    entry = TournamentEntry.create!(
      tournament_id: tournament.id,
      team_id: team_id,
      status: :approved,
      applied_at: Time.current,
      decided_at: Time.current,
      decided_by: admin.id
    )
    roster = EntryRoster.create!(
      tournament_entry_id: entry.id,
      submitted_by_user_id: captain.id,
      submitted_at: Time.current
    )
    EntryRosterPlayer.create!(
      entry_roster_id: roster.id,
      source: :team_member,
      name: captain.name,
      name_kana: captain.name_kana,
      phone: captain.phone,
      email: captain.email,
      address: captain.address,
      position: "MF",
      jersey_number: 10
    )

    login_as(admin)
    get "/exports/insurance", params: { tournament_id: tournament.id }

    expect(response).to have_http_status(:ok)
    expect(response.content_type).to include("text/csv")
    expect(response.body).to include("大会名")
    expect(response.body).to include("保険CSV確認大会")
    expect(response.body).to include("チームメンバー")
  end
end
