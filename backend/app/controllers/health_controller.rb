class HealthController < ActionController::API
  def show
    render json: { status: "ok" }, status: :ok
  end

  def ready
    db_ok = database_ready?
    services = {
      database: db_ok,
      stripe: ENV["STRIPE_SECRET_KEY"].present?,
      r2: r2_configured?,
      smtp: smtp_configured?
    }

    status = db_ok ? "ok" : "degraded"
    render json: { status: status, services: services }, status: (db_ok ? :ok : :service_unavailable)
  end

  private

  def database_ready?
    ActiveRecord::Base.connection_pool.with_connection(&:active?)
  rescue StandardError
    false
  end

  def r2_configured?
    %w[R2_ENDPOINT R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET R2_PUBLIC_BASE_URL].all? do |k|
      ENV[k].present?
    end
  end

  def smtp_configured?
    %w[SMTP_HOST SMTP_PORT SMTP_USERNAME SMTP_PASSWORD SMTP_FROM].all? { |k| ENV[k].present? }
  end
end
