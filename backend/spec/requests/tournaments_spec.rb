# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Tournaments", type: :request do
  describe "GET /tournaments" do
    it "is public" do
      get "/tournaments"
      expect(response).to have_http_status(:ok)
    end
  end

  describe "GET /tournaments/:id" do
    it "returns detail fields used by public page" do
      tournament = Tournament.create!(
        name: "大会名",
        event_date: "2026-05-01",
        venue: "会場",
        match_half_minutes: 12,
        max_teams: 10,
        entry_fee_amount: 10000,
        entry_fee_currency: "JPY",
        cancel_deadline_date: "2026-04-30",
        description: "大会概要",
        rules: "スパイク禁止",
        cautions: "雨天決行",
        start_time: "19:00",
        end_time: "21:00"
      )

      get "/tournaments/#{tournament.id}"

      expect(response).to have_http_status(:ok)
      expect(json["tournament"]["description"]).to eq("大会概要")
      expect(json["tournament"]["rules"]).to eq("スパイク禁止")
      expect(json["tournament"]["cautions"]).to eq("雨天決行")
      expect(json["tournament"]["start_time"]).to be_present
      expect(json["tournament"]["end_time"]).to be_present
    end

    it "returns the latest tournament image url when present" do
      admin = User.create!(
        name: "管理者",
        name_kana: "カンリシャ",
        birth_date: "1990-01-01",
        phone: "090-1111-1111",
        email: "admin-image@example.com",
        address: "東京都",
        password: "password",
        role: :admin
      )

      tournament = Tournament.create!(
        name: "画像付き大会",
        event_date: "2026-05-01",
        venue: "会場",
        match_half_minutes: 12,
        max_teams: 10,
        entry_fee_amount: 10000,
        entry_fee_currency: "JPY",
        cancel_deadline_date: "2026-04-30"
      )

      tournament.tournament_images.create!(
        uploaded_by: admin.id,
        file_url: "https://cdn.example.com/cover.jpg",
        file_name: "cover.jpg",
        content_type: "image/jpeg",
        size_bytes: 1234
      )

      get "/tournaments/#{tournament.id}"

      expect(response).to have_http_status(:ok)
      expect(json["tournament"]["image_url"]).to eq("https://cdn.example.com/cover.jpg")
    end
  end

  describe "POST /tournaments" do
    it "requires admin" do
      post "/tournaments", params: { name: "大会名" }
      expect(response).to have_http_status(:forbidden).or have_http_status(:unauthorized)
    end
  end

  describe "PATCH /tournaments/:id" do
    it "updates tournament fields for admin" do
      admin = User.create!(
        name: "管理者",
        name_kana: "カンリシャ",
        birth_date: "1990-01-01",
        phone: "090-1111-1111",
        email: "admin-tournaments@example.com",
        address: "東京都",
        password: "password",
        role: :admin
      )

      tournament = Tournament.create!(
        name: "大会名",
        event_date: "2026-05-01",
        venue: "会場",
        match_half_minutes: 12,
        max_teams: 10,
        entry_fee_amount: 10000,
        entry_fee_currency: "JPY",
        cancel_deadline_date: "2026-04-30"
      )

      login_as(admin)

      patch "/tournaments/#{tournament.id}", params: {
        venue: "新会場",
        description: "新しい概要",
        rules: "新ルール",
        cautions: "新注意事項",
        start_time: "18:00",
        end_time: "20:00",
        max_teams: 16
      }

      expect(response).to have_http_status(:ok)
      tournament.reload
      expect(tournament.venue).to eq("新会場")
      expect(tournament.description).to eq("新しい概要")
      expect(tournament.rules).to eq("新ルール")
      expect(tournament.cautions).to eq("新注意事項")
      expect(tournament.start_time.strftime("%H:%M")).to eq("18:00")
      expect(tournament.end_time.strftime("%H:%M")).to eq("20:00")
      expect(tournament.max_teams).to eq(16)
    end
  end

  describe "DELETE /tournaments/:id" do
    it "requires admin" do
      tournament = Tournament.create!(
        name: "大会名",
        event_date: "2026-05-01",
        venue: "会場",
        match_half_minutes: 12,
        max_teams: 10,
        entry_fee_amount: 10000,
        entry_fee_currency: "JPY",
        cancel_deadline_date: "2026-04-30"
      )
      delete "/tournaments/#{tournament.id}"
      expect(response).to have_http_status(:forbidden).or have_http_status(:unauthorized)
    end
  end
end
