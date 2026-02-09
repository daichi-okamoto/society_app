# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Tournaments", type: :request do
  describe "GET /tournaments" do
    it "is public" do
      get "/tournaments"
      expect(response).to have_http_status(:ok)
    end
  end

  describe "POST /tournaments" do
    it "requires admin" do
      post "/tournaments", params: { name: "大会名" }
      expect(response).to have_http_status(:forbidden).or have_http_status(:unauthorized)
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
