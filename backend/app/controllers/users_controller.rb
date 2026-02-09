class UsersController < ApplicationController
  before_action :authenticate_user!, only: [:me]

  def me
    render json: { user: user_json(current_user) }, status: :ok
  end

  def update
    authenticate_user!
    return if performed?

    if current_user.update(update_params)
      render json: { user: user_json(current_user) }, status: :ok
    else
      render json: { error: { code: "validation_error", details: current_user.errors } }, status: :unprocessable_entity
    end
  end

  private

  def update_params
    params.permit(:name, :name_kana, :birth_date, :phone, :email, :address)
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
