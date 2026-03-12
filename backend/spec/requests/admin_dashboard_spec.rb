# frozen_string_literal: true

require "rails_helper"

RSpec.describe "AdminDashboard", type: :request do
  let!(:admin) do
    User.create!(
      name: "管理者",
      name_kana: "カンリシャ",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "admin-dashboard@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )
  end

  let!(:captain) do
    User.create!(
      name: "代表者",
      name_kana: "ダイヒョウシャ",
      birth_date: "1992-01-01",
      phone: "090-1111-1111",
      email: "captain-dashboard@example.com",
      address: "東京都",
      password: "password"
    )
  end

  before do
    post "/auth/login", params: { email: admin.email, password: "password" }
  end

  it "returns dynamic admin task counts" do
    Team.create!(
      name: "未承認チーム",
      join_code: "PENDING1",
      captain_user_id: captain.id,
      created_by: admin.id,
      approval_status: :pending
    )

    approved_team = Team.create!(
      name: "承認済みチーム",
      join_code: "APPROVE1",
      captain_user_id: captain.id,
      created_by: admin.id,
      approval_status: :approved
    )

    roster_target = Tournament.create!(
      name: "名簿督促対象大会",
      event_date: Date.current + 3.days,
      venue: "A会場",
      match_half_minutes: 10,
      max_teams: 12,
      entry_fee_amount: 10000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: Date.current + 1.day,
      description: "desc"
    )

    roster_entry = TournamentEntry.create!(
      tournament: roster_target,
      team: approved_team,
      status: :approved,
      applied_at: 1.day.ago,
      decided_at: 12.hours.ago,
      decided_by: admin.id
    )

    roster_done_tournament = Tournament.create!(
      name: "名簿提出済み大会",
      event_date: Date.current + 2.days,
      venue: "B会場",
      match_half_minutes: 10,
      max_teams: 12,
      entry_fee_amount: 10000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: Date.current + 1.day,
      description: "desc"
    )

    roster_done_entry = TournamentEntry.create!(
      tournament: roster_done_tournament,
      team: approved_team,
      status: :approved,
      applied_at: 1.day.ago,
      decided_at: 12.hours.ago,
      decided_by: admin.id
    )

    EntryRoster.create!(
      tournament_entry: roster_done_entry,
      submitted_by_user: captain,
      submitted_at: Time.current
    )

    match_missing_tournament = Tournament.create!(
      name: "対戦表未作成大会",
      event_date: Date.current + 7.days,
      venue: "C会場",
      match_half_minutes: 10,
      max_teams: 12,
      entry_fee_amount: 10000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: Date.current + 3.days,
      description: "desc"
    )

    match_ready_tournament = Tournament.create!(
      name: "対戦表作成済み大会",
      event_date: Date.current + 6.days,
      venue: "D会場",
      match_half_minutes: 10,
      max_teams: 12,
      entry_fee_amount: 10000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: Date.current + 3.days,
      description: "desc"
    )

    another_team = Team.create!(
      name: "対戦相手チーム",
      join_code: "OPPNT01",
      captain_user_id: captain.id,
      created_by: admin.id,
      approval_status: :approved
    )

    Match.create!(
      tournament: match_ready_tournament,
      home_team: approved_team,
      away_team: another_team,
      kickoff_at: (Date.current + 6.days).to_time.change(hour: 10),
      field: "Aコート"
    )

    get "/admin/dashboard"

    expect(response).to have_http_status(:ok)

    pending_task = json["tasks"].find { |task| task["id"] == "teams" }
    roster_task = json["tasks"].find { |task| task["id"] == "roster" }
    matches_task = json["tasks"].find { |task| task["id"] == "matches" }

    expect(pending_task["count"]).to eq(1)
    expect(pending_task["href"]).to eq("/admin/teams/pending")

    expect(roster_task["count"]).to eq(1)
    expect(roster_task["href"]).to eq("/admin/entries")

    expect(matches_task["count"]).to eq(3)
    expect(matches_task["href"]).to eq("/admin/matches?tournamentId=#{roster_done_tournament.id}")
  end

  it "rejects non-admin users" do
    delete "/auth/logout"

    user = User.create!(
      name: "一般",
      name_kana: "イッパン",
      birth_date: "1990-01-01",
      phone: "090-2222-2222",
      email: "user-dashboard@example.com",
      address: "東京都",
      password: "password"
    )

    post "/auth/login", params: { email: user.email, password: "password" }
    get "/admin/dashboard"

    expect(response).to have_http_status(:forbidden)
  end
end
