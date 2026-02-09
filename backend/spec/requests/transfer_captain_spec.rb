# frozen_string_literal: true

require "rails_helper"

RSpec.describe "TransferCaptain", type: :request do
  it "transfers captain role to another member" do
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap4@example.com",
      address: "東京都",
      password: "password"
    )
    member = User.create!(
      name: "メンバー",
      name_kana: "メンバー",
      birth_date: "1990-01-01",
      phone: "090-0000-0001",
      email: "mem4@example.com",
      address: "東京都",
      password: "password"
    )

    login_as(captain)
    post "/teams", params: { name: "FC Example" }
    team_id = json["team"]["id"]
    join_code = json["team"]["join_code"]

    post "/auth/login", params: { email: "mem4@example.com", password: "password" }
    post "/teams/#{team_id}/join-requests", params: { join_code: join_code }
    join_request_id = json["join_request"]["id"]

    post "/auth/login", params: { email: "cap4@example.com", password: "password" }
    patch "/team-join-requests/#{join_request_id}", params: { status: "approved" }

    post "/teams/#{team_id}/transfer_captain", params: { new_captain_user_id: member.id }

    expect(response).to have_http_status(:ok)
    team = Team.find(team_id)
    expect(team.captain_user_id).to eq(member.id)
  end
end
