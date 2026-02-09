class TournamentImage < ApplicationRecord
  belongs_to :tournament
  belongs_to :uploaded_by_user, class_name: "User", foreign_key: :uploaded_by

  validates :file_url, presence: true
  validates :file_name, presence: true
  validates :content_type, presence: true
  validates :size_bytes, numericality: { greater_than: 0 }
end
