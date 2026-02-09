# frozen_string_literal: true

require "rails_helper"

RSpec.describe "TournamentEntriesCancel", type: :request do
  it "prevents cancel after deadline" do
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap7@example.com",
      address: "東京都",
      password: "password"
    )
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9999",
      email: "admin3@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/tournaments", params: {
      name: "大会名",
      event_date: (Date.current + 1).to_s,
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: Date.current.to_s
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
        phone: "090-0000-200#{i}",
        email: "mem7-#{i}@example.com",
        address: "東京都",
        password: "password"
      )
      TeamMember.create!(team_id: team_id, user_id: user.id, role: :member, status: :active, joined_at: Time.current)
    end

    post "/tournaments/#{tournament_id}/entries", params: { team_id: team_id }
    entry_id = json["entry"]["id"]

    allow(Date).to receive(:current).and_return(Date.current + 1)
    post "/tournament_entries/#{entry_id}/cancel"

    expect(response).to have_http_status(:conflict)
  end

  it "allows cancel before deadline and sends email" do
    ActionMailer::Base.deliveries.clear

    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap7b@example.com",
      address: "東京都",
      password: "password"
    )
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9999",
      email: "admin3b@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/tournaments", params: {
      name: "大会名",
      event_date: (Date.current + 7).to_s,
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: (Date.current + 1).to_s
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
        phone: "090-0000-210#{i}",
        email: "mem7b-#{i}@example.com",
        address: "東京都",
        password: "password"
      )
      TeamMember.create!(team_id: team_id, user_id: user.id, role: :member, status: :active, joined_at: Time.current)
    end

    post "/tournaments/#{tournament_id}/entries", params: { team_id: team_id }
    entry_id = json["entry"]["id"]

    post "/tournament_entries/#{entry_id}/cancel"

    expect(response).to have_http_status(:ok)
    expect(ActionMailer::Base.deliveries.length).to eq(1)
    expect(ActionMailer::Base.deliveries.first.to).to include("cap7b@example.com")
  end
end
