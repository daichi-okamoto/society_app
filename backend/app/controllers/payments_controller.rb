class PaymentsController < ApplicationController
  before_action :authenticate_user!, only: [:checkout, :latest, :intent]
  before_action :require_admin!, only: [:refund, :admin_index]

  def checkout
    entry = TournamentEntry.find(params[:tournament_entry_id])
    if entry.team.captain_user_id != current_user.id
      return render json: { error: { code: "forbidden" } }, status: :forbidden
    end

    paid_payment = Payment.where(tournament_entry_id: entry.id, method: :card, status: :paid).order(id: :desc).first
    if paid_payment
      return render json: { already_paid: true, payment: payment_json(paid_payment) }, status: :ok
    end

    payment = Payment.where(tournament_entry_id: entry.id, method: :card, status: :pending).order(id: :desc).first
    payment ||= Payment.create!(
      tournament_entry: entry,
      amount: entry.tournament.entry_fee_amount,
      currency: entry.tournament.entry_fee_currency,
      method: :card,
      status: :pending
    )

    if ActiveModel::Type::Boolean.new.cast(params[:use_saved_card])
      return process_direct_card_charge(entry, payment)
    end

    app_base_url = ENV.fetch("APP_BASE_URL", "http://localhost:5173")
    success_url = "#{app_base_url}/tournaments/#{entry.tournament_id}/entry/complete?payment=success&session_id={CHECKOUT_SESSION_ID}"
    cancel_url = "#{app_base_url}/tournaments/#{entry.tournament_id}/entry/confirm?payment=cancel"
    ui_mode = params[:ui_mode].to_s == "embedded" ? "embedded" : "hosted"

    base_payload = {
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
      metadata: { payment_id: payment.id },
      payment_intent_data: { metadata: { payment_id: payment.id } }
    }

    session =
      if ui_mode == "embedded"
        Stripe::Checkout::Session.create(base_payload.merge(
          ui_mode: "embedded",
          return_url: success_url
        ))
      else
        Stripe::Checkout::Session.create(base_payload.merge(
          success_url: success_url,
          cancel_url: cancel_url
        ))
      end

    PaymentEvent.log!(
      payment: payment,
      event_type: "checkout_session_created",
      message: "Checkout session created",
      metadata: { session_id: session.id, ui_mode: ui_mode },
      actor_id: current_user.id
    )

    render json: {
      checkout_url: session.url,
      client_secret: session.client_secret,
      checkout_session_id: session.id
    }, status: :ok
  end

  def latest
    entry = TournamentEntry.find(params[:tournament_entry_id])
    unless entry.team.captain_user_id == current_user.id || current_user.admin?
      return render json: { error: { code: "forbidden" } }, status: :forbidden
    end

    payment = Payment.where(tournament_entry_id: entry.id).order(id: :desc).first
    render json: { payment: payment && payment_json(payment) }, status: :ok
  end

  def admin_index
    payments_scope = Payment.includes(tournament_entry: [:team, :tournament]).order(created_at: :desc)
    payments_scope = apply_admin_filter(payments_scope)

    search = params[:q].to_s.strip
    if search.present?
      keyword = "%#{search}%"
      payments_scope = payments_scope.joins(tournament_entry: [:team, :tournament]).where(
        "teams.name ILIKE :q OR tournaments.name ILIKE :q",
        q: keyword
      )
    end

    payments = payments_scope.limit(100).to_a
    render json: {
      summary: build_admin_summary,
      alerts: build_admin_alerts,
      payments: payments.map { |payment| admin_payment_json(payment) }
    }, status: :ok
  end

  def intent
    entry = TournamentEntry.find(params[:tournament_entry_id])
    unless entry.team.captain_user_id == current_user.id
      return render json: { error: { code: "forbidden" } }, status: :forbidden
    end

    paid_payment = Payment.where(tournament_entry_id: entry.id, method: :card, status: :paid).order(id: :desc).first
    if paid_payment
      return render json: { already_paid: true, payment: payment_json(paid_payment) }, status: :ok
    end

    payment = Payment.where(tournament_entry_id: entry.id, method: :card, status: :pending).order(id: :desc).first
    payment ||= Payment.create!(
      tournament_entry: entry,
      amount: entry.tournament.entry_fee_amount,
      currency: entry.tournament.entry_fee_currency,
      method: :card,
      status: :pending
    )

    customer_id = ensure_customer_for_user!
    payment_intent = find_or_create_payment_intent(payment, customer_id)
    PaymentEvent.log!(
      payment: payment,
      event_type: "intent_prepared",
      message: "PaymentIntent prepared for in-app payment",
      metadata: { payment_intent_id: payment_intent.id, tournament_entry_id: entry.id },
      actor_id: current_user.id
    )

    render json: {
      payment: payment_json(payment),
      payment_intent_id: payment_intent.id,
      client_secret: payment_intent.client_secret
    }, status: :ok
  rescue Stripe::StripeError
    render json: { error: { code: "stripe_error" } }, status: :bad_gateway
  end

  def refund
    payment = Payment.find(params[:id])
    if payment.refunded?
      return render json: { error: { code: "already_refunded" } }, status: :conflict
    end

    refund_amount = params[:amount].to_i.positive? ? params[:amount].to_i : payment.amount
    if refund_amount <= 0 || refund_amount > payment.amount
      return render json: { error: { code: "invalid_refund_amount" } }, status: :unprocessable_entity
    end

    refund = nil
    if payment.stripe_payment_intent_id.present?
      refund = Stripe::Refund.create(
        payment_intent: payment.stripe_payment_intent_id,
        amount: refund_amount
      )
    end

    payment.update!(
      status: :refunded,
      refunded_at: Time.current,
      refund_amount: refund_amount,
      stripe_refund_id: refund.respond_to?(:id) ? refund.id : nil
    )

    PaymentEvent.log!(
      payment: payment,
      event_type: "refund_completed",
      message: "Refund completed by admin",
      metadata: { refund_amount: refund_amount, stripe_refund_id: refund.respond_to?(:id) ? refund.id : nil },
      actor_id: current_user.id
    )

    UserMailer.cancel_refund(payment.tournament_entry.team.captain_user, "refunded").deliver_now

    render json: { payment: admin_payment_json(payment) }, status: :ok
  rescue Stripe::StripeError => e
    PaymentEvent.log!(
      payment: payment,
      event_type: "refund_failed",
      level: "error",
      message: "Refund failed",
      metadata: { error_message: e.message },
      actor_id: current_user&.id
    )
    render json: { error: { code: "refund_failed", message: e.message } }, status: :bad_gateway
  end

  private

  def ensure_customer_for_user!
    return current_user.stripe_customer_id if current_user.stripe_customer_id.present?

    customer = Stripe::Customer.create(
      email: current_user.email,
      name: current_user.name,
      metadata: { user_id: current_user.id }
    )
    current_user.update!(stripe_customer_id: customer.id)
    customer.id
  end

  def find_or_create_payment_intent(payment, customer_id)
    if payment.stripe_payment_intent_id.present?
      existing = Stripe::PaymentIntent.retrieve(payment.stripe_payment_intent_id)
      return existing if %w[requires_payment_method requires_confirmation requires_action processing].include?(existing.status)
      return existing if existing.status == "succeeded"
    end

    intent = Stripe::PaymentIntent.create(
      amount: payment.amount,
      currency: payment.currency.downcase,
      customer: customer_id,
      payment_method_types: ["card"],
      setup_future_usage: "off_session",
      metadata: { payment_id: payment.id, tournament_entry_id: payment.tournament_entry_id }
    )
    payment.update!(stripe_payment_intent_id: intent.id)
    intent
  end

  def process_direct_card_charge(entry, payment)
    customer_id = current_user.stripe_customer_id
    payment_method_id = current_user.stripe_default_payment_method_id
    if customer_id.blank? || payment_method_id.blank?
      return render json: { error: { code: "no_saved_payment_method" } }, status: :unprocessable_entity
    end

    intent = Stripe::PaymentIntent.create(
      amount: payment.amount,
      currency: payment.currency.downcase,
      customer: customer_id,
      payment_method: payment_method_id,
      confirm: true,
      off_session: true,
      metadata: { payment_id: payment.id, tournament_entry_id: entry.id }
    )

    payment.update!(
      status: :paid,
      stripe_payment_intent_id: intent.id,
      paid_at: Time.current
    )
    PaymentEvent.log!(
      payment: payment,
      event_type: "direct_charge_succeeded",
      message: "Direct charge with saved card succeeded",
      metadata: { payment_intent_id: intent.id },
      actor_id: current_user.id
    )
    UserMailer.payment_status(entry.team.captain_user, "paid").deliver_now

    render json: { direct_paid: true, payment: payment_json(payment) }, status: :ok
  rescue Stripe::CardError => e
    payment.update!(status: :failed)
    PaymentEvent.log!(
      payment: payment,
      event_type: "direct_charge_failed",
      level: "error",
      message: "Direct charge failed",
      metadata: { error_message: e.message },
      actor_id: current_user.id
    )
    render json: { error: { code: "direct_charge_failed", message: e.message } }, status: :unprocessable_entity
  rescue Stripe::StripeError
    payment.update!(status: :failed)
    PaymentEvent.log!(
      payment: payment,
      event_type: "direct_charge_failed",
      level: "error",
      message: "Direct charge failed",
      actor_id: current_user.id
    )
    render json: { error: { code: "stripe_error" } }, status: :bad_gateway
  end

  def apply_admin_filter(scope)
    case params[:status].to_s
    when "done"
      scope.where(status: :paid)
    when "pending"
      scope.where(status: :pending)
    when "failed"
      scope.where(status: :failed)
    when "refund"
      scope.where(status: :refunded)
    else
      scope
    end
  end

  def build_admin_summary
    now = Time.current
    month_range = now.beginning_of_month..now.end_of_month
    paid_month = Payment.where(status: :paid, paid_at: month_range)
    refunded_month = Payment.where(status: :refunded, refunded_at: month_range)

    {
      monthly_revenue: paid_month.sum(:amount),
      monthly_paid_count: paid_month.count,
      pending_count: Payment.pending.count,
      refunded_count: Payment.refunded.count,
      monthly_refunded_amount: refunded_month.sum(:refund_amount)
    }
  end

  def build_admin_alerts
    failed_last_24h = Payment.failed.where(updated_at: 24.hours.ago..Time.current).count
    refund_waiting = Payment.joins(:tournament_entry)
      .where(status: :paid, tournament_entries: { status: TournamentEntry.statuses[:cancelled] })
      .count

    alerts = []
    if failed_last_24h.positive?
      alerts << {
        level: "error",
        code: "failed_payments_recent",
        message: "直近24時間で失敗した決済があります",
        count: failed_last_24h
      }
    end
    if refund_waiting.positive?
      alerts << {
        level: "warning",
        code: "refund_waiting",
        message: "キャンセル済みエントリーで未返金の決済があります",
        count: refund_waiting
      }
    end
    alerts
  end

  def admin_payment_json(payment)
    entry = payment.tournament_entry
    team = entry&.team
    tournament = entry&.tournament

    {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      created_at: payment.created_at,
      paid_at: payment.paid_at,
      refunded_at: payment.refunded_at,
      refund_amount: payment.refund_amount,
      stripe_payment_intent_id: payment.stripe_payment_intent_id,
      stripe_refund_id: payment.stripe_refund_id,
      tournament_entry_id: payment.tournament_entry_id,
      team_name: team&.name,
      tournament_name: tournament&.name,
      tournament_event_date: tournament&.event_date,
      entry_status: entry&.status,
      refundable: payment.paid?
    }
  end

  def payment_json(payment)
    {
      id: payment.id,
      tournament_entry_id: payment.tournament_entry_id,
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      status: payment.status,
      paid_at: payment.paid_at
    }
  end
end
