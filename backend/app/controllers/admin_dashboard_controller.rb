class AdminDashboardController < ApplicationController
  before_action :authenticate_user!

  def show
    require_admin!
    return if performed?

    render json: { tasks: task_items }, status: :ok
  end

  private

  def task_items
    [
      pending_teams_task,
      roster_reminder_task,
      match_setup_task
    ]
  end

  def pending_teams_task
    count = Team.pending.count
    {
      id: "teams",
      title: "未承認のチーム",
      body: "新規登録の確認が必要です",
      count: count,
      icon: "person_add",
      tone: "primary",
      href: "/admin/teams/pending"
    }
  end

  def roster_reminder_task
    upcoming_range = (Date.current + 1.day)..(Date.current + 3.days)
    entries = TournamentEntry
      .approved
      .joins(:tournament)
      .left_outer_joins(:entry_roster)
      .where(tournaments: { event_date: upcoming_range })
      .where(entry_rosters: { id: nil })

    {
      id: "roster",
      title: "名簿未提出の督促",
      body: "開催3日以内の大会があります",
      count: entries.count,
      icon: "assignment_late",
      tone: "amber",
      href: "/admin/entries"
    }
  end

  def match_setup_task
    upcoming_range = (Date.current + 1.day)..(Date.current + 7.days)
    tournaments = Tournament
      .where(event_date: upcoming_range)
      .left_outer_joins(:matches)
      .group("tournaments.id")
      .having("COUNT(matches.id) = 0")
      .order(event_date: :asc)

    tournament_list = tournaments.to_a
    first_tournament = tournament_list.first

    {
      id: "matches",
      title: "対戦表未作成の大会",
      body: "開催1週間以内で対戦表が未作成です",
      count: tournament_list.length,
      icon: "calendar_clock",
      tone: "slate",
      href: first_tournament ? "/admin/matches?tournamentId=#{first_tournament.id}" : "/admin/tournaments"
    }
  end
end
