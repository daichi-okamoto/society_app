class EntryRosterPlayer < ApplicationRecord
  belongs_to :entry_roster
  belongs_to :team_member, optional: true

  enum source: { team_member: 0, guest: 1 }, _default: "team_member"

  validates :name, presence: true, length: { maximum: 50 }
  validates :name_kana, length: { maximum: 50 }, allow_blank: true
  validates :phone, length: { maximum: 20 }, allow_blank: true
  validates :email, length: { maximum: 100 }, allow_blank: true
  validates :address, length: { maximum: 200 }, allow_blank: true
  validates :position, length: { maximum: 10 }, allow_blank: true
  validates :jersey_number, numericality: { greater_than_or_equal_to: 0, less_than_or_equal_to: 999 }, allow_nil: true
end
