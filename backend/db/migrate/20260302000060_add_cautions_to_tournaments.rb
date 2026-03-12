class AddCautionsToTournaments < ActiveRecord::Migration[7.1]
  def change
    add_column :tournaments, :cautions, :text
  end
end
