# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Exports", type: :request do
  it "allows admin to download insurance CSV" do
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9999",
      email: "admin7@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap12@example.com",
      address: "東京都",
      password: "password"
    )

    login_as(captain)
    post "/teams", params: { name: "FC Example" }
    team_id = json["team"]["id"]
    # captain is already added as team member in TeamsController#create

    login_as(admin)
    get "/exports/insurance"

    expect(response).to have_http_status(:ok)
    expect(response.content_type).to include("text/csv")
  end
end
