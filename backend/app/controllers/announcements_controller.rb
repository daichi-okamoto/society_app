class AnnouncementsController < ApplicationController
  def index
    announcements = Announcement.order(published_at: :desc)
    render json: { announcements: announcements.map { |a| announcement_json(a) } }, status: :ok
  end

  def create
    require_admin!
    return if performed?

    announcement = Announcement.new(
      title: params[:title],
      body: params[:body],
      published_at: params[:published_at] || Time.current,
      created_by: current_user.id
    )

    if announcement.save
      render json: { announcement: { id: announcement.id, title: announcement.title } }, status: :created
    else
      render json: { error: { code: "validation_error", details: announcement.errors } }, status: :unprocessable_entity
    end
  end

  def destroy
    require_admin!
    return if performed?

    announcement = Announcement.find(params[:id])
    announcement.destroy!
    render json: { deleted: true }, status: :ok
  end

  private

  def announcement_json(a)
    { id: a.id, title: a.title, published_at: a.published_at }
  end
end
