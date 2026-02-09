class CreateTeamMembers < ActiveRecord::Migration[7.1]
  def change
    create_table :team_members do |t|
      t.references :team, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :role, null: false, default: 1
      t.integer :status, null: false, default: 0
      t.datetime :joined_at
      t.datetime :removed_at

      t.timestamps
    end

    add_index :team_members, [:team_id, :user_id], unique: true
  end
end
