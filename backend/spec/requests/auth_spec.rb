# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Auth", type: :request do
  around do |example|
    original_test_mode = OmniAuth.config.test_mode
    original_mock_auth = OmniAuth.config.mock_auth[:google_oauth2]
    original_google_client_id = ENV["GOOGLE_CLIENT_ID"]
    original_google_client_secret = ENV["GOOGLE_CLIENT_SECRET"]
    OmniAuth.config.test_mode = true
    ENV["GOOGLE_CLIENT_ID"] = "test-google-client-id"
    ENV["GOOGLE_CLIENT_SECRET"] = "test-google-client-secret"
    example.run
  ensure
    OmniAuth.config.test_mode = original_test_mode
    OmniAuth.config.mock_auth[:google_oauth2] = original_mock_auth
    ENV["GOOGLE_CLIENT_ID"] = original_google_client_id
    ENV["GOOGLE_CLIENT_SECRET"] = original_google_client_secret
  end

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

  describe "GET /auth/google" do
    it "redirects to the devise google oauth entrypoint" do
      get "/auth/google", params: { redirect_to: "/app/home" }

      expect(response).to have_http_status(:found)
      expect(response.headers["Location"]).to end_with("/users/auth/google_oauth2")
    end
  end

  describe "GET /users/auth/google_oauth2/callback" do
    let(:google_auth) do
      OmniAuth::AuthHash.new(
        provider: "google_oauth2",
        uid: "google-uid-123",
        info: {
          email: "google-user@example.com",
          name: "Google User"
        }
      )
    end

    it "creates a user, signs them in, and redirects to the frontend" do
      OmniAuth.config.mock_auth[:google_oauth2] = google_auth

      get "/auth/google", params: { redirect_to: "/app/home", success_message: "Googleアカウントで登録しました。" }
      get "/users/auth/google_oauth2/callback"

      expect(response).to have_http_status(:found)
      expect(response.headers["Location"]).to eq(
        "http://localhost:5173/app/home?flash_type=success&flash_message=Google%E3%82%A2%E3%82%AB%E3%82%A6%E3%83%B3%E3%83%88%E3%81%A7%E7%99%BB%E9%8C%B2%E3%81%97%E3%81%BE%E3%81%97%E3%81%9F%E3%80%82"
      )
      expect(User.find_by(email: "google-user@example.com")).to be_present

      get "/users/me"
      expect(response).to have_http_status(:ok)
      expect(json["user"]["email"]).to eq("google-user@example.com")
    end

    it "links an existing account by email instead of creating a duplicate" do
      user = User.create!(
        name: "既存ユーザー",
        name_kana: "キソンユーザー",
        birth_date: "1990-01-01",
        phone: "090-0000-0000",
        email: "google-user@example.com",
        address: "東京都",
        password: "password"
      )
      OmniAuth.config.mock_auth[:google_oauth2] = google_auth

      get "/auth/google", params: { redirect_to: "/app/home", success_message: "Googleアカウントでログインしました。" }
      get "/users/auth/google_oauth2/callback"

      expect(response).to have_http_status(:found)
      expect(User.where(email: "google-user@example.com").count).to eq(1)
      expect(user.reload.provider).to eq("google_oauth2")
      expect(user.uid).to eq("google-uid-123")
    end

    it "allows admin login only for existing admin users" do
      admin = User.create!(
        name: "管理者",
        name_kana: "カンリシャ",
        birth_date: "1990-01-01",
        phone: "090-1111-1111",
        email: "google-user@example.com",
        address: "東京都",
        password: "password",
        role: :admin
      )
      OmniAuth.config.mock_auth[:google_oauth2] = google_auth

      get "/auth/google", params: {
        redirect_to: "/admin",
        failure_redirect_to: "/admin/login",
        success_message: "Googleアカウントで管理画面にログインしました。",
        role: "admin",
        admin_intent: "login"
      }
      get "/users/auth/google_oauth2/callback"

      expect(response).to have_http_status(:found)
      expect(response.headers["Location"]).to include("/admin?flash_type=success")
      expect(admin.reload.uid).to eq("google-uid-123")
    end

    it "rejects admin google login for non-admin users" do
      OmniAuth.config.mock_auth[:google_oauth2] = google_auth

      get "/auth/google", params: {
        redirect_to: "/admin",
        failure_redirect_to: "/admin/login",
        role: "admin",
        admin_intent: "login"
      }
      get "/users/auth/google_oauth2/callback"

      expect(response).to have_http_status(:found)
      expect(response.headers["Location"]).to eq("http://localhost:5173/admin/login?oauth_error=admin_required")
      expect(User.find_by(email: "google-user@example.com")).to be_nil
    end

    it "registers an admin account with google when the invite code is valid" do
      OmniAuth.config.mock_auth[:google_oauth2] = google_auth

      get "/auth/google", params: {
        redirect_to: "/admin",
        failure_redirect_to: "/admin/register",
        success_message: "Googleアカウントで管理者登録しました。",
        role: "admin",
        admin_intent: "register",
        admin_invite_code: "dev-admin-signup-code"
      }
      get "/users/auth/google_oauth2/callback"

      expect(response).to have_http_status(:found)
      expect(response.headers["Location"]).to include("/admin?flash_type=success")
      expect(User.find_by(email: "google-user@example.com")&.role).to eq("admin")
    end

    it "rejects admin google registration when the invite code is invalid" do
      OmniAuth.config.mock_auth[:google_oauth2] = google_auth

      get "/auth/google", params: {
        redirect_to: "/admin",
        failure_redirect_to: "/admin/register",
        role: "admin",
        admin_intent: "register",
        admin_invite_code: "invalid-code"
      }
      get "/users/auth/google_oauth2/callback"

      expect(response).to have_http_status(:found)
      expect(response.headers["Location"]).to eq("http://localhost:5173/admin/register?oauth_error=invalid_admin_invite_code")
      expect(User.find_by(email: "google-user@example.com")).to be_nil
    end
  end
end
