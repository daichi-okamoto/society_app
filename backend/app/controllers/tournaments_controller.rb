class TournamentsController < ApplicationController
  before_action :require_admin!, only: [:create, :update, :destroy]

  def index
    tournaments = Tournament.includes(:tournament_images).order(event_date: :desc)
    render json: { tournaments: tournaments.map { |t| tournament_summary(t) } }, status: :ok
  end

  def show
    tournament = Tournament.find(params[:id])
    render json: { tournament: tournament_detail(tournament) }, status: :ok
  end

  def create
    tournament = Tournament.new(tournament_params)
    if tournament.save
      render json: { tournament: { id: tournament.id, name: tournament.name } }, status: :created
    else
      render json: { error: { code: "validation_error", details: tournament.errors } }, status: :unprocessable_entity
    end
  end

  def update
    tournament = Tournament.find(params[:id])
    if tournament.update(tournament_params)
      render json: { tournament: { id: tournament.id, name: tournament.name } }, status: :ok
    else
      render json: { error: { code: "validation_error", details: tournament.errors } }, status: :unprocessable_entity
    end
  end

  def destroy
    tournament = Tournament.find(params[:id])
    tournament.destroy!
    render json: { deleted: true }, status: :ok
  end

  private

  def tournament_params
    params.permit(
      :name, :event_date, :venue, :match_half_minutes, :max_teams,
      :entry_fee_amount, :entry_fee_currency, :cancel_deadline_date,
      :description, :start_time, :end_time, :rules, :cautions
    )
  end

  def tournament_summary(t)
    {
      id: t.id,
      name: t.name,
      event_date: t.event_date,
      venue: t.venue,
      max_teams: t.max_teams,
      entry_fee_amount: t.entry_fee_amount,
      active_entry_teams_count: t.active_entry_teams_count,
      image_url: t.primary_image_url,
      start_time: format_time(t.start_time),
      end_time: format_time(t.end_time)
    }
  end

  def tournament_detail(t)
    {
      id: t.id,
      name: t.name,
      event_date: t.event_date,
      venue: t.venue,
      match_half_minutes: t.match_half_minutes,
      max_teams: t.max_teams,
      active_entry_teams_count: t.active_entry_teams_count,
      entry_fee_amount: t.entry_fee_amount,
      entry_fee_currency: t.entry_fee_currency,
      cancel_deadline_date: t.cancel_deadline_date,
      description: t.description,
      image_url: t.primary_image_url,
      start_time: format_time(t.start_time),
      end_time: format_time(t.end_time),
      rules: t.rules,
      cautions: t.cautions
    }
  end

  def format_time(value)
    value&.strftime("%H:%M")
  end
end
