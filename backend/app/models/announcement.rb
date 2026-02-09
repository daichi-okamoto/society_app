class Announcement < ApplicationRecord
  belongs_to :created_by_user, class_name: "User", foreign_key: :created_by

  validates :title, presence: true, length: { maximum: 100 }
  validates :body, presence: true
  validates :published_at, presence: true
end
