import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import TournamentOverviewTabContent from "./components/TournamentOverviewTabContent";

const COVER_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA-MSmLmTuGcxKd0viNblk-n6qrQbumimk_bAR3RKqKgOwcKc-LdwDPReDFB_rRD1MwwSTt39C6b11lp9BXIMZLX9IlkmWtnvO4k_sCC1z1GaJjB8OOTzg9fn33yRfvDYUp8N5hid65wbnqP0gxzTZStf_ZqFAliIuh8aYl61iL1PA7GAMFN_NzCjrd6XAaIkw_BCjlqM8dQtkg1YPZt3URvVgIiy1vwv7PG6LZtwHqHrlY8_665uqovQNppZ4sat9CmbSFAXqLNE2O";

function formatDateShort(dateText) {
  if (!dateText) return "-";
  const date = new Date(`${dateText}T00:00:00`);
  return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
}

function formatKickoff(dateString) {
  if (!dateString) return "--:--";
  const dt = new Date(dateString);
  return dt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export default function TournamentDetailRegistered({ tournament }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("matches");

  useEffect(() => {
    let active = true;
    api
      .get(`/tournaments/${tournament.id}/matches`)
      .then((data) => {
        if (!active) return;
        const list = (data?.matches || []).slice().sort((a, b) => {
          return new Date(a.kickoff_at || 0).getTime() - new Date(b.kickoff_at || 0).getTime();
        });
        setMatches(list);
      })
      .catch(() => {
        if (!active) return;
        setMatches([]);
      });

    return () => {
      active = false;
    };
  }, [tournament.id]);

  const firstUnfinishedIndex = useMemo(() => {
    const index = matches.findIndex((match) => match.status !== "finished");
    return index < 0 ? 0 : index;
  }, [matches]);

  return (
    <div className="tdetail-entry-root">
      <header className="tdetail-entry-header">
        <button type="button" className="tdetail-entry-circle-btn" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h1>大会詳細</h1>
        <button type="button" className="tdetail-entry-circle-btn" aria-label="共有">
          <span className="material-symbols-outlined">share</span>
        </button>
      </header>

      <main className="tdetail-entry-main">
        <section className="tdetail-entry-hero-wrap">
          <div className="tdetail-entry-hero">
            <img src={COVER_IMAGE} alt="Tournament" />
            <div className="tdetail-entry-hero-overlay" />
            <div className="tdetail-entry-hero-copy">
              <span className="tdetail-entry-status">募集終了</span>
              <h2>{tournament.name}</h2>
            </div>
          </div>

          <div className="tdetail-entry-meta">
            <div>
              <p>開催日</p>
              <strong>{formatDateShort(tournament.event_date)}</strong>
            </div>
            <div className="sep" />
            <div>
              <p>会場</p>
              <strong>{tournament.venue || "未定"}</strong>
            </div>
            <div className="sep" />
            <div>
              <p>カテゴリー</p>
              <strong>エンジョイ</strong>
            </div>
          </div>

          <Link to={user ? `/tournaments/${tournament.id}/entry/review` : "/login"} className="tdetail-entry-review-btn">
            <span className="material-symbols-outlined">info</span>
            <span>エントリー内容を確認する</span>
          </Link>
        </section>

        <section className="tdetail-entry-alert-wrap">
          <div className="tdetail-entry-alert-card">
            <div className="head">
              <span className="material-symbols-outlined">assignment_late</span>
              <h3>選手名簿の提出が必要です</h3>
            </div>
            <p>
              スポーツ保険の適用および大会運営のため、参加選手全員の名簿提出が必要です。当日スムーズに受付を行うために事前にご提出ください。
            </p>
            <Link to={user ? `/tournaments/${tournament.id}/images` : "/login"} className="submit-btn">
              <span className="material-symbols-outlined">person_add</span>
              <span>参加選手名簿を提出する</span>
            </Link>
            <span className="material-symbols-outlined bg-icon">description</span>
          </div>
        </section>

        <nav className="tdetail-entry-tabs" aria-label="大会詳細タブ">
          <button type="button" className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
            大会概要
          </button>
          <button type="button" className={activeTab === "matches" ? "active" : ""} onClick={() => setActiveTab("matches")}>
            対戦表・結果
          </button>
          <button type="button" className={activeTab === "rules" ? "active" : ""} onClick={() => setActiveTab("rules")}>
            規約・ルール
          </button>
        </nav>

        {activeTab === "matches" ? (
          <div className="tdetail-entry-content">
            <section>
              <div className="tdetail-entry-group-head">
                <span className="bar" />
                <h2>予選リーグ Aブロック</h2>
              </div>

              {matches.length === 0 ? (
                <div className="tdetail-entry-empty">対戦表・結果はこれから作成します。公開までお待ちください。</div>
              ) : (
                <div className="tdetail-entry-matches">
                  {matches.map((match, index) => {
                    const isLive = match.status !== "finished" && index === firstUnfinishedIndex;
                    const label = match.status === "finished" ? "終了" : isLive ? "進行中" : "予定";
                    const homeScore = match.result?.home_score ?? "-";
                    const awayScore = match.result?.away_score ?? "-";
                    return (
                      <article key={match.id || `${match.kickoff_at}-${index}`} className="tdetail-entry-match-card">
                        <div className="tdetail-entry-match-head">
                          <span>{`Match ${String(index + 1).padStart(2, "0")} • ${formatKickoff(match.kickoff_at)} K.O.`}</span>
                          <span className={`tdetail-entry-chip ${isLive ? "live" : ""}`}>{label}</span>
                        </div>

                        <div className="tdetail-entry-match-row">
                          <div className="team">
                            <div className="logo">
                              <span className="material-symbols-outlined">shield</span>
                            </div>
                            <span>{match.home_team_name || "未定"}</span>
                          </div>

                          <div className="score">
                            <strong>{homeScore}</strong>
                            <i>-</i>
                            <strong>{awayScore}</strong>
                          </div>

                          <div className="team">
                            <div className="logo">
                              <span className="material-symbols-outlined">shield</span>
                            </div>
                            <span>{match.away_team_name || "未定"}</span>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : null}

        {activeTab === "overview" ? (
          <section className="tdetail-entry-overview">
            <TournamentOverviewTabContent description={tournament.description} venue={tournament.venue} />
          </section>
        ) : null}

        {activeTab === "rules" ? (
          <section className="tdetail-entry-panel">
            <h3>規約・ルール</h3>
            <ul>
              <li>オフサイドなし / 7人制 / 自由交代</li>
              <li>当日は開始20分前までに受付をお済ませください</li>
              <li>スパイクの使用は禁止（トレシュー推奨）</li>
            </ul>
          </section>
        ) : null}
      </main>
    </div>
  );
}
