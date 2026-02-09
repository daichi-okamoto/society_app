class TournamentImagesController < ApplicationController
  before_action :authenticate_user!

  def index
    tournament = Tournament.find(params[:tournament_id])

    unless current_user.admin? || participant_in_tournament?(tournament)
      return render json: { error: { code: "forbidden" } }, status: :forbidden
    end

    images = tournament.tournament_images.order(created_at: :desc)
    render json: { images: images.map { |i| image_json(i) } }, status: :ok
  end

  def create
    require_admin!
    return if performed?

    tournament = Tournament.find(params[:tournament_id])
    image = tournament.tournament_images.new(image_params.merge(uploaded_by: current_user.id))

    if image.save
      render json: { image: { id: image.id, file_name: image.file_name } }, status: :created
    else
      render json: { error: { code: "validation_error", details: image.errors } }, status: :unprocessable_entity
    end
  end

  def destroy
    require_admin!
    return if performed?

    image = TournamentImage.find(params[:id])
    image.destroy!
    render json: { deleted: true }, status: :ok
  end

  private

  def participant_in_tournament?(tournament)
    team_ids = tournament.tournament_entries.approved.pluck(:team_id)
    return false if team_ids.empty?

    TeamMember.exists?(user_id: current_user.id, team_id: team_ids, status: :active)
  end

  def image_params
    params.permit(:file_url, :file_name, :content_type, :size_bytes)
  end

  def image_json(image)
    {
      id: image.id,
      file_name: image.file_name,
      download_url: image.file_url,
      content_type: image.content_type,
      size_bytes: image.size_bytes
    }
  end
end
