import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import LoadingScreen from "../../components/LoadingScreen";

function splitTournamentsByDate(tournaments) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const current = [];
  const future = [];
  const past = [];

  tournaments.forEach((tournament) => {
    const eventDate = new Date(`${tournament.event_date}T00:00:00`);
    if (Number.isNaN(eventDate.getTime())) return;

    if (eventDate.getTime() === today.getTime()) {
      current.push(tournament);
      return;
    }

    if (eventDate > today) {
      future.push(tournament);
      return;
    }

    past.push(tournament);
  });

  future.sort((a, b) => a.event_date.localeCompare(b.event_date));
  past.sort((a, b) => b.event_date.localeCompare(a.event_date));

  return { current, future, past };
}

function formatDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "short",
    day: "numeric",
    weekday: "short"
  });
}

function formatMonthDay(date) {
  const d = new Date(`${date}T00:00:00`);
  return `${d.getMonth() + 1}.${d.getDate().toString().padStart(2, "0")}`;
}

export default function AppHome() {
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get("/tournaments")
      .then((tournamentsData) => {
        if (!active) return;
        const tournamentList = tournamentsData?.tournaments || [];
        setTournaments(tournamentList);
      })
      .catch(() => {
        if (!active) return;
        setError("ホーム情報の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    api
      .get("/notifications")
      .then((data) => {
        if (!active) return;
        const unreadCount = Number(data?.unread_count || 0);
        const unreadList = data?.notifications || [];
        setHasUnreadNotifications(unreadCount > 0 || unreadList.length > 0);
      })
      .catch(() => {
        if (!active) return;
        setHasUnreadNotifications(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const grouped = useMemo(() => splitTournamentsByDate(tournaments), [tournaments]);
  const featured = grouped.current[0] || grouped.future[0] || null;
  const recommended = grouped.future.slice(0, 6);
  const history = grouped.past.slice(0, 6);

  if (loading) return <LoadingScreen />;
  if (error) return <section>{error}</section>;

  return (
    <div className="j7-root">
      <header className="j7-header">
        <div className="j7-header-copy">
          <p className="j7-greeting">こんにちは、</p>
          <h1 className="j7-name">{user?.name || "ゲスト"}さん</h1>
        </div>
        <Link to="/notifications" className="j7-bell" aria-label="通知">
          <span className="material-symbols-outlined j7-bell-icon">notifications</span>
          {hasUnreadNotifications ? <span className="j7-bell-dot" /> : null}
        </Link>
      </header>

      <main className="j7-main">
      <section className="j7-section j7-top">
        <div className="j7-title-row">
          <h2 className="j7-title">
            <span className="j7-title-bar" />
            参加中・エントリー中の大会
          </h2>
        </div>
        {featured ? (
          <article className="j7-featured-card">
            <div className="j7-featured-bg" />
            <div className="j7-featured-inner">
              <div className="j7-badge-row">
              <span className="j7-badge j7-badge-primary">{grouped.current.length > 0 ? "開催中" : "エントリー済み"}</span>
              <span className="j7-badge j7-badge-warning">
                <span className="material-symbols-outlined">error</span>
                名簿未提出
              </span>
              <span className="j7-at">@ {featured.venue}</span>
              </div>
              <h3 className="j7-featured-name">{featured.name}</h3>
              <div className="j7-featured-meta">
                <p>
                  <span className="material-symbols-outlined">calendar_today</span>
                  <span>{formatDate(featured.event_date)}</span>
                </p>
                <p>
                  <span className="material-symbols-outlined">schedule</span>
                  <span>10:00 - 14:00</span>
                </p>
              </div>
              <Link to={`/tournaments/${featured.id}`} className="j7-featured-cta">
                <span>大会詳細・対戦表</span>
                <span className="material-symbols-outlined">chevron_right</span>
              </Link>
            </div>
          </article>
        ) : (
          <p className="j7-empty">参加中の大会はありません。</p>
        )}
      </section>

      <section className="j7-section j7-mid">
        <div className="j7-title-row j7-between">
          <h2 className="j7-title">
            <span className="j7-title-bar" />
            おすすめの大会
          </h2>
          <button type="button" className="j7-more">もっと見る</button>
        </div>
        {recommended.length === 0 ? (
          <p className="j7-empty">募集予定の大会はありません。</p>
        ) : (
          <div className="j7-recommend-row">
            {recommended.map((tournament) => (
              <Link key={tournament.id} to={`/tournaments/${tournament.id}`} className="j7-recommend-card">
                <div className="j7-recommend-image">
                  <span className="j7-recruit">募集中</span>
                </div>
                <div className="j7-recommend-body">
                  <h4>{tournament.name}</h4>
                  <p>
                    <span className="material-symbols-outlined">location_on</span>
                    {tournament.venue}
                  </p>
                  <div>{formatDate(tournament.event_date)}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section className="j7-section j7-bottom">
        <div className="j7-title-row">
          <h2 className="j7-title">
            <span className="j7-title-bar" />
            過去の大会
          </h2>
        </div>
        {history.length === 0 ? (
          <p className="j7-empty">過去大会はありません。</p>
        ) : (
          <div className="j7-history-list">
            {history.map((tournament, index) => (
              <Link key={tournament.id} to={`/tournaments/${tournament.id}/results`} className="j7-history-link">
                <div className="j7-history-left">
                  <div className="j7-history-icon">
                    <span>{formatMonthDay(tournament.event_date)}</span>
                    <span className="material-symbols-outlined">
                      {index === 0 ? "emoji_events" : "sports_soccer"}
                    </span>
                  </div>
                  <div className="j7-history-text">
                    <h4>{tournament.name}</h4>
                    <div>
                      <span>{index === 0 ? "準優勝" : "ベスト4"}</span>
                      <small>{index === 0 ? "4勝1敗1分" : "3勝2敗"}</small>
                    </div>
                  </div>
                </div>
                <span className="material-symbols-outlined j7-right">chevron_right</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      </main>

      <nav className="j7-nav">
        <div className="j7-nav-row">
          <Link to="/app/home" className="j7-nav-item active">
            <span className="material-symbols-outlined">home</span>
            <span>ホーム</span>
          </Link>
          <Link to="/tournaments" className="j7-nav-item">
            <span className="material-symbols-outlined">search</span>
            <span>さがす</span>
          </Link>
          <div className="j7-nav-center">
            <button type="button">
              <span className="material-symbols-outlined">sports_soccer</span>
            </button>
          </div>
          <Link to="/teams" className="j7-nav-item">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/me" className="j7-nav-item">
            <span className="material-symbols-outlined">person</span>
            <span>マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
