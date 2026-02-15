class MatchesController < ApplicationController
  before_action :authenticate_user!, only: [:create, :update, :result]

  def index
    tournament = Tournament.find(params[:tournament_id])
    ensure_demo_matches!(tournament)
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

  def ensure_demo_matches!(tournament)
    return unless Rails.env.development?
    return unless tournament.event_date == Date.current
    return if tournament.matches.exists?

    teams = Team.order(:id).limit(4).to_a
    return if teams.length < 2

    kickoff_base = tournament.event_date.to_time.change(hour: 10, min: 0)
    sample_pairs = [
      [teams[0], teams[1], "Aコート", kickoff_base, :finished, { home_score: 2, away_score: 0 }],
      [teams[0], teams[2] || teams[1], "Bコート", kickoff_base + 90.minutes, :scheduled, nil],
      [teams[0], teams[3] || teams[1], "Aコート", kickoff_base + 180.minutes, :scheduled, nil]
    ]

    sample_pairs.each do |home, away, field, kickoff_at, status, score|
      next if home.id == away.id

      match = Match.find_or_initialize_by(tournament_id: tournament.id, kickoff_at: kickoff_at)
      match.assign_attributes(
        home_team_id: home.id,
        away_team_id: away.id,
        field: field,
        status: status
      )
      match.save!

      if score
        result = match.match_result || match.build_match_result
        result.assign_attributes(
          home_score: score[:home_score],
          away_score: score[:away_score],
          updated_by: User.order(:id).pick(:id)
        )
        result.save!
      end
    end
  end
end
