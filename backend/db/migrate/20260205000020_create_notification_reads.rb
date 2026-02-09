class CreateNotificationReads < ActiveRecord::Migration[7.1]
  def change
    create_table :notification_reads do |t|
      t.bigint :notification_id, null: false
      t.bigint :user_id, null: false
      t.datetime :read_at, null: false

      t.timestamps
    end

    add_index :notification_reads, [:notification_id, :user_id], unique: true
    add_foreign_key :notification_reads, :notifications
    add_foreign_key :notification_reads, :users
  end
end
