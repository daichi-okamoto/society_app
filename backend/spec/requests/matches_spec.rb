# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Matches", type: :request do
  it "allows admin to create and set result" do
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9999",
      email: "admin5@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    tournament = Tournament.create!(
      name: "大会名",
      event_date: "2026-05-01",
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-04-30"
    )

    team1 = Team.create!(
      name: "FC A",
      captain_user: admin,
      created_by: admin.id,
      join_code: "AAAAAA"
    )
    team2 = Team.create!(
      name: "FC B",
      captain_user: admin,
      created_by: admin.id,
      join_code: "BBBBBB"
    )

    login_as(admin)
    post "/tournaments/#{tournament.id}/matches", params: {
      tournament_id: tournament.id,
      home_team_id: team1.id,
      away_team_id: team2.id,
      kickoff_at: "2026-05-01T10:00:00Z",
      field: "A"
    }

    expect(response).to have_http_status(:created)
    match_id = json["match"]["id"]

    post "/matches/#{match_id}/result", params: { home_score: 2, away_score: 1 }
    expect(response).to have_http_status(:ok)
    expect(json["result"]["home_score"]).to eq(2)
  end
end
