class UserMailer < ApplicationMailer
  default from: ENV.fetch("SMTP_FROM", "no-reply@society.app")

  def team_join_decision(user, team, status)
    @user = user
    @team = team
    @status = status
    mail(to: @user.email, subject: "チーム参加申請が#{status}されました", body: "チーム: #{team.name}\n結果: #{status}")
  end

  def tournament_entry_decision(user, tournament, status)
    mail(to: user.email, subject: "大会参加申込が#{status}されました", body: "大会: #{tournament.name}\n結果: #{status}")
  end

  def payment_status(user, status)
    mail(to: user.email, subject: "決済ステータス: #{status}", body: "決済ステータス: #{status}")
  end

  def cancel_refund(user, status)
    mail(to: user.email, subject: "キャンセル/返金: #{status}", body: "キャンセル/返金: #{status}")
  end

  def message_notification(user, subject, body, from_user)
    mail(
      to: user.email,
      subject: "運営からの連絡: #{subject}",
      body: "送信者: #{from_user.name}\n件名: #{subject}\n\n#{body}"
    )
  end
end
