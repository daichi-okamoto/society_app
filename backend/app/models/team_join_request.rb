class TeamJoinRequest < ApplicationRecord
  belongs_to :team
  belongs_to :user
  belongs_to :decided_by_user, class_name: "User", foreign_key: :decided_by, optional: true

  enum status: { pending: 0, approved: 1, rejected: 2 }, _default: "pending"

  validates :team_id, uniqueness: { scope: [:user_id, :status], conditions: -> { where(status: :pending) } }
end
