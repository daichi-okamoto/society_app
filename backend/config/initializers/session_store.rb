secure_cookie = Rails.env.production? || ENV["SESSION_COOKIE_SECURE"] == "true"
same_site_policy =
  if Rails.env.production?
    :none
  else
    :lax
  end

Rails.application.config.session_store(
  :cookie_store,
  key: "_society_app_session",
  same_site: same_site_policy,
  secure: secure_cookie,
  httponly: true
)
