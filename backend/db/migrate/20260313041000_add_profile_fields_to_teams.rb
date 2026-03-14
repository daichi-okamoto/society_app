class AddProfileFieldsToTeams < ActiveRecord::Migration[7.1]
  def change
    add_column :teams, :activity_area, :string
    add_column :teams, :introduction, :text
  end
end
