class Payment < ApplicationRecord
  belongs_to :tournament_entry

  enum method: { card: 0, cash: 1 }, _default: "card"
  enum status: { pending: 0, paid: 1, failed: 2, refunded: 3 }, _default: "pending"

  validates :amount, numericality: { greater_than_or_equal_to: 0 }
  validates :currency, presence: true
end
