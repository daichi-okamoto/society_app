# frozen_string_literal: true

require "rails_helper"

RSpec.describe "Webhooks", type: :request do
  it "marks payment as paid on webhook" do
    ActionMailer::Base.deliveries.clear

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
    captain = User.create!(
      name: "キャプテン",
      name_kana: "キャプテン",
      birth_date: "1990-01-01",
      phone: "090-0000-0000",
      email: "cap10@example.com",
      address: "東京都",
      password: "password"
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
      status: :pending
    )

    payload = {
      type: "checkout.session.completed",
      data: {
        object: {
          payment_intent: "pi_123",
          metadata: { payment_id: payment.id }
        }
      }
    }.to_json

    post "/webhooks/stripe", params: payload, headers: { "CONTENT_TYPE" => "application/json" }

    expect(response).to have_http_status(:ok)
    expect(payment.reload.status).to eq("paid")
    expect(ActionMailer::Base.deliveries.length).to eq(1)
    expect(ActionMailer::Base.deliveries.first.to).to include("cap10@example.com")
  end
end
