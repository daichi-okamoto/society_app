class EntryRoster < ApplicationRecord
  belongs_to :tournament_entry
  belongs_to :submitted_by_user, class_name: "User"
  has_many :entry_roster_players, dependent: :destroy

  validates :tournament_entry_id, uniqueness: true
  validates :submitted_at, presence: true
end
