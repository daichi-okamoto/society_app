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

  it "does not allow a user to mark another user's notification as read" do
    recipient = User.create!(
      name: "受信者",
      name_kana: "ジュシンシャ",
      birth_date: "1990-01-01",
      phone: "090-1000-0000",
      email: "notify-recipient@example.com",
      address: "東京都",
      password: "password"
    )
    other_user = User.create!(
      name: "別ユーザー",
      name_kana: "ベツユーザー",
      birth_date: "1990-01-01",
      phone: "090-1000-0001",
      email: "notify-other@example.com",
      address: "東京都",
      password: "password"
    )
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-1000-9999",
      email: "notify-admin-2@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    notification = Notification.create!(
      title: "限定通知",
      body: "受信者のみ",
      scheduled_at: Time.current,
      created_by: admin.id,
      sent_at: Time.current,
      delivery_scope: "specific_users",
      deliver_via_push: true,
      deliver_via_email: false
    )
    NotificationTarget.create!(notification: notification, target_type: :user, target_id: recipient.id)

    login_as(other_user)
    post "/notifications/#{notification.id}/read"

    expect(response).to have_http_status(:not_found)
    expect(NotificationRead.find_by(notification_id: notification.id, user_id: other_user.id)).to be_nil
  end
end
