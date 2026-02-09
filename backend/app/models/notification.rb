class Notification < ApplicationRecord
  has_many :notification_targets, dependent: :destroy
  has_many :notification_reads, dependent: :destroy

  validates :title, presence: true, length: { maximum: 100 }
  validates :body, presence: true
  validates :scheduled_at, presence: true
end
