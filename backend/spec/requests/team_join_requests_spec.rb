# frozen_string_literal: true

require "rails_helper"

RSpec.describe "TeamJoinRequests", type: :request do
  it "returns pending requests with requester details for captain" do
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap-index@example.com",
      address: "東京都",
      password: "password"
    )
    member = User.create!(
      name: "申請者",
      name_kana: "シンセイシャ",
      birth_date: "1991-01-01",
      phone: "090-0000-0002",
      email: "requester@example.com",
      address: "長野県",
      password: "password"
    )

    login_as(captain)
    post "/teams", params: { name: "FC Example" }
    team_id = json["team"]["id"]
    join_code = json["team"]["join_code"]

    post "/auth/login", params: { email: "requester@example.com", password: "password" }
    post "/teams/#{team_id}/join-requests", params: { join_code: join_code }

    post "/auth/login", params: { email: "cap-index@example.com", password: "password" }
    get "/teams/#{team_id}/join-requests"

    expect(response).to have_http_status(:ok)
    expect(json["join_requests"].size).to eq(1)
    expect(json["join_requests"][0]["user_name"]).to eq("申請者")
    expect(json["join_requests"][0]["user_email"]).to eq("requester@example.com")
  end

  it "notifies the team captain when a join request is created" do
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap-notify@example.com",
      address: "東京都",
      password: "password"
    )
    member = User.create!(
      name: "申請者",
      name_kana: "シンセイシャ",
      birth_date: "1991-01-01",
      phone: "090-0000-0002",
      email: "requester-notify@example.com",
      address: "長野県",
      password: "password"
    )

    login_as(captain)
    post "/teams", params: { name: "FC Example" }
    team_id = json["team"]["id"]
    join_code = json["team"]["join_code"]

    post "/auth/login", params: { email: "requester-notify@example.com", password: "password" }
    post "/teams/#{team_id}/join-requests", params: { join_code: join_code }

    notification = Notification.order(:created_at).last
    target = notification.notification_targets.first

    expect(response).to have_http_status(:created)
    expect(notification.title).to eq("新しい参加申請があります")
    expect(notification.body).to include("申請者")
    expect(notification.link_path).to eq("/teams/#{team_id}/requests")
    expect(target.user?).to eq(true)
    expect(target.target_id).to eq(captain.id)
  end

  it "allows captain to approve a join request" do
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap2@example.com",
      address: "東京都",
      password: "password"
    )
    member = User.create!(
      name: "メンバー",
      name_kana: "メンバー",
      birth_date: "1990-01-01",
      phone: "090-0000-0001",
      email: "mem2@example.com",
      address: "東京都",
      password: "password"
    )

    login_as(captain)
    post "/teams", params: { name: "FC Example" }
    team_id = json["team"]["id"]
    join_code = json["team"]["join_code"]

    post "/auth/login", params: { email: "mem2@example.com", password: "password" }
    post "/teams/#{team_id}/join-requests", params: { join_code: join_code }
    join_request_id = json["join_request"]["id"]

    post "/auth/login", params: { email: "cap2@example.com", password: "password" }
    patch "/team_join_requests/#{join_request_id}", params: { status: "approved" }

    expect(response).to have_http_status(:ok)
    expect(json["join_request"]["status"]).to eq("approved")
    expect(TeamMember.exists?(team_id: team_id, user_id: member.id)).to eq(true)
  end

  it "forbids non-captain from reading join requests" do
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap-forbid@example.com",
      address: "東京都",
      password: "password"
    )
    member = User.create!(
      name: "メンバー",
      name_kana: "メンバー",
      birth_date: "1990-01-01",
      phone: "090-0000-0001",
      email: "mem-forbid@example.com",
      address: "東京都",
      password: "password"
    )

    login_as(captain)
    post "/teams", params: { name: "FC Example" }
    team_id = json["team"]["id"]

    post "/auth/login", params: { email: "mem-forbid@example.com", password: "password" }
    get "/teams/#{team_id}/join-requests"

    expect(response).to have_http_status(:forbidden)
  end
end
