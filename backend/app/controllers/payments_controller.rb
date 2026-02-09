class PaymentsController < ApplicationController
  before_action :authenticate_user!, only: [:checkout]
  before_action :require_admin!, only: [:refund]

  def checkout
    entry = TournamentEntry.find(params[:tournament_entry_id])
    if entry.team.captain_user_id != current_user.id
      return render json: { error: { code: "forbidden" } }, status: :forbidden
    end

    payment = Payment.create!(
      tournament_entry: entry,
      amount: entry.tournament.entry_fee_amount,
      currency: entry.tournament.entry_fee_currency,
      method: :card,
      status: :pending
    )

    session = Stripe::Checkout::Session.create(
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: payment.currency.downcase,
            product_data: { name: entry.tournament.name },
            unit_amount: payment.amount
          },
          quantity: 1
        }
      ],
      success_url: "#{ENV.fetch("APP_BASE_URL", "http://localhost:5173")}/payment/success",
      cancel_url: "#{ENV.fetch("APP_BASE_URL", "http://localhost:5173")}/payment/cancel",
      metadata: { payment_id: payment.id },
      payment_intent_data: { metadata: { payment_id: payment.id } }
    )

    render json: { checkout_url: session.url }, status: :ok
  end

  def refund
    payment = Payment.find(params[:id])
    if payment.stripe_payment_intent_id.present?
      Stripe::Refund.create(payment_intent: payment.stripe_payment_intent_id)
    end

    payment.update!(status: :refunded, refunded_at: Time.current)

    UserMailer.cancel_refund(payment.tournament_entry.team.captain_user, "refunded").deliver_now

    render json: { payment: { id: payment.id, status: payment.status } }, status: :ok
  end
end
