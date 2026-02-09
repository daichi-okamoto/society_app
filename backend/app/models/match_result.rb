class MatchResult < ApplicationRecord
  belongs_to :match
  belongs_to :updated_by_user, class_name: "User", foreign_key: :updated_by, optional: true

  validates :home_score, numericality: { greater_than_or_equal_to: 0 }
  validates :away_score, numericality: { greater_than_or_equal_to: 0 }
end
