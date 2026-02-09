class TeamMember < ApplicationRecord
  belongs_to :team
  belongs_to :user

  enum role: { captain: 0, member: 1 }, _default: "member"
  enum status: { active: 0, removed: 1 }, _default: "active"

  validates :team_id, uniqueness: { scope: :user_id }
end
