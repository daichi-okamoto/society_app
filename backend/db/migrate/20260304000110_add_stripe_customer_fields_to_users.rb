class AddStripeCustomerFieldsToUsers < ActiveRecord::Migration[7.1]
  def change
    add_column :users, :stripe_customer_id, :string
    add_column :users, :stripe_default_payment_method_id, :string

    add_index :users, :stripe_customer_id, unique: true
  end
end
