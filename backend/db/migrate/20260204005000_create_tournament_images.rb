class CreateTournamentImages < ActiveRecord::Migration[7.1]
  def change
    create_table :tournament_images do |t|
      t.references :tournament, null: false, foreign_key: true
      t.string :file_url, null: false
      t.string :file_name, null: false
      t.string :content_type, null: false
      t.integer :size_bytes, null: false
      t.bigint :uploaded_by, null: false

      t.timestamps
    end

    add_foreign_key :tournament_images, :users, column: :uploaded_by
  end
end
