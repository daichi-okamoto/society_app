class MessagesController < ApplicationController
  def create
    require_admin!
    return if performed?

    msg = Message.new(
      from_user_id: current_user.id,
      to_user_id: params[:to_user_id],
      subject: params[:subject],
      body: params[:body],
      sent_at: Time.current
    )

    if msg.save
      UserMailer.message_notification(
        User.find(msg.to_user_id),
        msg.subject,
        msg.body,
        current_user
      ).deliver_now
      render json: { message: { id: msg.id, to_user_id: msg.to_user_id } }, status: :created
    else
      render json: { error: { code: "validation_error", details: msg.errors } }, status: :unprocessable_entity
    end
  end
end
