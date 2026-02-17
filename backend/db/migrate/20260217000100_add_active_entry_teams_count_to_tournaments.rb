class AddActiveEntryTeamsCountToTournaments < ActiveRecord::Migration[7.1]
  class Tournament < ApplicationRecord
    self.table_name = "tournaments"
  end

  class TournamentEntry < ApplicationRecord
    self.table_name = "tournament_entries"
  end

  def up
    add_column :tournaments, :active_entry_teams_count, :integer, null: false, default: 0

    say_with_time "Backfilling active_entry_teams_count" do
      Tournament.find_each do |tournament|
        count = TournamentEntry.where(tournament_id: tournament.id, status: [0, 1]).count
        tournament.update_columns(active_entry_teams_count: count)
      end
    end
  end

  def down
    remove_column :tournaments, :active_entry_teams_count
  end
end
