class CreateTournamentEntries < ActiveRecord::Migration[7.1]
  def change
    create_table :tournament_entries do |t|
      t.references :tournament, null: false, foreign_key: true
      t.references :team, null: false, foreign_key: true
      t.integer :status, null: false, default: 0
      t.datetime :applied_at
      t.datetime :decided_at
      t.bigint :decided_by

      t.timestamps
    end

    add_index :tournament_entries, [:tournament_id, :team_id], unique: true
    add_foreign_key :tournament_entries, :users, column: :decided_by
  end
end
