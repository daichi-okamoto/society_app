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

  def user_json(user)
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  end
end
