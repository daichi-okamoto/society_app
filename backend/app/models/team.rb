class Team < ApplicationRecord
  belongs_to :captain_user, class_name: "User"
  belongs_to :created_by_user, class_name: "User", foreign_key: :created_by

  has_many :team_members, dependent: :destroy
  has_many :team_join_requests, dependent: :destroy

  validates :name, presence: true, length: { maximum: 50 }
  validates :join_code, presence: true, uniqueness: true, length: { in: 6..12 }
end
