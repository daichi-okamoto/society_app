class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :omniauthable, omniauth_providers: [:google_oauth2]

  enum role: { participant: 0, admin: 1 }, _default: "participant"
  enum status: { active: 0, suspended: 1 }, _default: "active"

  validates :name, presence: true, length: { maximum: 50 }
  validates :name_kana, presence: true, length: { maximum: 50 }
  validates :birth_date, presence: true
  validates :phone, presence: true
  validates :address, length: { maximum: 200 }, allow_blank: true
  validates :avatar_url, length: { maximum: 500 }, allow_blank: true

  def self.from_google_oauth!(auth)
    email = auth.dig("info", "email").to_s.downcase.strip
    raise ActiveRecord::RecordInvalid, new if email.blank?

    user = find_by_google_identity(auth) || new
    user.provider = auth.provider
    user.uid = auth.uid
    user.email = email

    if user.new_record?
      user.assign_attributes(
        name: build_google_name(auth, email),
        name_kana: "ミトウロク",
        birth_date: Date.new(2000, 1, 1),
        phone: "0000000000",
        address: "",
        password: Devise.friendly_token.first(32)
      )
    end

    user.save!
    user
  end

  def self.find_by_google_identity(auth)
    email = auth.dig("info", "email").to_s.downcase.strip
    find_by(provider: auth.provider, uid: auth.uid) || find_by(email: email)
  end

  def self.build_google_name(auth, email)
    raw_name = auth.dig("info", "name").to_s.strip
    return raw_name.first(50) if raw_name.present?

    local_part = email.split("@").first.to_s
    fallback = local_part.gsub(/[^a-zA-Z0-9ぁ-んァ-ヶ一-龯]/, "")
    fallback = "Googleユーザー" if fallback.blank?
    fallback.first(50)
  end
  private_class_method :build_google_name
end
