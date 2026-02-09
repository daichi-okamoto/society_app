# frozen_string_literal: true

require "rails_helper"

RSpec.describe "TeamJoinRequests", type: :request do
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
end
