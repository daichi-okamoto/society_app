# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Authorization", type: :request do
  it "requires admin for tournament create" do
    post "/tournaments", params: { name: "大会名" }
    expect(response).to have_http_status(:unauthorized)
  end

  it "forbids tournament create for non-admin" do
    user = User.create!(
      name: "参加者",
      name_kana: "サンカシャ",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "user-auth1@example.com",
      address: "東京都",
      password: "password"
    )

    login_as(user)
    post "/tournaments", params: { name: "大会名" }

    expect(response).to have_http_status(:forbidden)
  end

  it "requires admin for announcement create" do
    post "/announcements", params: { title: "t", body: "b" }
    expect(response).to have_http_status(:unauthorized)
  end

  it "forbids notifications admin access for non-admin" do
    user = User.create!(
      name: "参加者",
      name_kana: "サンカシャ",
      birth_date: "1990-01-01",
      phone: "090-0000-0001",
      email: "user-auth2@example.com",
      address: "東京都",
      password: "password"
    )

    login_as(user)
    get "/notifications/admin"

    expect(response).to have_http_status(:forbidden)
  end

  it "requires admin for presign upload" do
    post "/uploads/presign", params: { filename: "a.jpg", content_type: "image/jpeg" }
    expect(response).to have_http_status(:unauthorized)
  end

  it "forbids match create for non-admin" do
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0002",
      email: "cap-auth@example.com",
      address: "東京都",
      password: "password"
    )
    team1 = Team.create!(name: "FC A", captain_user: captain, created_by: captain.id, join_code: "AAA111")
    team2 = Team.create!(name: "FC B", captain_user: captain, created_by: captain.id, join_code: "BBB222")
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

    login_as(captain)
    post "/tournaments/#{tournament.id}/matches", params: {
      tournament_id: tournament.id,
      home_team_id: team1.id,
      away_team_id: team2.id,
      kickoff_at: Time.current
    }

    expect(response).to have_http_status(:forbidden)
  end
end
