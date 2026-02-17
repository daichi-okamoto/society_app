import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

const coverImages = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuArmpCuqVtA8v8TSrNLYNIa8STfBQr0JkidJPLJYHTg6K2qy98F3J0sHQ0WtejsoXu9JWYGCAc_Eodv-dRIIssNeiCJ4uRhCdBwETMSqfNcqp86lm8rt76vTh0lXAQdzu56cLaHk6C2OOQ8NIqMDH0VVI_sF364oBWQk3a2bRgzDTJyAO_VSsaOkft8yeqkNh1Bp0g-l2LfUCHNeAUxJPC9TcPK-HS55ht7pWufV-cXhCT_uE8nAaq4aUdygoSPXjNPlBUpdCwc7tU0",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA8qTaFGfVeqVEhcPp-LqZdm8kjvmFfQhFYnpLfRy004cqDeJM1GNlUFFnvHQCp91sfzqpZ7D5ArH5zL8pYYYQ7oDXT80w_n-P3-eWZGXvcSOc39FLS82aE_yqgyofZ61yWdN3RgLAiu4cZozUip9BD31LeC0oREahhR5NzPTqy0pBQkZWNV3zy6ylbiFJ_BHpfi38VIfYHPKs8Xff1PNR2r_YBXGMjaF6jIjwskbEm2BPqTaP_bTvMTp7-cThHzpwRWtAIybOw7UL3",
];

function formatDateText(eventDate) {
  if (!eventDate) return "日付未設定";
  const dt = new Date(`${eventDate}T00:00:00`);
  const w = ["日", "月", "火", "水", "木", "金", "土"][dt.getDay()];
  return `${dt.getMonth() + 1}/${dt.getDate()} (${w}) • 10:00 - 16:00`;
}

const taskItems = [
  {
    id: "teams",
    title: "未承認のチーム",
    body: "新規登録の確認が必要です",
    count: "3件",
    icon: "person_add",
    tone: "primary",
  },
  {
    id: "roster",
    title: "名簿未提出の督促",
    body: "大会3日前です",
    count: "5件",
    icon: "assignment_late",
    tone: "amber",
  },
  {
    id: "payments",
    title: "入金確認待ち",
    body: "銀行振込の確認",
    count: "1件",
    icon: "credit_card",
    tone: "slate",
  },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [tournaments, setTournaments] = useState([]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/tournaments")
      .then((data) => {
        if (!active) return;
        const list = (data?.tournaments || []).slice(0, 6).map((t, idx) => {
          const maxTeams = Number(t.max_teams || 16);
          const current = Math.max(0, Math.min(maxTeams, Number(t.active_entry_teams_count || 0)));
          const progress = Math.round((current / Math.max(1, maxTeams)) * 100);
          return {
            id: t.id,
            status: idx % 2 === 0 ? "募集中" : "開催間近",
            statusClass: idx % 2 === 0 ? "is-primary" : "is-success",
            dateText: formatDateText(t.event_date),
            title: t.name,
            registeredText: `${current}/${maxTeams}チーム`,
            progress,
            revenue: `¥${Number(t.entry_fee_amount || 0).toLocaleString("ja-JP")}`,
            image: coverImages[idx % coverImages.length],
            alt: "Tournament cover",
          };
        });
        setTournaments(list);
      })
      .catch(() => {
        if (!active) return;
        setTournaments([]);
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

  return (
    <div className="adash-root">
      <header className="adash-header">
        <div className="adash-header-row">
          <div>
            <p className="adash-welcome">こんにちは、管理者さん</p>
            <h1 className="adash-title">管理者ダッシュボード</h1>
          </div>
          <button type="button" className="adash-settings" aria-label="settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
        <div className="adash-search-wrap">
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="大会、チーム、選手を検索" />
        </div>
      </header>

      <main className="adash-main">
        <section className="adash-section">
          <div className="adash-section-head">
            <h3>運営中の大会</h3>
            <Link to="/admin/tournaments">すべて見る</Link>
          </div>

          <div className="adash-tournament-scroll">
            {!loading && tournaments.length === 0 ? <p className="adash-empty">大会データがありません</p> : null}
            {tournaments.map((tournament) => (
              <article key={tournament.id} className="adash-tournament-card">
                <div className="adash-tournament-media">
                  <img src={tournament.image} alt={tournament.alt} />
                  <div className="adash-media-overlay" />
                  <span className={`adash-chip ${tournament.statusClass}`}>{tournament.status}</span>
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
                      <span>予想売上</span>
                      <strong>{tournament.revenue}</strong>
                    </div>
                    <button type="button" aria-label="open">
                      <span className="material-symbols-outlined">arrow_forward_ios</span>
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

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
            {taskItems.map((item) => (
              <button type="button" className="adash-task-item" key={item.id}>
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
                  <span className={`adash-count ${item.tone}`}>{item.count}</span>
                  <span className="material-symbols-outlined">chevron_right</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>

      <nav className="adash-bottom-nav">
        <div className="adash-bottom-nav-inner">
          <Link to="/admin" className="adash-nav-btn is-active">
            <span className="material-symbols-outlined">dashboard</span>
            <span>ダッシュ</span>
          </Link>
          <Link to="/admin/tournaments" className="adash-nav-btn">
            <span className="material-symbols-outlined">calendar_month</span>
            <span>大会</span>
          </Link>
          <Link to="/admin/teams" className="adash-nav-btn">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/admin/payments" className="adash-nav-btn">
            <span className="material-symbols-outlined">payments</span>
            <span>決済</span>
          </Link>
          <Link to="/admin/notifications" className="adash-nav-btn adash-nav-notify">
            <span className="adash-notify-dot" />
            <span className="material-symbols-outlined">notifications</span>
            <span>通知</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
