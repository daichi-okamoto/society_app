# frozen_string_literal: true

class AddApprovalStatusToTeams < ActiveRecord::Migration[7.1]
  def up
    add_column :teams, :approval_status, :integer, null: false, default: 0
    add_index :teams, :approval_status

    execute <<~SQL.squish
      UPDATE teams
      SET approval_status = 1
    SQL
  end

  def down
    remove_index :teams, :approval_status
    remove_column :teams, :approval_status
  end
end
