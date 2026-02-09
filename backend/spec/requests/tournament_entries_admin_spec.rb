# frozen_string_literal: true

require "rails_helper"

RSpec.describe "TournamentEntriesAdmin", type: :request do
  it "allows admin to approve entry" do
    ActionMailer::Base.deliveries.clear

    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9999",
      email: "admin2@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap6@example.com",
      address: "東京都",
      password: "password"
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
    post "/teams", params: { name: "FC Example" }
    team_id = json["team"]["id"]

    6.times do |i|
      user = User.create!(
        name: "メンバー#{i}",
        name_kana: "メンバー#{i}",
        birth_date: "1990-01-01",
        phone: "090-0000-100#{i}",
        email: "mem6-#{i}@example.com",
        address: "東京都",
        password: "password"
      )
      TeamMember.create!(team_id: team_id, user_id: user.id, role: :member, status: :active, joined_at: Time.current)
    end

    post "/tournaments/#{tournament_id}/entries", params: { team_id: team_id }
    entry_id = json["entry"]["id"]

    login_as(admin)
    patch "/tournament_entries/#{entry_id}", params: { status: "approved" }

    expect(response).to have_http_status(:ok)
    expect(json["entry"]["status"]).to eq("approved")
    expect(ActionMailer::Base.deliveries.length).to eq(1)
    expect(ActionMailer::Base.deliveries.first.to).to include("cap6@example.com")
  end
end
