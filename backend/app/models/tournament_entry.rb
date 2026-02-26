class TournamentEntry < ApplicationRecord
  belongs_to :tournament
  belongs_to :team
  belongs_to :decided_by_user, class_name: "User", foreign_key: :decided_by, optional: true
  has_one :entry_roster, dependent: :destroy

  enum status: { pending: 0, approved: 1, rejected: 2, cancelled: 3 }, _default: "pending"

  validates :tournament_id, uniqueness: { scope: :team_id }

  after_commit :refresh_related_tournament_counters

  private

  def refresh_related_tournament_counters
    ids = []
    ids << tournament_id if tournament_id.present?

    if respond_to?(:saved_change_to_tournament_id?) && saved_change_to_tournament_id?
      previous_id, _current_id = saved_change_to_tournament_id
      ids << previous_id if previous_id.present?
    end

    ids.uniq.each do |id|
      t = Tournament.find_by(id: id)
      t&.refresh_active_entry_teams_count!
    end
  end
end
