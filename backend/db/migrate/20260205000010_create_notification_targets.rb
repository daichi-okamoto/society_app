class CreateNotificationTargets < ActiveRecord::Migration[7.1]
  def change
    create_table :notification_targets do |t|
      t.bigint :notification_id, null: false
      t.integer :target_type, null: false
      t.bigint :target_id

      t.timestamps
    end

    add_index :notification_targets, :notification_id
    add_index :notification_targets, [:target_type, :target_id]
    add_foreign_key :notification_targets, :notifications
  end
end
