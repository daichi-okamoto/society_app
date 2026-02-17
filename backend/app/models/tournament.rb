class Tournament < ApplicationRecord
  has_many :tournament_entries, dependent: :destroy
  has_many :matches, dependent: :destroy
  has_many :tournament_images, dependent: :destroy

  validates :name, presence: true
  validates :event_date, presence: true
  validates :venue, presence: true
  validates :match_half_minutes, numericality: { greater_than_or_equal_to: 1 }
  validates :max_teams, numericality: { greater_than_or_equal_to: 1 }
  validates :entry_fee_amount, numericality: { greater_than_or_equal_to: 0 }
  validates :entry_fee_currency, presence: true
  validates :cancel_deadline_date, presence: true

  def refresh_active_entry_teams_count!
    count = tournament_entries.where(status: [:pending, :approved]).count
    update_column(:active_entry_teams_count, count)
  end
end
