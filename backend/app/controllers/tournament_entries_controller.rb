class TournamentEntriesController < ApplicationController
  before_action :authenticate_user!

  def create
    tournament = Tournament.find(params[:tournament_id])
    team = Team.find(params[:team_id])

    unless team.captain_user_id == current_user.id
      return render json: { error: { code: "forbidden" } }, status: :forbidden
    end

    if TeamMember.where(team_id: team.id, status: :active).count < 7
      return render json: { error: { code: "validation_error" } }, status: :unprocessable_entity
    end

    unless team.approved?
      return render json: { error: { code: "team_not_approved" } }, status: :forbidden
    end

    entry = TournamentEntry.new(
      tournament: tournament,
      team: team,
      status: :pending,
      applied_at: Time.current
    )

    if entry.save
      render json: { entry: { id: entry.id, status: entry.status } }, status: :created
    else
      render json: { error: { code: "validation_error", details: entry.errors } }, status: :unprocessable_entity
    end
  end

  def index
    require_admin!
    return if performed?

    entries = TournamentEntry.order(created_at: :desc)
    render json: { entries: entries.map { |e| entry_json(e) } }, status: :ok
  end

  def update
    require_admin!
    return if performed?

    entry = TournamentEntry.find(params[:id])
    if !entry.pending?
      return render json: { error: { code: "conflict" } }, status: :conflict
    end

    status = params[:status]
    unless %w[approved rejected].include?(status)
      return render json: { error: { code: "validation_error" } }, status: :unprocessable_entity
    end

    entry.update!(
      status: status,
      decided_at: Time.current,
      decided_by: current_user.id
    )

    UserMailer.tournament_entry_decision(entry.team.captain_user, entry.tournament, entry.status).deliver_now

    render json: { entry: { id: entry.id, status: entry.status } }, status: :ok
  end

  def cancel
    entry = TournamentEntry.find(params[:id])
    unless entry.team.captain_user_id == current_user.id
      return render json: { error: { code: "forbidden" } }, status: :forbidden
    end

    if entry.cancelled?
      return render json: { error: { code: "conflict" } }, status: :conflict
    end

    if Date.current > entry.tournament.cancel_deadline_date
      return render json: { error: { code: "conflict" } }, status: :conflict
    end

    entry.update!(status: :cancelled)
    UserMailer.cancel_refund(entry.team.captain_user, "cancelled").deliver_now
    render json: { entry: { id: entry.id, status: entry.status } }, status: :ok
  end

  def me
    tournament = Tournament.find(params[:tournament_id])
    team_ids = TeamMember.where(user_id: current_user.id, status: :active).pluck(:team_id)
    entry = TournamentEntry.where(tournament_id: tournament.id, team_id: team_ids).order(created_at: :desc).first

    if entry
      render json: { entry: { id: entry.id, team_id: entry.team_id, status: entry.status } }, status: :ok
    else
      render json: { entry: nil }, status: :ok
    end
  end

  private

  def entry_json(entry)
    {
      id: entry.id,
      tournament_id: entry.tournament_id,
      team_id: entry.team_id,
      status: entry.status
    }
  end
end
