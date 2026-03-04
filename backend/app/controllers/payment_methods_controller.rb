class PaymentMethodsController < ApplicationController
  before_action :authenticate_user!

  def index
    customer_id = current_user.stripe_customer_id
    return render json: { methods: [] }, status: :ok if customer_id.blank?

    methods = Stripe::PaymentMethod.list(customer: customer_id, type: "card").data
    default_id = fetch_default_payment_method_id(customer_id)
    current_user.update_column(:stripe_default_payment_method_id, default_id) if current_user.stripe_default_payment_method_id != default_id

    render json: {
      methods: methods.map { |pm| payment_method_json(pm, default_id) }
    }, status: :ok
  rescue Stripe::StripeError
    render json: { error: { code: "stripe_error" } }, status: :bad_gateway
  end

  def setup_intent
    customer_id = ensure_customer!
    setup_intent = Stripe::SetupIntent.create(
      customer: customer_id,
      payment_method_types: ["card"],
      usage: "off_session"
    )

    render json: {
      client_secret: setup_intent.client_secret,
      setup_intent_id: setup_intent.id
    }, status: :ok
  rescue Stripe::StripeError
    render json: { error: { code: "stripe_error" } }, status: :bad_gateway
  end

  def set_default
    customer_id = ensure_customer!
    payment_method_id = params[:payment_method_id].to_s

    payment_method = Stripe::PaymentMethod.retrieve(payment_method_id)
    if payment_method.customer != customer_id
      return render json: { error: { code: "forbidden" } }, status: :forbidden
    end

    Stripe::Customer.update(
      customer_id,
      { invoice_settings: { default_payment_method: payment_method_id } }
    )
    current_user.update!(stripe_default_payment_method_id: payment_method_id)

    render json: { method: payment_method_json(payment_method, payment_method_id) }, status: :ok
  rescue Stripe::StripeError
    render json: { error: { code: "stripe_error" } }, status: :bad_gateway
  end

  def destroy
    customer_id = current_user.stripe_customer_id
    return render json: { error: { code: "not_found" } }, status: :not_found if customer_id.blank?

    payment_method_id = params[:payment_method_id].to_s
    payment_method = Stripe::PaymentMethod.retrieve(payment_method_id)
    if payment_method.customer != customer_id
      return render json: { error: { code: "forbidden" } }, status: :forbidden
    end

    Stripe::PaymentMethod.detach(payment_method_id)

    if current_user.stripe_default_payment_method_id == payment_method_id
      Stripe::Customer.update(customer_id, { invoice_settings: { default_payment_method: nil } })
      current_user.update!(stripe_default_payment_method_id: nil)
    end

    head :no_content
  rescue Stripe::StripeError
    render json: { error: { code: "stripe_error" } }, status: :bad_gateway
  end

  private

  def ensure_customer!
    return current_user.stripe_customer_id if current_user.stripe_customer_id.present?

    customer = Stripe::Customer.create(
      email: current_user.email,
      name: current_user.name,
      metadata: { user_id: current_user.id }
    )
    current_user.update!(stripe_customer_id: customer.id)
    customer.id
  end

  def fetch_default_payment_method_id(customer_id)
    customer = Stripe::Customer.retrieve(customer_id)
    customer&.invoice_settings&.default_payment_method.to_s.presence
  rescue Stripe::StripeError
    nil
  end

  def payment_method_json(payment_method, default_id)
    card = payment_method.card
    {
      id: payment_method.id,
      brand: card&.brand,
      last4: card&.last4,
      exp_month: card&.exp_month,
      exp_year: card&.exp_year,
      is_default: payment_method.id == default_id
    }
  end
end
