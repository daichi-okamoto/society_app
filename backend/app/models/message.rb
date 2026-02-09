class Message < ApplicationRecord
  belongs_to :from_user, class_name: "User"
  belongs_to :to_user, class_name: "User"

  validates :subject, presence: true, length: { maximum: 100 }
  validates :body, presence: true
end
