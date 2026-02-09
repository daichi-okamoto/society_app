class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  enum role: { participant: 0, admin: 1 }, _default: "participant"
  enum status: { active: 0, suspended: 1 }, _default: "active"

  validates :name, presence: true, length: { maximum: 50 }
  validates :name_kana, presence: true, length: { maximum: 50 }
  validates :birth_date, presence: true
  validates :phone, presence: true
  validates :address, length: { maximum: 200 }, allow_blank: true
end
