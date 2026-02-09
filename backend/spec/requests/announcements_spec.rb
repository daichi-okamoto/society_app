# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Announcements", type: :request do
  it "is public to list" do
    get "/announcements"
    expect(response).to have_http_status(:ok)
  end

  it "allows admin to create" do
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9999",
      email: "admin8@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/announcements", params: { title: "お知らせ", body: "本文" }

    expect(response).to have_http_status(:created)
  end
end
