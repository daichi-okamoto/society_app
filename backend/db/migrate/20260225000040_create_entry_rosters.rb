class CreateEntryRosters < ActiveRecord::Migration[7.1]
  def change
    create_table :entry_rosters do |t|
      t.references :tournament_entry, null: false, foreign_key: true
      t.references :submitted_by_user, null: false, foreign_key: { to_table: :users }
      t.datetime :submitted_at, null: false

      t.timestamps
    end

    create_table :entry_roster_players do |t|
      t.references :entry_roster, null: false, foreign_key: true
      t.integer :source, null: false, default: 0
      t.references :team_member, foreign_key: true
      t.string :name, null: false
      t.string :name_kana
      t.string :phone
      t.string :email
      t.string :address
      t.string :position
      t.integer :jersey_number

      t.timestamps
    end

    add_index :entry_roster_players, :source
  end
end
