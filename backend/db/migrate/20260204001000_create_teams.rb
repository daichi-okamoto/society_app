class CreateTeams < ActiveRecord::Migration[7.1]
  def change
    create_table :teams do |t|
      t.string :name, null: false
      t.bigint :captain_user_id, null: false
      t.string :join_code, null: false
      t.bigint :created_by, null: false

      t.timestamps
    end

    add_index :teams, :join_code, unique: true
    add_index :teams, :captain_user_id
    add_foreign_key :teams, :users, column: :captain_user_id
    add_foreign_key :teams, :users, column: :created_by
  end
end
