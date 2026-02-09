class Match < ApplicationRecord
  belongs_to :tournament
  belongs_to :home_team, class_name: "Team"
  belongs_to :away_team, class_name: "Team"
  has_one :match_result, dependent: :destroy

  enum status: { scheduled: 0, finished: 1 }, _default: "scheduled"

  validates :kickoff_at, presence: true
  validates :field, presence: true
  validate :different_teams

  private

  def different_teams
    errors.add(:away_team_id, "must be different") if home_team_id == away_team_id
  end
end
