# frozen_string_literal: true

require "rails_helper"

RSpec.describe "PaymentMethods", type: :request do
  it "creates setup intent and customer for authenticated user" do
    user = User.create!(
      name: "参加者",
      name_kana: "サンカシャ",
      birth_date: "1990-01-01",
      phone: "090-1234-0000",
      email: "pm-user@example.com",
      address: "東京都",
      password: "password"
    )
    login_as(user)

    allow(Stripe::Customer).to receive(:create).and_return(OpenStruct.new(id: "cus_test_123"))
    allow(Stripe::SetupIntent).to receive(:create).and_return(OpenStruct.new(id: "seti_test_123", client_secret: "seti_secret_123"))

    post "/payments/setup_intent"

    expect(response).to have_http_status(:ok)
    expect(json["client_secret"]).to eq("seti_secret_123")
    expect(user.reload.stripe_customer_id).to eq("cus_test_123")
  end

  it "returns registered payment methods for customer" do
    user = User.create!(
      name: "参加者",
      name_kana: "サンカシャ",
      birth_date: "1990-01-01",
      phone: "090-1234-0001",
      email: "pm-list@example.com",
      address: "東京都",
      password: "password",
      stripe_customer_id: "cus_test_999",
      stripe_default_payment_method_id: "pm_test_default"
    )
    login_as(user)

    allow(Stripe::PaymentMethod).to receive(:list).and_return(
      OpenStruct.new(
        data: [
          OpenStruct.new(
            id: "pm_test_default",
            card: OpenStruct.new(brand: "visa", last4: "4242", exp_month: 12, exp_year: 2029)
          )
        ]
      )
    )
    allow(Stripe::Customer).to receive(:retrieve).and_return(
      OpenStruct.new(invoice_settings: OpenStruct.new(default_payment_method: "pm_test_default"))
    )

    get "/payments/methods"

    expect(response).to have_http_status(:ok)
    expect(json["methods"].size).to eq(1)
    expect(json["methods"].first["is_default"]).to eq(true)
  end
end
