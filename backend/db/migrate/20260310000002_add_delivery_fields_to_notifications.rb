class AddDeliveryFieldsToNotifications < ActiveRecord::Migration[7.1]
  def change
    add_column :notifications, :delivery_scope, :string, null: false, default: "everyone"
    add_column :notifications, :deliver_via_push, :boolean, null: false, default: true
    add_column :notifications, :deliver_via_email, :boolean, null: false, default: false
  end
end
