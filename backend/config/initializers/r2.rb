require "aws-sdk-s3"

R2_ENDPOINT = ENV.fetch("R2_ENDPOINT", nil)
R2_ACCESS_KEY_ID = ENV.fetch("R2_ACCESS_KEY_ID", nil)
R2_SECRET_ACCESS_KEY = ENV.fetch("R2_SECRET_ACCESS_KEY", nil)
R2_BUCKET = ENV.fetch("R2_BUCKET", nil)
R2_PUBLIC_BASE_URL = ENV.fetch("R2_PUBLIC_BASE_URL", nil)

R2_CLIENT =
  if R2_ENDPOINT && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY
    Aws::S3::Client.new(
      region: "auto",
      endpoint: R2_ENDPOINT,
      access_key_id: R2_ACCESS_KEY_ID,
      secret_access_key: R2_SECRET_ACCESS_KEY
    )
  else
    nil
  end
