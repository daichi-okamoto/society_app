class UploadsController < ApplicationController
  before_action :authenticate_user!

  def presign
    require_admin!
    return if performed?

    unless R2_CLIENT && R2_BUCKET && R2_PUBLIC_BASE_URL
      return render json: { error: { code: "r2_not_configured" } }, status: :unprocessable_entity
    end

    file_name = params[:file_name].to_s
    content_type = params[:content_type].to_s
    size_bytes = params[:size_bytes].to_i

    if file_name.empty? || content_type.empty? || size_bytes <= 0
      return render json: { error: { code: "validation_error" } }, status: :unprocessable_entity
    end

    key = "tournament-images/#{SecureRandom.uuid}-#{file_name}"
    signer = Aws::S3::Presigner.new(client: R2_CLIENT)
    upload_url = signer.presigned_url(
      :put_object,
      bucket: R2_BUCKET,
      key: key,
      content_type: content_type,
      expires_in: 900
    )

    render json: {
      upload_url: upload_url,
      key: key,
      public_url: "#{R2_PUBLIC_BASE_URL}/#{key}"
    }, status: :ok
  end
end
