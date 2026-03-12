class AddDetailFieldsToTournaments < ActiveRecord::Migration[7.1]
  def change
    add_column :tournaments, :start_time, :time
    add_column :tournaments, :end_time, :time
    add_column :tournaments, :rules, :text
  end
end
