class CreateAnnouncements < ActiveRecord::Migration[7.1]
  def change
    create_table :announcements do |t|
      t.string :title, null: false
      t.text :body, null: false
      t.datetime :published_at, null: false
      t.bigint :created_by, null: false

      t.timestamps
    end

    add_index :announcements, :published_at
    add_foreign_key :announcements, :users, column: :created_by
  end
end
