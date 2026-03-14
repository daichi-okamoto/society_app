class AddLinkPathToNotifications < ActiveRecord::Migration[7.1]
  def change
    add_column :notifications, :link_path, :string
  end
end
