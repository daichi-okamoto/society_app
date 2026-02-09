class CreateMatches < ActiveRecord::Migration[7.1]
  def change
    create_table :matches do |t|
      t.references :tournament, null: false, foreign_key: true
      t.bigint :home_team_id, null: false
      t.bigint :away_team_id, null: false
      t.datetime :kickoff_at, null: false
      t.string :field, null: false
      t.integer :status, null: false, default: 0

      t.timestamps
    end

    add_index :matches, :tournament_id, if_not_exists: true
    add_index :matches, :kickoff_at, if_not_exists: true
    add_foreign_key :matches, :teams, column: :home_team_id
    add_foreign_key :matches, :teams, column: :away_team_id
  end
end
