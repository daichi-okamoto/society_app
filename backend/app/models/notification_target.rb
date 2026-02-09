class NotificationTarget < ApplicationRecord
  belongs_to :notification

  enum target_type: { everyone: 0, tournament: 1, team: 2, user: 3 }

  validates :target_type, presence: true
end
