class MatchesController < ApplicationController
  before_action :authenticate_user!, only: [:create, :update, :result]

  def index
    tournament = Tournament.find(params[:tournament_id])
    matches = tournament.matches.includes(:match_result, :home_team, :away_team)

    render json: { matches: matches.map { |m| match_json(m) } }, status: :ok
  end

  def create
    require_admin!
    return if performed?

    match = Match.new(match_params)
    if match.save
      render json: { match: { id: match.id } }, status: :created
    else
      render json: { error: { code: "validation_error", details: match.errors } }, status: :unprocessable_entity
    end
  end

  def update
    require_admin!
    return if performed?

    match = Match.find(params[:id])
    if match.update(match_params)
      render json: { match: { id: match.id, status: match.status } }, status: :ok
    else
      render json: { error: { code: "validation_error", details: match.errors } }, status: :unprocessable_entity
    end
  end

  def result
    require_admin!
    return if performed?

    match = Match.find(params[:id])
    result = match.match_result || match.build_match_result
    result.home_score = params[:home_score]
    result.away_score = params[:away_score]
    result.updated_by = current_user.id

    if result.save
      match.update!(status: :finished)
      render json: { result: { match_id: match.id, home_score: result.home_score, away_score: result.away_score } }, status: :ok
    else
      render json: { error: { code: "validation_error", details: result.errors } }, status: :unprocessable_entity
    end
  end

  private

  def match_params
    params.permit(:tournament_id, :home_team_id, :away_team_id, :kickoff_at, :field, :status)
  end

  def match_json(match)
    updater = match.match_result&.updated_by ? User.find_by(id: match.match_result.updated_by) : nil
    {
      id: match.id,
      home_team_id: match.home_team_id,
      away_team_id: match.away_team_id,
      home_team_name: match.home_team&.name,
      away_team_name: match.away_team&.name,
      kickoff_at: match.kickoff_at,
      field: match.field,
      status: match.status,
      result: match.match_result&.slice(:home_score, :away_score),
      result_updated_by: match.match_result&.updated_by,
      result_updated_by_name: updater&.name
    }
  end
end
