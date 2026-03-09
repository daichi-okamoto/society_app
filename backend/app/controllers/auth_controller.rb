class AuthController < ApplicationController
  before_action :set_devise_mapping

  def google
    session[:after_google_auth_redirect] = frontend_redirect_path(params[:redirect_to])
    session[:after_google_auth_failure_redirect] = frontend_failure_redirect_path(params[:failure_redirect_to])
    session[:after_google_auth_success_message] = oauth_success_message(params[:success_message])
    session[:after_google_auth_role] = normalized_google_role(params[:role])
    session[:after_google_auth_admin_intent] = normalized_admin_intent(params[:admin_intent])
    session[:after_google_auth_admin_invite_code] = params[:admin_invite_code].to_s
    unless google_oauth_configured?
      redirect_to missing_google_config_redirect_url, allow_other_host: true
      return
    end

    redirect_to user_google_oauth2_omniauth_authorize_path, allow_other_host: false
  end

  def register
    user = User.new(register_params)

    if user.save
      sign_in(user)
      render json: { user: user_json(user) }, status: :created
    else
      render json: { error: { code: "validation_error", details: user.errors } }, status: :unprocessable_entity
    end
  end

  def admin_register
    unless valid_admin_invite_code?(params[:admin_invite_code].to_s)
      return render json: { error: { code: "unauthorized_admin_registration" } }, status: :unauthorized
    end

    user = User.new(register_params.merge(role: :admin))

    if user.save
      sign_in(user)
      render json: { user: user_json(user) }, status: :created
    else
      render json: { error: { code: "validation_error", details: user.errors } }, status: :unprocessable_entity
    end
  end

  def login
    user = User.find_by(email: params[:email])
    unless user&.valid_password?(params[:password])
      return render json: { error: { code: "unauthorized" } }, status: :unauthorized
    end

    sign_in(user)
    render json: { user: user_json(user) }, status: :ok
  end

  def logout
    sign_out(current_user) if user_signed_in?
    head :no_content
  end

  private

  def set_devise_mapping
    request.env["devise.mapping"] = Devise.mappings[:user]
  end

  def register_params
    params.permit(:name, :name_kana, :birth_date, :phone, :email, :address, :avatar_url, :password)
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

  def google_oauth_configured?
    ENV["GOOGLE_CLIENT_ID"].present? && ENV["GOOGLE_CLIENT_SECRET"].present?
  end

  def missing_google_config_redirect_url
    app_base_url = ENV.fetch("APP_BASE_URL", "http://localhost:5173")
    failure_path = frontend_failure_redirect_path(session.delete(:after_google_auth_failure_redirect))
    "#{app_base_url}#{failure_path}?oauth_error=google"
  end

  def oauth_success_message(raw_message)
    message = raw_message.to_s.strip
    return "Googleアカウントでログインしました。" if message.blank?

    message
  end

  def normalized_google_role(raw_role)
    raw_role.to_s == "admin" ? "admin" : "participant"
  end

  def normalized_admin_intent(raw_intent)
    raw_intent.to_s == "register" ? "register" : "login"
  end

  def admin_signup_code
    ENV["ADMIN_SIGNUP_CODE"].presence || (Rails.env.development? || Rails.env.test? ? "dev-admin-signup-code" : nil)
  end

  def valid_admin_invite_code?(provided_code)
    expected_code = admin_signup_code
    return false if expected_code.blank? || provided_code.blank?
    return false if expected_code.bytesize != provided_code.bytesize

    ActiveSupport::SecurityUtils.secure_compare(provided_code, expected_code)
  end

  def user_json(user)
    {
      id: user.id,
      name: user.name,
      name_kana: user.name_kana,
      birth_date: user.birth_date,
      phone: user.phone,
      address: user.address,
      avatar_url: user.avatar_url,
      email: user.email,
      role: user.role
    }
  end
end
