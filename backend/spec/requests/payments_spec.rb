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
