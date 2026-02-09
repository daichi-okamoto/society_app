class CreateTeamJoinRequests < ActiveRecord::Migration[7.1]
  def change
    create_table :team_join_requests do |t|
      t.references :team, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :status, null: false, default: 0
      t.datetime :requested_at
      t.datetime :decided_at
      t.bigint :decided_by

      t.timestamps
    end

    add_index :team_join_requests, [:team_id, :user_id, :status], name: "idx_join_requests_pending"
    add_foreign_key :team_join_requests, :users, column: :decided_by
  end
end
