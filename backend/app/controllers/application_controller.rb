class ApplicationController < ActionController::API
  include Devise::Controllers::Helpers

  if Rails.env.production?
    rescue_from StandardError do |e|
      Rails.logger.error(
        {
          message: e.message,
          error_class: e.class.name,
          request_id: request.request_id,
          path: request.fullpath
        }.to_json
      )
      render json: { error: { code: "internal_server_error" } }, status: :internal_server_error
    end
  end

  private

  def current_user_role
    current_user&.role
  end

  def authenticate_user!
    return if user_signed_in?

    render json: { error: { code: "unauthorized" } }, status: :unauthorized
  end

  def require_admin!
    unless user_signed_in?
      return render json: { error: { code: "unauthorized" } }, status: :unauthorized
    end

    return if current_user_role == "admin"

    render json: { error: { code: "forbidden" } }, status: :forbidden
  end
end
