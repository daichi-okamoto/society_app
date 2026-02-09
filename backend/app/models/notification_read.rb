class NotificationRead < ApplicationRecord
  belongs_to :notification
  belongs_to :user

  validates :read_at, presence: true
end
