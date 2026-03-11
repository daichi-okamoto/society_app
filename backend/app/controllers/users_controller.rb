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
      render json: {
        error: {
          code: "validation_error",
          message: current_user.errors.full_messages.first || "入力内容を確認してください",
          details: current_user.errors.to_hash(true)
        }
      }, status: :unprocessable_entity
    end
  end

  private

  def update_params
    params.permit(:name, :name_kana, :birth_date, :phone, :address, :avatar_url)
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
