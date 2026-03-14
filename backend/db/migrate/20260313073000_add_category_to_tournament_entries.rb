class AddCategoryToTournamentEntries < ActiveRecord::Migration[7.1]
  def change
    add_column :tournament_entries, :category, :string
  end
end
