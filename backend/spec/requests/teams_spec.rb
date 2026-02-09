# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Teams", type: :request do
  describe "GET /teams" do
    it "requires authentication" do
      get "/teams"
      expect(response).to have_http_status(:unauthorized)
    end
  end

  describe "POST /teams" do
    it "requires authentication" do
      post "/teams", params: { name: "FC Example" }
      expect(response).to have_http_status(:unauthorized)
    end

    it "creates a team" do
      user = User.create!(
        name: "山田太郎",
        name_kana: "ヤマダタロウ",
        birth_date: "1990-01-01",
        phone: "090-0000-0000",
        email: "user@example.com",
        address: "東京都",
        password: "password"
      )

      login_as(user)
      post "/teams", params: { name: "FC Example" }

      expect(response).to have_http_status(:created)
      expect(json["team"]["name"]).to eq("FC Example")
      expect(json["team"]["join_code"]).to be_present
    end
  end

  describe "POST /teams/:id/join-requests" do
    it "creates join request with valid code" do
      captain = User.create!(
        name: "キャプテン",
        name_kana: "キャプテン",
        birth_date: "1990-01-01",
        phone: "090-0000-0000",
        email: "cap@example.com",
        address: "東京都",
        password: "password"
      )
      member = User.create!(
        name: "メンバー",
        name_kana: "メンバー",
        birth_date: "1990-01-01",
        phone: "090-0000-0001",
        email: "mem@example.com",
        address: "東京都",
        password: "password"
      )

      login_as(captain)
      post "/teams", params: { name: "FC Example" }
      team_id = json["team"]["id"]
      join_code = json["team"]["join_code"]

      post "/auth/login", params: { email: "mem@example.com", password: "password" }
      post "/teams/#{team_id}/join-requests", params: { join_code: join_code }

      expect(response).to have_http_status(:created)
      expect(json["join_request"]["status"]).to eq("pending")
    end
  end
end
