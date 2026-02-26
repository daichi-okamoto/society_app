class TeamManualMember < ApplicationRecord
  POSITIONS = %w[FW MF DF GK].freeze

  belongs_to :team
  belongs_to :created_by_user, class_name: "User"

  validates :name, presence: true, length: { maximum: 50 }
  validates :name_kana, length: { maximum: 50 }, allow_blank: true
  validates :phone, presence: true, length: { maximum: 20 }
  validates :postal_code, length: { maximum: 16 }, allow_blank: true
  validates :prefecture, length: { maximum: 20 }, allow_blank: true
  validates :city_block, length: { maximum: 100 }, allow_blank: true
  validates :building, length: { maximum: 100 }, allow_blank: true
  validates :position, inclusion: { in: POSITIONS }
  validates :jersey_number, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 999 }, allow_nil: true
end
