class CreateMessages < ActiveRecord::Migration[7.1]
  def change
    create_table :messages do |t|
      t.bigint :from_user_id, null: false
      t.bigint :to_user_id, null: false
      t.string :subject, null: false
      t.text :body, null: false
      t.datetime :sent_at

      t.timestamps
    end

    add_index :messages, :to_user_id
    add_index :messages, :sent_at
    add_foreign_key :messages, :users, column: :from_user_id
    add_foreign_key :messages, :users, column: :to_user_id
  end
end
