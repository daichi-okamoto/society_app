# frozen_string_literal: true

require "rails_helper"

RSpec.describe "TournamentEntries", type: :request do
  it "allows captain to apply for a tournament" do
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap5@example.com",
      address: "東京都",
      password: "password"
    )

    login_as(captain)
    post "/teams", params: { name: "FC Example" }
    team_id = json["team"]["id"]

    # ensure team has 7 members
    6.times do |i|
      user = User.create!(
        name: "メンバー#{i}",
        name_kana: "メンバー#{i}",
        birth_date: "1990-01-01",
        phone: "090-0000-000#{i}",
        email: "mem5-#{i}@example.com",
        address: "東京都",
        password: "password"
      )
      TeamMember.create!(team_id: team_id, user_id: user.id, role: :member, status: :active, joined_at: Time.current)
    end

    # admin creates tournament
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9999",
      email: "admin@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/tournaments", params: {
      name: "大会名",
      event_date: "2026-05-01",
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-04-30"
    }
    tournament_id = json["tournament"]["id"]

    login_as(captain)
    post "/tournaments/#{tournament_id}/entries", params: { team_id: team_id }

    expect(response).to have_http_status(:created)
    expect(json["entry"]["status"]).to eq("pending")
  end
end
