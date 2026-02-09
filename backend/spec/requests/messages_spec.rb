# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Messages", type: :request do
  it "allows admin to send message" do
    ActionMailer::Base.deliveries.clear

    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9999",
      email: "admin9@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )
    user = User.create!(
      name: "ユーザー",
      name_kana: "ユーザー",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "user9@example.com",
      address: "東京都",
      password: "password"
    )

    login_as(admin)
    post "/messages", params: { to_user_id: user.id, subject: "件名", body: "本文" }

    expect(response).to have_http_status(:created)
    expect(ActionMailer::Base.deliveries.length).to eq(1)
    expect(ActionMailer::Base.deliveries.first.to).to include("user9@example.com")
    expect(ActionMailer::Base.deliveries.first.subject).to include("件名")
  end
end
