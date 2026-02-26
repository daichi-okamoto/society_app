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
    Team.find(team_id).update!(approval_status: :approved)

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

  it "rejects application when team is not approved" do
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-1000-0000",
      email: "cap-pending@example.com",
      address: "東京都",
      password: "password"
    )

    login_as(captain)
    post "/teams", params: { name: "FC Pending" }
    team_id = json["team"]["id"]

    6.times do |i|
      user = User.create!(
        name: "メンバーP#{i}",
        name_kana: "メンバーP#{i}",
        birth_date: "1990-01-01",
        phone: "090-3000-000#{i}",
        email: "mem-pending-#{i}@example.com",
        address: "東京都",
        password: "password"
      )
      TeamMember.create!(team_id: team_id, user_id: user.id, role: :member, status: :active, joined_at: Time.current)
    end

    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9998",
      email: "admin-pending@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )
    login_as(admin)
    post "/tournaments", params: {
      name: "大会名",
      event_date: "2026-05-10",
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-05-09"
    }
    tournament_id = json["tournament"]["id"]

    login_as(captain)
    post "/tournaments/#{tournament_id}/entries", params: { team_id: team_id }

    expect(response).to have_http_status(:forbidden)
    expect(json.dig("error", "code")).to eq("team_not_approved")
  end

  it "returns my entries in bulk by tournament ids" do
    captain = User.create!(
      name: "キャプテンB",
      name_kana: "キャプテンB",
      birth_date: "1990-01-01",
      phone: "090-2000-0000",
      email: "cap-bulk@example.com",
      address: "東京都",
      password: "password"
    )

    login_as(captain)
    post "/teams", params: { name: "FC Bulk" }
    team_id = json["team"]["id"]

    admin = User.create!(
      name: "運営B",
      name_kana: "ウンエイB",
      birth_date: "1990-01-01",
      phone: "090-2000-9999",
      email: "admin-bulk@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/tournaments", params: {
      name: "大会Bulk1",
      event_date: "2026-06-01",
      venue: "会場1",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-05-31"
    }
    tournament1 = json["tournament"]["id"]

    post "/tournaments", params: {
      name: "大会Bulk2",
      event_date: "2026-06-02",
      venue: "会場2",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-06-01"
    }
    tournament2 = json["tournament"]["id"]

    TournamentEntry.create!(
      tournament_id: tournament1,
      team_id: team_id,
      status: :approved,
      applied_at: Time.current
    )
    TournamentEntry.create!(
      tournament_id: tournament2,
      team_id: team_id,
      status: :pending,
      applied_at: Time.current
    )

    login_as(captain)
    get "/tournament_entries/me_bulk", params: { tournament_ids: "#{tournament1},#{tournament2}" }

    expect(response).to have_http_status(:ok)
    entries = json["entries_by_tournament"]
    expect(entries[tournament1.to_s]["status"]).to eq("approved")
    expect(entries[tournament2.to_s]["status"]).to eq("pending")
    expect(entries[tournament1.to_s]["team_id"]).to eq(team_id)
  end
end
