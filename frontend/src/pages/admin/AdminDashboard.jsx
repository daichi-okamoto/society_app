import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import AdminBottomNav from "../../components/admin/AdminBottomNav";
import { getTournamentCoverUrl } from "../../lib/tournamentImages";

function statusByDate(eventDate) {
  if (!eventDate) return "recruiting";
  const dt = new Date(`${eventDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dt.getTime() < today.getTime()) return "finished";
  if (dt.getTime() === today.getTime()) return "live";
  return "recruiting";
}

function formatTime(raw, fallback) {
  if (!raw) return fallback;
  const text = String(raw);
  const m = text.match(/(?:T|^)(\d{2}):(\d{2})/);
  if (!m) return fallback;
  return `${Number(m[1])}:${m[2]}`;
}

function formatDateText(eventDate, startTime, endTime) {
  if (!eventDate) return "日付未設定";
  const dt = new Date(`${eventDate}T00:00:00`);
  const w = ["日", "月", "火", "水", "木", "金", "土"][dt.getDay()];
  const start = formatTime(startTime, "10:00");
  const end = formatTime(endTime, "16:00");
  return `${dt.getMonth() + 1}/${dt.getDate()} (${w}) • ${start} - ${end}`;
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);
  const [taskItems, setTaskItems] = useState([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.allSettled([api.get("/tournaments"), api.get("/admin/dashboard")])
      .then(([tournamentResult, dashboardResult]) => {
        if (!active) return;
        const tournamentData = tournamentResult.status === "fulfilled" ? tournamentResult.value : {};
        const dashboardData = dashboardResult.status === "fulfilled" ? dashboardResult.value : {};

        const list = (tournamentData?.tournaments || []).map((t) => {
          const maxTeams = Number(t.max_teams || 16);
          const current = Math.max(0, Math.min(maxTeams, Number(t.active_entry_teams_count || 0)));
          const progress = Math.round((current / Math.max(1, maxTeams)) * 100);
          const status = statusByDate(t.event_date);
          return {
            id: t.id,
            status,
            statusLabel: status === "finished" ? "終了" : status === "live" ? "開催中" : "募集中",
            statusClass: status === "finished" ? "is-finished" : status === "live" ? "is-success" : "is-primary",
            dateText: formatDateText(t.event_date, t.start_time, t.end_time),
            title: t.name,
            registeredText: `${current}/${maxTeams}チーム`,
            progress,
            revenue: `¥${Number(t.entry_fee_amount || 0).toLocaleString("ja-JP")}`,
            fullRevenue: `¥${(Number(t.entry_fee_amount || 0) * maxTeams).toLocaleString("ja-JP")}`,
            image: getTournamentCoverUrl(t),
            alt: "Tournament cover",
          };
        });
        setTournaments(list);
        setTaskItems(
          (dashboardData?.tasks || [])
            .filter((item) => Number(item?.count || 0) > 0)
            .map((item) => ({
              ...item,
              countLabel: `${Number(item.count || 0)}件`,
            }))
        );
      })
      .catch(() => {
        if (!active) return;
        setTournaments([]);
        setTaskItems([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const stats = useMemo(() => {
    const totalRevenue = tournaments.reduce((sum, t) => sum + Number(String(t.revenue).replace(/[^\d]/g, "") || 0), 0);
    return {
      revenue: `¥${totalRevenue.toLocaleString("ja-JP")}`,
      teams: tournaments.length,
    };
  }, [tournaments]);

  const activeTournaments = useMemo(
    () => tournaments.filter((tournament) => tournament.status === "recruiting" || tournament.status === "live").slice(0, 6),
    [tournaments]
  );

  const finishedTournaments = useMemo(
    () => tournaments.filter((tournament) => tournament.status === "finished").slice(0, 6),
    [tournaments]
  );

  return (
    <div className="adash-root">
      <header className="adash-header">
        <div className="adash-header-row">
          <div>
            <p className="adash-welcome">こんにちは、管理者さん</p>
            <h1 className="adash-title">管理者ダッシュボード</h1>
          </div>
          <Link to="/admin/notifications" className="adash-settings" aria-label="notifications">
            <span className="material-symbols-outlined">notifications</span>
          </Link>
        </div>
      </header>

      <main className="adash-main">
        <section className="adash-section">
          <div className="adash-section-head">
            <h3>運営中の大会</h3>
            <Link to="/admin/tournaments">すべて見る</Link>
          </div>

          <div className="adash-tournament-scroll">
            {!loading && activeTournaments.length === 0 ? <p className="adash-empty">運営中の大会はありません</p> : null}
            {activeTournaments.map((tournament) => (
              <Link key={tournament.id} to={`/admin/tournaments/${tournament.id}`} className="adash-tournament-card">
                <div className="adash-tournament-media">
                  <img src={tournament.image} alt={tournament.alt} />
                  <div className="adash-media-overlay" />
                  <span className={`adash-chip ${tournament.statusClass}`}>{tournament.statusLabel}</span>
                </div>

                <div className="adash-tournament-body">
                  <div>
                    <p className="adash-meta">{tournament.dateText}</p>
                    <h4>{tournament.title}</h4>
                  </div>

                  <div className="adash-progress">
                    <div className="adash-progress-head">
                      <span>登録状況</span>
                      <strong>{tournament.registeredText}</strong>
                    </div>
                    <div className="adash-progress-track">
                      <div className="adash-progress-fill" style={{ width: `${tournament.progress}%` }} />
                    </div>
                  </div>

                  <div className="adash-card-foot">
                    <div>
                      <span>満枠売上</span>
                      <strong>{tournament.fullRevenue}</strong>
                    </div>
                    <span className="adash-open-icon" aria-hidden="true">
                      <span className="material-symbols-outlined">arrow_forward_ios</span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {!loading && finishedTournaments.length > 0 ? (
          <section className="adash-section">
            <div className="adash-section-head">
              <h3>終了した大会</h3>
              <Link to="/admin/tournaments">一覧を見る</Link>
            </div>

            <div className="adash-tournament-scroll">
              {finishedTournaments.map((tournament) => (
                <Link key={tournament.id} to={`/admin/tournaments/${tournament.id}`} className="adash-tournament-card">
                  <div className="adash-tournament-media">
                    <img src={tournament.image} alt={tournament.alt} />
                    <div className="adash-media-overlay" />
                    <span className={`adash-chip ${tournament.statusClass}`}>{tournament.statusLabel}</span>
                  </div>

                  <div className="adash-tournament-body">
                    <div>
                      <p className="adash-meta">{tournament.dateText}</p>
                      <h4>{tournament.title}</h4>
                    </div>

                    <div className="adash-progress">
                      <div className="adash-progress-head">
                        <span>登録状況</span>
                        <strong>{tournament.registeredText}</strong>
                      </div>
                      <div className="adash-progress-track">
                        <div className="adash-progress-fill" style={{ width: `${tournament.progress}%` }} />
                      </div>
                    </div>

                    <div className="adash-card-foot">
                      <div>
                        <span>満枠売上</span>
                        <strong>{tournament.fullRevenue}</strong>
                      </div>
                      <span className="adash-open-icon" aria-hidden="true">
                        <span className="material-symbols-outlined">arrow_forward_ios</span>
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ) : null}

        <section className="adash-kpi-grid">
          <article className="adash-kpi-card">
            <span className="adash-kpi-label">
              <span className="material-symbols-outlined">payments</span>
              今月の売上
            </span>
            <strong className="adash-kpi-value">{stats.revenue}</strong>
            <span className="adash-kpi-trend">
              <span className="material-symbols-outlined">trending_up</span>
              先月比 +12%
            </span>
          </article>

          <article className="adash-kpi-card">
            <span className="adash-kpi-label">
              <span className="material-symbols-outlined">groups</span>
              新規チーム
            </span>
            <strong className="adash-kpi-value">{stats.teams}</strong>
            <span className="adash-kpi-trend">
              <span className="material-symbols-outlined">trending_up</span>
              先月比 +2
            </span>
          </article>
        </section>

        <section className="adash-section adash-task-section">
          <h3>重要タスク</h3>
          <div className="adash-task-list">
            {!loading && taskItems.length === 0 ? <p className="adash-empty">対応が必要な重要タスクはありません</p> : null}
            {taskItems.map((item) => (
              <Link to={item.href} className="adash-task-item" key={item.id}>
                <div className="adash-task-left">
                  <div className={`adash-task-icon ${item.tone}`}>
                    <span className="material-symbols-outlined">{item.icon}</span>
                  </div>
                  <div>
                    <p>{item.title}</p>
                    <small>{item.body}</small>
                  </div>
                </div>
                <div className="adash-task-right">
                  <span className={`adash-count ${item.tone}`}>{item.countLabel}</span>
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <AdminBottomNav />
    </div>
  );
}
