module AuthHelper
  def login_as(user, password: "password")
    post "/auth/login", params: { email: user.email, password: password }
  end
end
