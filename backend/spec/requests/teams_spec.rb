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
      post "/teams", params: {
        name: "FC Example",
        activity_area: "東京都渋谷区",
        introduction: "社会人中心のチームです"
      }

      expect(response).to have_http_status(:created)
      expect(json["team"]["name"]).to eq("FC Example")
      expect(json["team"]["activity_area"]).to eq("東京都渋谷区")
      expect(json["team"]["introduction"]).to eq("社会人中心のチームです")
      expect(json["team"]["join_code"]).to be_present
      expect(json["team"]["join_code"]).to match(/\ATS-\d{6}\z/)
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

  describe "PATCH /teams/:id/moderate" do
    it "reactivates a suspended team captain when decision is reactivate" do
      admin = User.create!(
        name: "管理者",
        name_kana: "カンリシャ",
        birth_date: "1990-01-01",
        phone: "090-1111-1111",
        email: "admin-reactivate@example.com",
        address: "東京都",
        password: "password",
        role: :admin
      )
      captain = User.create!(
        name: "停止中キャプテン",
        name_kana: "テイシチュウキャプテン",
        birth_date: "1992-01-01",
        phone: "090-2222-2222",
        email: "captain-reactivate@example.com",
        address: "東京都",
        password: "password",
        status: :suspended
      )
      team = Team.create!(
        name: "FC Reactivate",
        join_code: "TS-654321",
        captain_user_id: captain.id,
        created_by: admin.id,
        approval_status: :approved
      )
      TeamMember.create!(team: team, user: captain, role: :captain, status: :active, joined_at: Time.current)

      login_as(admin)
      patch "/teams/#{team.id}/moderate", params: { decision: "reactivate" }

      expect(response).to have_http_status(:ok)
      expect(captain.reload.status).to eq("active")
      expect(json.dig("team", "status")).to eq("approved")
    end
  end

  describe "PATCH /teams/:id" do
    it "updates team profile fields" do
      captain = User.create!(
        name: "キャプテン",
        name_kana: "キャプテン",
        birth_date: "1990-01-01",
        phone: "090-0000-0000",
        email: "captain-update@example.com",
        address: "東京都",
        password: "password"
      )
      team = Team.create!(
        name: "FC Example",
        join_code: "TS-111111",
        captain_user_id: captain.id,
        created_by: captain.id,
        approval_status: :approved,
        activity_area: "東京都港区",
        introduction: "旧紹介文"
      )
      TeamMember.create!(team: team, user: captain, role: :captain, status: :active, joined_at: Time.current)

      login_as(captain)
      patch "/teams/#{team.id}", params: {
        name: "FC Updated",
        activity_area: "東京都新宿区",
        introduction: "新しい紹介文"
      }

      expect(response).to have_http_status(:ok)
      expect(team.reload.name).to eq("FC Updated")
      expect(team.activity_area).to eq("東京都新宿区")
      expect(team.introduction).to eq("新しい紹介文")
      expect(json["team"]["activity_area"]).to eq("東京都新宿区")
      expect(json["team"]["introduction"]).to eq("新しい紹介文")
    end
  end
end
