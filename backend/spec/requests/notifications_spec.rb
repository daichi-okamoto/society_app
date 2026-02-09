# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Notifications", type: :request do
  it "requires admin for create" do
    post "/notifications", params: { title: "t", body: "b", scheduled_at: Time.current, target_type: "everyone" }
    expect(response).to have_http_status(:forbidden).or have_http_status(:unauthorized)
  end

  it "allows user to fetch unread list" do
    user = User.create!(
      name: "参加者",
      name_kana: "サンカシャ",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "notify-user@example.com",
      address: "東京都",
      password: "password"
    )
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9999",
      email: "notify-admin@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/notifications", params: {
      title: "お知らせ",
      body: "本文",
      scheduled_at: Time.current,
      target_type: "everyone"
    }
    expect(response).to have_http_status(:created)

    login_as(user)
    get "/notifications"
    expect(response).to have_http_status(:ok)
    expect(json["unread_count"]).to eq(1)
  end
end
