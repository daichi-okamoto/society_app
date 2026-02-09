class CreateTournaments < ActiveRecord::Migration[7.1]
  def change
    create_table :tournaments do |t|
      t.string :name, null: false
      t.date :event_date, null: false
      t.string :venue, null: false
      t.integer :match_half_minutes, null: false, default: 12
      t.integer :max_teams, null: false, default: 15
      t.integer :entry_fee_amount, null: false, default: 0
      t.string :entry_fee_currency, null: false, default: "JPY"
      t.date :cancel_deadline_date, null: false
      t.text :description
      t.integer :status, null: false, default: 0

      t.timestamps
    end

    add_index :tournaments, :event_date
    add_index :tournaments, :status
  end
end
