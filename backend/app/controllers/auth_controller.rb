class AuthController < ApplicationController
  before_action :set_devise_mapping

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
    params.permit(:name, :name_kana, :birth_date, :phone, :email, :address, :password)
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
      email: user.email,
      role: user.role
    }
  end
end
