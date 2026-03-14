class Notification < ApplicationRecord
  has_many :notification_targets, dependent: :destroy
  has_many :notification_reads, dependent: :destroy

  DELIVERY_SCOPES = %w[everyone tournament_teams specific_teams specific_users captains].freeze

  validates :title, presence: true, length: { maximum: 100 }
  validates :body, presence: true, length: { maximum: 500 }
  validates :link_path, length: { maximum: 255 }, allow_blank: true
  validates :delivery_scope, inclusion: { in: DELIVERY_SCOPES }
  validate :at_least_one_delivery_channel

  private

  def at_least_one_delivery_channel
    return if deliver_via_push? || deliver_via_email?

    errors.add(:base, "at least one delivery channel must be selected")
  end
end
