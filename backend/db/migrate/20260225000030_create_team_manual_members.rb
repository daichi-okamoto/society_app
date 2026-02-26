class CreateTeamManualMembers < ActiveRecord::Migration[7.1]
  def change
    create_table :team_manual_members do |t|
      t.references :team, null: false, foreign_key: true
      t.references :created_by_user, null: false, foreign_key: { to_table: :users }
      t.string :name, null: false
      t.string :name_kana
      t.string :phone, null: false
      t.string :postal_code
      t.string :prefecture
      t.string :city_block
      t.string :building
      t.string :position, null: false, default: "MF"
      t.integer :jersey_number
      t.text :avatar_data_url

      t.timestamps
    end

    add_index :team_manual_members, :created_at
  end
end
