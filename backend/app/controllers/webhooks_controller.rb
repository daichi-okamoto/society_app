class WebhooksController < ActionController::API
  def stripe
    payload = request.body.read
    sig_header = request.env["HTTP_STRIPE_SIGNATURE"]
    endpoint_secret = ENV.fetch("STRIPE_WEBHOOK_SECRET", nil)

    event = if Rails.env.test? || endpoint_secret.nil?
              JSON.parse(payload, symbolize_names: true)
            else
              Stripe::Webhook.construct_event(payload, sig_header, endpoint_secret)
            end

    handle_stripe_event(event)
    head :ok
  rescue JSON::ParserError, Stripe::SignatureVerificationError
    head :bad_request
  end

  private

  def handle_stripe_event(event)
    case event[:type]
    when "checkout.session.completed", "payment_intent.succeeded"
      obj = event[:data][:object]
      payment = find_payment_from_event(obj)
      return unless payment

      already_paid = payment.paid?
      payment.update!(
        status: :paid,
        stripe_payment_intent_id: obj[:payment_intent] || payment.stripe_payment_intent_id,
        paid_at: Time.current
      )
      PaymentEvent.log!(
        payment: payment,
        event_type: "webhook_paid",
        message: "Payment marked as paid by Stripe webhook",
        metadata: { stripe_event: event[:type], payment_intent_id: obj[:payment_intent] || obj[:id] }
      )
      UserMailer.payment_status(payment.tournament_entry.team.captain_user, "paid").deliver_now unless already_paid
    when "payment_intent.payment_failed"
      obj = event[:data][:object]
      payment = find_payment_from_event(obj)
      return unless payment

      payment.update!(status: :failed)
      PaymentEvent.log!(
        payment: payment,
        event_type: "webhook_failed",
        level: "error",
        message: "Payment marked as failed by Stripe webhook",
        metadata: { stripe_event: event[:type], payment_intent_id: obj[:id] }
      )
      UserMailer.payment_status(payment.tournament_entry.team.captain_user, "failed").deliver_now
    end
  end

  def find_payment_from_event(obj)
    metadata = obj[:metadata] || {}
    payment_id = metadata[:payment_id] || metadata["payment_id"]
    return Payment.find_by(id: payment_id) if payment_id

    intent_id = obj[:payment_intent] || obj[:id]
    Payment.find_by(stripe_payment_intent_id: intent_id)
  end
end
