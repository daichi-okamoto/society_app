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

  def direct
    unless profile_avatar_upload? || current_user.admin?
      require_admin!
    end
    return if performed?

    unless R2_CLIENT && R2_BUCKET && R2_PUBLIC_BASE_URL
      return render json: { error: { code: "r2_not_configured" } }, status: :unprocessable_entity
    end

    file = params[:file]
    unless file.respond_to?(:original_filename) && file.respond_to?(:content_type) && file.respond_to?(:tempfile)
      return render json: { error: { code: "validation_error", message: "file is required" } }, status: :unprocessable_entity
    end

    key = upload_key_for(file)
    R2_CLIENT.put_object(
      bucket: R2_BUCKET,
      key: key,
      body: file.tempfile,
      content_type: file.content_type
    )

    render json: {
      key: key,
      public_url: "#{R2_PUBLIC_BASE_URL}/#{key}",
      file_name: file.original_filename,
      content_type: file.content_type,
      size_bytes: file.size
    }, status: :ok
  rescue Aws::S3::Errors::ServiceError
    render json: { error: { code: "r2_upload_failed" } }, status: :unprocessable_entity
  end

  private

  def profile_avatar_upload?
    params[:upload_kind].to_s == "profile_avatar"
  end

  def upload_key_for(file)
    suffix = "#{SecureRandom.uuid}-#{file.original_filename}"
    return "profile-avatars/#{current_user.id}/#{suffix}" if profile_avatar_upload?

    "tournament-images/#{suffix}"
  end
end
