class CreatePayments < ActiveRecord::Migration[7.1]
  def change
    create_table :payments do |t|
      t.references :tournament_entry, null: false, foreign_key: true
      t.integer :amount, null: false
      t.string :currency, null: false, default: "JPY"
      t.integer :method, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.string :stripe_payment_intent_id
      t.string :stripe_refund_id
      t.integer :refund_amount
      t.integer :refund_fee_amount
      t.datetime :paid_at
      t.datetime :refunded_at

      t.timestamps
    end

    add_index :payments, :status
  end
end
