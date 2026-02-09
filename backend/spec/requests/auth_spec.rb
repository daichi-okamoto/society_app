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
