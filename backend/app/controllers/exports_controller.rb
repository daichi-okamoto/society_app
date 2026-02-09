require "csv"

class ExportsController < ApplicationController
  before_action :require_admin!

  def insurance
    members = TeamMember.includes(:team, :user).where(status: :active)

    csv = CSV.generate(headers: true) do |row|
      row << ["氏名", "ふりがな", "生年月日", "電話", "メール", "住所", "チーム名"]
      members.each do |m|
        row << [
          m.user.name,
          m.user.name_kana,
          m.user.birth_date,
          m.user.phone,
          m.user.email,
          m.user.address,
          m.team.name
        ]
      end
    end

    send_data csv, filename: "insurance_members.csv"
  end
end
