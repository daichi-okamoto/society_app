import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import TournamentOverviewTabContent from "./components/TournamentOverviewTabContent";

const COVER_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA-MSmLmTuGcxKd0viNblk-n6qrQbumimk_bAR3RKqKgOwcKc-LdwDPReDFB_rRD1MwwSTt39C6b11lp9BXIMZLX9IlkmWtnvO4k_sCC1z1GaJjB8OOTzg9fn33yRfvDYUp8N5hid65wbnqP0gxzTZStf_ZqFAliIuh8aYl61iL1PA7GAMFN_NzCjrd6XAaIkw_BCjlqM8dQtkg1YPZt3URvVgIiy1vwv7PG6LZtwHqHrlY8_665uqovQNppZ4sat9CmbSFAXqLNE2O";
const SUBMIT_KEY_PREFIX = "roster-submit:";

function submitKey(tournamentId) {
  return `${SUBMIT_KEY_PREFIX}${tournamentId}`;
}

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

export default function TournamentDetailRegistered({ tournament, entryTeamId }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [rosterSubmitted, setRosterSubmitted] = useState(false);
  const [sheetOffset, setSheetOffset] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const [maxSheetOffset, setMaxSheetOffset] = useState(108);
  const dragRef = useRef({ startY: 0, startOffset: 0 });
  const tabsRef = useRef(null);

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

  useEffect(() => {
    if (!tournament?.id || typeof window === "undefined") {
      setRosterSubmitted(false);
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(submitKey(tournament.id));
      const parsed = raw ? JSON.parse(raw) : null;
      setRosterSubmitted(Boolean(parsed?.players?.length));
    } catch {
      setRosterSubmitted(false);
    }
  }, [tournament?.id]);

  const firstUnfinishedIndex = useMemo(() => {
    const index = matches.findIndex((match) => match.status !== "finished");
    return index < 0 ? 0 : index;
  }, [matches]);

  useEffect(() => {
    const recalc = () => {
      if (!tabsRef.current) return;
      const rect = tabsRef.current.getBoundingClientRect();
      const next = Math.max(108, Math.min(180, Math.round(rect.top - 8)));
      setMaxSheetOffset(next);
      setSheetOffset((prev) => Math.min(prev, next));
    };

    recalc();
    window.addEventListener("resize", recalc);
    return () => window.removeEventListener("resize", recalc);
  }, []);

  useEffect(() => {
    const onPointerMove = (event) => {
      if (!isDraggingSheet) return;
      const delta = dragRef.current.startY - event.clientY;
      const next = Math.max(0, Math.min(maxSheetOffset, dragRef.current.startOffset + delta));
      setSheetOffset(next);
    };

    const onPointerUp = () => {
      if (!isDraggingSheet) return;
      setIsDraggingSheet(false);
      setSheetOffset((prev) => (prev >= maxSheetOffset * 0.45 ? maxSheetOffset : 0));
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, [isDraggingSheet, maxSheetOffset]);

  function startSheetDrag(event) {
    dragRef.current = { startY: event.clientY, startOffset: sheetOffset };
    setIsDraggingSheet(true);
  }

  return (
    <div
      className={`tdetail-root ${isDraggingSheet ? "dragging" : ""} ${sheetOffset > maxSheetOffset * 0.5 ? "expanded" : ""}`}
      style={{ "--sheet-offset": `${sheetOffset}px` }}
    >
      <div className="tdetail-hero">
        <img src={COVER_IMAGE} alt="Tournament Cover" />
        <div className="tdetail-hero-overlay" />
        <button type="button" className="tdetail-back" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="tdetail-hero-copy">
          <span className="tdetail-status">募集終了</span>
          <h1>{tournament.name}</h1>
          <div className="tdetail-hero-venue">
            <span className="material-symbols-outlined">location_on</span>
            <span>{tournament.venue || "未定"}</span>
          </div>
        </div>
      </div>

      <main className="tdetail-main">
        <div className="tdetail-handle-wrap">
          <button
            type="button"
            className="tdetail-handle-btn"
            aria-label="シートを移動"
            onPointerDown={startSheetDrag}
            onClick={() => setSheetOffset((prev) => (prev > 0 ? 0 : maxSheetOffset))}
          >
            <span className="tdetail-handle" />
          </button>
        </div>

        <section className="tdetail-info">
          <div className="tdetail-kpis">
            <article>
              <span className="material-symbols-outlined">calendar_month</span>
              <small>開催日</small>
              <strong>{formatDateShort(tournament.event_date)}</strong>
            </article>
            <article>
              <span className="material-symbols-outlined">groups</span>
              <small>参加状態</small>
              <strong>エントリー済み</strong>
            </article>
            <article>
              <span className="material-symbols-outlined">category</span>
              <small>カテゴリー</small>
              <strong>エンジョイ</strong>
            </article>
          </div>
        </section>

        <section className="tdetail-entry-alert-wrap">
          <div className={`tdetail-entry-alert-card ${rosterSubmitted ? "is-submitted" : ""}`}>
            <div className="head">
              <span className="material-symbols-outlined">{rosterSubmitted ? "task_alt" : "assignment_late"}</span>
              <h3>{rosterSubmitted ? "選手名簿を提出済みです" : "選手名簿の提出が必要です"}</h3>
            </div>
            {rosterSubmitted ? (
              <p>提出済みの名簿を確認し、必要に応じて編集できます。メンバー変更がある場合は大会前に更新してください。</p>
            ) : (
              <p>
                スポーツ保険の適用および大会運営のため、参加選手全員の名簿提出が必要です。当日スムーズに受付を行うために事前にご提出ください。
              </p>
            )}
            <Link
              to={
                user
                  ? `/tournaments/${tournament.id}/entry/review/roster${entryTeamId ? `?team_id=${entryTeamId}` : ""}`
                  : "/login"
              }
              className="submit-btn"
            >
              <span className="material-symbols-outlined">{rosterSubmitted ? "edit_note" : "person_add"}</span>
              <span>{rosterSubmitted ? "提出した名簿を確認・編集する" : "参加選手名簿を提出する"}</span>
            </Link>
            <span className="material-symbols-outlined bg-icon">description</span>
          </div>
        </section>

        <section className="tdetail-tabs-wrap">
          <div className="tdetail-tabs" ref={tabsRef}>
            <button type="button" className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
              大会概要
            </button>
            <button type="button" className={activeTab === "matches" ? "active" : ""} onClick={() => setActiveTab("matches")}>
              対戦表・結果
            </button>
            <button type="button" className={activeTab === "rules" ? "active" : ""} onClick={() => setActiveTab("rules")}>
              規約・ルール
            </button>
          </div>
        </section>

        <div className="tdetail-content">
          {activeTab === "overview" ? (
            <section className="tdetail-entry-overview">
              <TournamentOverviewTabContent description={tournament.description} venue={tournament.venue} />
            </section>
          ) : null}

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

          {activeTab === "rules" ? (
            <section className="tdetail-sections">
              <section>
                <h2>
                  <span />
                  規約・ルール
                </h2>
                <ul className="tdetail-dots">
                  <li>オフサイドなし / 7人制 / 自由交代</li>
                  <li>当日は開始20分前までに受付をお済ませください</li>
                  <li>スパイクの使用は禁止（トレシュー推奨）</li>
                </ul>
              </section>
            </section>
          ) : null}
        </div>
      </main>

      <div className="tdetail-entry-wrap">
        <Link to={user ? `/tournaments/${tournament.id}/entry/review` : "/login"} className="tdetail-entry-btn">
          <span>エントリー内容を確認する</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
