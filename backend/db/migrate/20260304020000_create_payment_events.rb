class CreatePaymentEvents < ActiveRecord::Migration[7.1]
  def change
    create_table :payment_events do |t|
      t.references :payment, null: false, foreign_key: true
      t.string :event_type, null: false
      t.string :level, null: false, default: "info"
      t.text :message, null: false
      t.jsonb :metadata, null: false, default: {}
      t.bigint :created_by
      t.timestamps
    end

    add_index :payment_events, :event_type
    add_index :payment_events, :level
    add_index :payment_events, :created_at
  end
end
