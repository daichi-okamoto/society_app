class CreateNotifications < ActiveRecord::Migration[7.1]
  def change
    create_table :notifications do |t|
      t.string :title, null: false
      t.text :body, null: false
      t.datetime :scheduled_at, null: false
      t.datetime :sent_at
      t.bigint :created_by, null: false

      t.timestamps
    end

    add_index :notifications, :sent_at
    add_foreign_key :notifications, :users, column: :created_by
  end
end
