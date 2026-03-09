require "uri"

class Users::OmniauthCallbacksController < Devise::OmniauthCallbacksController
  def google_oauth2
    user = if admin_google_flow?
      handle_admin_google_auth!
    else
      User.from_google_oauth!(request.env["omniauth.auth"])
    end
    sign_in(:user, user)
    redirect_to success_redirect_url, allow_other_host: true
  rescue ActiveRecord::RecordInvalid => e
    Rails.logger.warn({ message: "Google OAuth failed", error: e.message }.to_json)
    redirect_to failure_redirect_url, allow_other_host: true
  end

  def failure
    redirect_to failure_redirect_url, allow_other_host: true
  end

  private

  def app_base_url
    ENV.fetch("APP_BASE_URL", "http://localhost:5173")
  end

  def admin_google_flow?
    session[:after_google_auth_role].to_s == "admin"
  end

  def handle_admin_google_auth!
    auth = request.env["omniauth.auth"]

    if admin_login_intent?
      user = User.find_by_google_identity(auth)
      session[:after_google_auth_error_code] = "admin_required"
      raise ActiveRecord::RecordInvalid, User.new unless user&.admin?

      user.update!(provider: auth.provider, uid: auth.uid, email: auth.dig("info", "email").to_s.downcase.strip)
      return user
    end

    unless valid_admin_invite_code?(session.delete(:after_google_auth_admin_invite_code).to_s)
      session[:after_google_auth_error_code] = "invalid_admin_invite_code"
      raise ActiveRecord::RecordInvalid, User.new
    end

    user = User.from_google_oauth!(auth)

    user.update!(role: :admin) unless user.admin?
    user
  end

  def admin_login_intent?
    session[:after_google_auth_admin_intent].to_s != "register"
  end

  def success_redirect_url
    session.delete(:after_google_auth_role)
    session.delete(:after_google_auth_admin_intent)
    session.delete(:after_google_auth_admin_invite_code)
    session.delete(:after_google_auth_error_code)
    path = frontend_redirect_path(session.delete(:after_google_auth_redirect))
    message = session.delete(:after_google_auth_success_message).to_s
    uri = URI.parse("#{app_base_url}#{path}")
    params = URI.decode_www_form(uri.query.to_s)
    params << ["flash_type", "success"]
    params << ["flash_message", message.presence || "Googleアカウントでログインしました。"]
    uri.query = URI.encode_www_form(params)
    uri.to_s
  end

  def failure_redirect_url
    role = session.delete(:after_google_auth_role)
    session.delete(:after_google_auth_admin_intent)
    session.delete(:after_google_auth_admin_invite_code)
    error_code = session.delete(:after_google_auth_error_code)
    oauth_error = error_code.presence || (role == "admin" ? "admin_required" : "google")
    "#{app_base_url}#{frontend_failure_redirect_path(session.delete(:after_google_auth_failure_redirect))}?oauth_error=#{oauth_error}"
  end

  def frontend_redirect_path(raw_path)
    path = raw_path.to_s
    return "/app/home" if path.blank?
    return "/app/home" unless path.start_with?("/")
    return "/app/home" if path.start_with?("//")

    path
  end

  def frontend_failure_redirect_path(raw_path)
    path = raw_path.to_s
    return "/login" if path.blank?
    return "/login" unless path.start_with?("/")
    return "/login" if path.start_with?("//")

    path
  end

  def valid_admin_invite_code?(provided_code)
    expected_code = ENV["ADMIN_SIGNUP_CODE"].presence || (Rails.env.development? || Rails.env.test? ? "dev-admin-signup-code" : nil)
    return false if expected_code.blank? || provided_code.blank?
    return false if expected_code.bytesize != provided_code.bytesize

    ActiveSupport::SecurityUtils.secure_compare(provided_code, expected_code)
  end
end
