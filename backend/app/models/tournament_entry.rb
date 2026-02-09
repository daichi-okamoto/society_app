class TournamentEntry < ApplicationRecord
  belongs_to :tournament
  belongs_to :team
  belongs_to :decided_by_user, class_name: "User", foreign_key: :decided_by, optional: true

  enum status: { pending: 0, approved: 1, rejected: 2, cancelled: 3 }, _default: "pending"

  validates :tournament_id, uniqueness: { scope: :team_id }
end
