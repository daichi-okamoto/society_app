class CreateMatchResults < ActiveRecord::Migration[7.1]
  def change
    create_table :match_results do |t|
      t.references :match, null: false, foreign_key: true
      t.integer :home_score, null: false, default: 0
      t.integer :away_score, null: false, default: 0
      t.bigint :updated_by

      t.timestamps
    end

    add_index :match_results, :match_id, unique: true, if_not_exists: true
    add_foreign_key :match_results, :users, column: :updated_by
  end
end
