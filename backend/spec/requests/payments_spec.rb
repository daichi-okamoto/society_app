# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Payments", type: :request do
  it "creates checkout url for captain" do
    allow(Stripe::Checkout::Session).to receive(:create).and_return(OpenStruct.new(url: "https://example.com/checkout"))

    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap8@example.com",
      address: "東京都",
      password: "password"
    )

    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9999",
      email: "admin4@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/tournaments", params: {
      name: "大会名",
      event_date: "2026-05-01",
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-04-30"
    }
    tournament_id = json["tournament"]["id"]

    login_as(captain)
    post "/teams", params: { name: "FC Example" }
    team_id = json["team"]["id"]
    Team.find(team_id).update!(approval_status: :approved)

    6.times do |i|
      user = User.create!(
        name: "メンバー#{i}",
        name_kana: "メンバー#{i}",
        birth_date: "1990-01-01",
        phone: "090-0000-300#{i}",
        email: "mem8-#{i}@example.com",
        address: "東京都",
        password: "password"
      )
      TeamMember.create!(team_id: team_id, user_id: user.id, role: :member, status: :active, joined_at: Time.current)
    end

    post "/tournaments/#{tournament_id}/entries", params: { team_id: team_id }
    entry_id = json["entry"]["id"]

    post "/payments/stripe/checkout", params: { tournament_entry_id: entry_id }

    expect(response).to have_http_status(:ok)
    expect(json["checkout_url"]).to be_present
    expect(Stripe::Checkout::Session).to have_received(:create).with(hash_including(
      success_url: a_string_including("/tournaments/#{tournament_id}/entry/complete?payment=success"),
      cancel_url: a_string_including("/tournaments/#{tournament_id}/entry/confirm?payment=cancel")
    ))
  end

  it "returns embedded checkout client_secret when ui_mode is embedded" do
    allow(Stripe::Checkout::Session).to receive(:create).and_return(
      OpenStruct.new(
        id: "cs_test_embedded_123",
        client_secret: "cs_test_client_secret_123",
        url: nil
      )
    )

    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-7777-0000",
      email: "cap-embedded@example.com",
      address: "東京都",
      password: "password"
    )

    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-7777-9999",
      email: "admin-embedded@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/tournaments", params: {
      name: "大会名",
      event_date: "2026-07-01",
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-06-30"
    }
    tournament_id = json["tournament"]["id"]

    login_as(captain)
    post "/teams", params: { name: "FC Embedded" }
    team_id = json["team"]["id"]
    Team.find(team_id).update!(approval_status: :approved)

    6.times do |i|
      user = User.create!(
        name: "メンバーE#{i}",
        name_kana: "メンバーE#{i}",
        birth_date: "1990-01-01",
        phone: "090-8888-100#{i}",
        email: "mem-embedded-#{i}@example.com",
        address: "東京都",
        password: "password"
      )
      TeamMember.create!(team_id: team_id, user_id: user.id, role: :member, status: :active, joined_at: Time.current)
    end

    post "/tournaments/#{tournament_id}/entries", params: { team_id: team_id }
    entry_id = json["entry"]["id"]

    post "/payments/stripe/checkout", params: { tournament_entry_id: entry_id, ui_mode: "embedded" }

    expect(response).to have_http_status(:ok)
    expect(json["client_secret"]).to eq("cs_test_client_secret_123")
    expect(json["checkout_session_id"]).to eq("cs_test_embedded_123")
  end

  it "creates payment intent client_secret for payment element" do
    allow(Stripe::Customer).to receive(:create).and_return(OpenStruct.new(id: "cus_new_123"))
    allow(Stripe::PaymentIntent).to receive(:create).and_return(
      OpenStruct.new(
        id: "pi_new_123",
        client_secret: "pi_new_secret_123",
        status: "requires_payment_method"
      )
    )

    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-7171-0000",
      email: "cap-intent@example.com",
      address: "東京都",
      password: "password"
    )

    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-7171-9999",
      email: "admin-intent@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/tournaments", params: {
      name: "大会名",
      event_date: "2026-07-01",
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-06-30"
    }
    tournament_id = json["tournament"]["id"]

    login_as(captain)
    post "/teams", params: { name: "FC Intent" }
    team_id = json["team"]["id"]
    Team.find(team_id).update!(approval_status: :approved)

    6.times do |i|
      user = User.create!(
        name: "メンバーI#{i}",
        name_kana: "メンバーI#{i}",
        birth_date: "1990-01-01",
        phone: "090-7171-10#{i}0",
        email: "mem-intent-#{i}@example.com",
        address: "東京都",
        password: "password"
      )
      TeamMember.create!(team_id: team_id, user_id: user.id, role: :member, status: :active, joined_at: Time.current)
    end

    post "/tournaments/#{tournament_id}/entries", params: { team_id: team_id }
    entry_id = json["entry"]["id"]

    post "/payments/intent", params: { tournament_entry_id: entry_id }

    expect(response).to have_http_status(:ok)
    expect(json["client_secret"]).to eq("pi_new_secret_123")
    expect(json["payment_intent_id"]).to eq("pi_new_123")
    expect(Payment.where(tournament_entry_id: entry_id).order(id: :desc).first.stripe_payment_intent_id).to eq("pi_new_123")
  end

  it "reuses existing pending payment for same entry" do
    allow(Stripe::Checkout::Session).to receive(:create).and_return(OpenStruct.new(url: "https://example.com/checkout"))

    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-1111-0000",
      email: "cap-reuse@example.com",
      address: "東京都",
      password: "password"
    )
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-1111-9999",
      email: "admin-reuse@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/tournaments", params: {
      name: "大会名",
      event_date: "2026-06-01",
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-05-31"
    }
    tournament_id = json["tournament"]["id"]

    login_as(captain)
    post "/teams", params: { name: "FC Reuse" }
    team_id = json["team"]["id"]
    Team.find(team_id).update!(approval_status: :approved)
    6.times do |i|
      user = User.create!(
        name: "メンバーR#{i}",
        name_kana: "メンバーR#{i}",
        birth_date: "1990-01-01",
        phone: "090-3333-100#{i}",
        email: "mem-reuse-#{i}@example.com",
        address: "東京都",
        password: "password"
      )
      TeamMember.create!(team_id: team_id, user_id: user.id, role: :member, status: :active, joined_at: Time.current)
    end

    post "/tournaments/#{tournament_id}/entries", params: { team_id: team_id }
    entry_id = json["entry"]["id"]

    post "/payments/stripe/checkout", params: { tournament_entry_id: entry_id }
    post "/payments/stripe/checkout", params: { tournament_entry_id: entry_id }

    expect(Payment.where(tournament_entry_id: entry_id).count).to eq(1)
  end

  it "returns already_paid when paid payment exists" do
    allow(Stripe::Checkout::Session).to receive(:create)

    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-2222-0000",
      email: "cap-paid@example.com",
      address: "東京都",
      password: "password"
    )
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-2222-9999",
      email: "admin-paid@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/tournaments", params: {
      name: "大会名",
      event_date: "2026-06-10",
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-06-09"
    }
    tournament_id = json["tournament"]["id"]

    login_as(captain)
    post "/teams", params: { name: "FC Paid" }
    team_id = json["team"]["id"]
    Team.find(team_id).update!(approval_status: :approved)
    6.times do |i|
      user = User.create!(
        name: "メンバーP#{i}",
        name_kana: "メンバーP#{i}",
        birth_date: "1990-01-01",
        phone: "090-4444-100#{i}",
        email: "mem-paid-#{i}@example.com",
        address: "東京都",
        password: "password"
      )
      TeamMember.create!(team_id: team_id, user_id: user.id, role: :member, status: :active, joined_at: Time.current)
    end
    post "/tournaments/#{tournament_id}/entries", params: { team_id: team_id }
    entry_id = json["entry"]["id"]

    Payment.create!(
      tournament_entry_id: entry_id,
      amount: 20000,
      currency: "JPY",
      method: :card,
      status: :paid,
      paid_at: Time.current
    )

    post "/payments/stripe/checkout", params: { tournament_entry_id: entry_id }

    expect(response).to have_http_status(:ok)
    expect(json["already_paid"]).to eq(true)
    expect(Stripe::Checkout::Session).not_to have_received(:create)
  end

  it "returns latest payment for entry captain" do
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-5555-0000",
      email: "cap-latest@example.com",
      address: "東京都",
      password: "password"
    )

    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-5555-9999",
      email: "admin-latest@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/tournaments", params: {
      name: "大会名",
      event_date: "2026-06-20",
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-06-19"
    }
    tournament_id = json["tournament"]["id"]

    login_as(captain)
    post "/teams", params: { name: "FC Latest" }
    team_id = json["team"]["id"]
    Team.find(team_id).update!(approval_status: :approved)
    6.times do |i|
      user = User.create!(
        name: "メンバーL#{i}",
        name_kana: "メンバーL#{i}",
        birth_date: "1990-01-01",
        phone: "090-6666-100#{i}",
        email: "mem-latest-#{i}@example.com",
        address: "東京都",
        password: "password"
      )
      TeamMember.create!(team_id: team_id, user_id: user.id, role: :member, status: :active, joined_at: Time.current)
    end
    post "/tournaments/#{tournament_id}/entries", params: { team_id: team_id }
    entry_id = json["entry"]["id"]
    Payment.create!(
      tournament_entry_id: entry_id,
      amount: 20000,
      currency: "JPY",
      method: :card,
      status: :paid,
      paid_at: Time.current
    )

    get "/payments/latest", params: { tournament_entry_id: entry_id }

    expect(response).to have_http_status(:ok)
    expect(json.dig("payment", "status")).to eq("paid")
  end

  it "charges directly with saved card when requested" do
    allow(Stripe::PaymentIntent).to receive(:create).and_return(OpenStruct.new(id: "pi_saved_123"))

    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-7777-0001",
      email: "cap-direct@example.com",
      address: "東京都",
      password: "password",
      stripe_customer_id: "cus_saved_123",
      stripe_default_payment_method_id: "pm_saved_123"
    )
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-7777-9998",
      email: "admin-direct@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )

    login_as(admin)
    post "/tournaments", params: {
      name: "大会名",
      event_date: "2026-07-10",
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-07-09"
    }
    tournament_id = json["tournament"]["id"]

    login_as(captain)
    post "/teams", params: { name: "FC Direct" }
    team_id = json["team"]["id"]
    Team.find(team_id).update!(approval_status: :approved)
    6.times do |i|
      user = User.create!(
        name: "メンバーD#{i}",
        name_kana: "メンバーD#{i}",
        birth_date: "1990-01-01",
        phone: "090-9898-100#{i}",
        email: "mem-direct-#{i}@example.com",
        address: "東京都",
        password: "password"
      )
      TeamMember.create!(team_id: team_id, user_id: user.id, role: :member, status: :active, joined_at: Time.current)
    end
    post "/tournaments/#{tournament_id}/entries", params: { team_id: team_id }
    entry_id = json["entry"]["id"]

    post "/payments/stripe/checkout", params: { tournament_entry_id: entry_id, use_saved_card: true }

    expect(response).to have_http_status(:ok)
    expect(json["direct_paid"]).to eq(true)
    expect(Payment.where(tournament_entry_id: entry_id).order(id: :desc).first.status).to eq("paid")
  end

  it "returns admin payments summary and rows" do
    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-9999-1111",
      email: "admin-payments-api@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-9999-2222",
      email: "captain-payments-api@example.com",
      address: "東京都",
      password: "password"
    )
    team = Team.create!(name: "API FC", captain_user: captain, created_by: captain.id, join_code: "API999")
    tournament = Tournament.create!(
      name: "API大会",
      event_date: "2026-08-01",
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 12000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-07-31"
    )
    entry = TournamentEntry.create!(
      tournament: tournament,
      team: team,
      status: :approved,
      applied_at: Time.current
    )
    Payment.create!(
      tournament_entry: entry,
      amount: 12000,
      currency: "JPY",
      method: :card,
      status: :paid,
      paid_at: Time.current
    )

    login_as(admin)
    get "/admin/payments"

    expect(response).to have_http_status(:ok)
    expect(json["summary"]).to be_present
    expect(json["payments"]).to be_an(Array)
    expect(json["payments"].first["team_name"]).to eq("API FC")
  end

  it "requires admin for refund" do
    payment = Payment.create!(
      tournament_entry: TournamentEntry.create!(
        tournament: Tournament.create!(
          name: "大会名",
          event_date: "2026-05-01",
          venue: "会場",
          match_half_minutes: 12,
          max_teams: 15,
          entry_fee_amount: 20000,
          entry_fee_currency: "JPY",
          cancel_deadline_date: "2026-04-30"
        ),
        team: Team.create!(
          name: "FC Example",
          captain_user: User.create!(
            name: "キャプテン",
            name_kana: "キャプテン",
            birth_date: "1990-01-01",
            phone: "090-0000-0000",
            email: "cap9@example.com",
            address: "東京都",
            password: "password"
          ),
          created_by: User.last.id,
          join_code: "ABC123"
        ),
        status: :pending,
        applied_at: Time.current
      ),
      amount: 20000,
      currency: "JPY",
      method: :card,
      status: :pending
    )

    post "/payments/#{payment.id}/refund"
    expect(response).to have_http_status(:unauthorized).or have_http_status(:forbidden)
  end

  it "allows admin to refund and sends email" do
    ActionMailer::Base.deliveries.clear
    allow(Stripe::Refund).to receive(:create).and_return(true)

    admin = User.create!(
      name: "運営",
      name_kana: "ウンエイ",
      birth_date: "1990-01-01",
      phone: "090-0000-9999",
      email: "admin5@example.com",
      address: "東京都",
      password: "password",
      role: :admin
    )
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap9b@example.com",
      address: "東京都",
      password: "password"
    )

    tournament = Tournament.create!(
      name: "大会名",
      event_date: "2026-05-01",
      venue: "会場",
      match_half_minutes: 12,
      max_teams: 15,
      entry_fee_amount: 20000,
      entry_fee_currency: "JPY",
      cancel_deadline_date: "2026-04-30"
    )
    team = Team.create!(
      name: "FC Example",
      captain_user: captain,
      created_by: captain.id,
      join_code: "ABC123"
    )
    entry = TournamentEntry.create!(
      tournament: tournament,
      team: team,
      status: :pending,
      applied_at: Time.current
    )
    payment = Payment.create!(
      tournament_entry: entry,
      amount: 20000,
      currency: "JPY",
      method: :card,
      status: :pending,
      stripe_payment_intent_id: "pi_test_123"
    )

    login_as(admin)
    post "/payments/#{payment.id}/refund"

    expect(response).to have_http_status(:ok)
    expect(payment.reload.status).to eq("refunded")
    expect(ActionMailer::Base.deliveries.length).to eq(1)
    expect(ActionMailer::Base.deliveries.first.to).to include("cap9b@example.com")
  end
end
