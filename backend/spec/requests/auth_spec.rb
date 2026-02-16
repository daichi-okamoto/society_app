# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Auth", type: :request do
  describe "POST /auth/register" do
    it "registers a user" do
      params = {
        name: "山田太郎",
        name_kana: "ヤマダタロウ",
        birth_date: "1990-01-01",
        phone: "090-0000-0000",
        email: "user@example.com",
        address: "東京都",
        password: "password"
      }

      post "/auth/register", params: params

      expect(response).to have_http_status(:created)
      expect(json["user"]["email"]).to eq("user@example.com")
    end
  end

  describe "POST /auth/admin/register" do
    it "registers an admin user with valid invite code" do
      params = {
        name: "管理者 太郎",
        name_kana: "カンリシャタロウ",
        birth_date: "1990-01-01",
        phone: "090-0000-0000",
        email: "admin-register@example.com",
        address: "東京都",
        password: "password",
        admin_invite_code: "dev-admin-signup-code"
      }

      post "/auth/admin/register", params: params

      expect(response).to have_http_status(:created)
      expect(json["user"]["email"]).to eq("admin-register@example.com")
      expect(json["user"]["role"]).to eq("admin")
    end

    it "rejects admin registration with invalid invite code" do
      params = {
        name: "管理者 太郎",
        name_kana: "カンリシャタロウ",
        birth_date: "1990-01-01",
        phone: "090-0000-0000",
        email: "admin-rejected@example.com",
        address: "東京都",
        password: "password",
        admin_invite_code: "invalid-code"
      }

      post "/auth/admin/register", params: params

      expect(response).to have_http_status(:unauthorized)
      expect(json.dig("error", "code")).to eq("unauthorized_admin_registration")
    end
  end

  describe "POST /auth/login" do
    it "logs in with valid credentials" do
      User.create!(
        name: "山田太郎",
        name_kana: "ヤマダタロウ",
        birth_date: "1990-01-01",
        phone: "090-0000-0000",
        email: "user@example.com",
        address: "東京都",
        password: "password"
      )

      post "/auth/login", params: { email: "user@example.com", password: "password" }

      expect(response).to have_http_status(:ok)
      expect(json["user"]).to be_present
    end
  end

  describe "GET /users/me" do
    it "requires authentication" do
      get "/users/me"
      expect(response).to have_http_status(:unauthorized)
    end

    it "returns current user when logged in" do
      User.create!(
        name: "山田太郎",
        name_kana: "ヤマダタロウ",
        birth_date: "1990-01-01",
        phone: "090-0000-0000",
        email: "user@example.com",
        address: "東京都",
        password: "password"
      )

      post "/auth/login", params: { email: "user@example.com", password: "password" }
      get "/users/me"

      expect(response).to have_http_status(:ok)
      expect(json["user"]["email"]).to eq("user@example.com")
    end
  end
end
