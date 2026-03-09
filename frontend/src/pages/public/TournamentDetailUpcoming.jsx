import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import TournamentOverviewTabContent from "./components/TournamentOverviewTabContent";
import { getTournamentCoverUrl } from "../../lib/tournamentImages";

function formatDate(dateText) {
  if (!dateText) return "-";
  const date = new Date(`${dateText}T00:00:00`);
  return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
}

function formatTime(timeText, fallback = "19:00") {
  const raw = timeText || fallback;
  const match = String(raw).match(/(?:T|^)(\d{2}):(\d{2})/);
  if (!match) return fallback;
  return `${Number(match[1])}:${match[2]}`;
}

function parseBulletItems(rawText) {
  return String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-・✅\s]+/, "").trim())
    .filter(Boolean);
}

export default function TournamentDetailUpcoming({ tournament }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sheetOffset, setSheetOffset] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const [maxSheetOffset, setMaxSheetOffset] = useState(108);
  const dragRef = useRef({ startY: 0, startOffset: 0 });
  const tabsRef = useRef(null);

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

  const startTime = formatTime(tournament.start_time, "19:00");
  const endTime = formatTime(tournament.end_time, "21:00");
  const maxTeams = Number(tournament.max_teams || 0);
  const activeTeams = Number(tournament.active_entry_teams_count || 0);
  const remainingTeams = Math.max(maxTeams - activeTeams, 0);
  const ruleLines = parseBulletItems(tournament.rules);
  const cautionItems = parseBulletItems(tournament.cautions);

  return (
    <div
      className={`tdetail-root ${isDraggingSheet ? "dragging" : ""} ${sheetOffset > maxSheetOffset * 0.5 ? "expanded" : ""}`}
      style={{ "--sheet-offset": `${sheetOffset}px` }}
    >
      <div className="tdetail-hero">
        <img src={getTournamentCoverUrl(tournament)} alt={tournament.name} />
        <div className="tdetail-hero-overlay" />
        <button type="button" className="tdetail-back" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="tdetail-hero-copy">
          <span className="tdetail-status">募集中</span>
          <h1>{tournament.name}</h1>
          <div className="tdetail-hero-venue">
            <span className="material-symbols-outlined">location_on</span>
            <span>{tournament.venue}</span>
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
              <small>開催日時</small>
              <strong>{formatDate(tournament.event_date)}</strong>
              <strong>
                {startTime}〜{endTime}
              </strong>
            </article>
            <article>
              <span className="material-symbols-outlined">groups</span>
              <small>募集チーム</small>
              <strong>
                残り {remainingTeams} / {maxTeams}
              </strong>
            </article>
            <article>
              <span className="material-symbols-outlined">payments</span>
              <small>参加費</small>
              <strong>¥{Number(tournament.entry_fee_amount || 0).toLocaleString("ja-JP")}</strong>
              <em>/ 1チーム</em>
            </article>
          </div>
        </section>

        <section>
          <div className="tdetail-tabs" ref={tabsRef}>
            <button type="button" className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
              概要
            </button>
            <button type="button" className={activeTab === "rules" ? "active" : ""} onClick={() => setActiveTab("rules")}>
              ルール
            </button>
          </div>

          <div className="tdetail-content">
            {activeTab === "overview" ? (
              <TournamentOverviewTabContent description={tournament.description} venue={tournament.venue} cautionItems={cautionItems} />
            ) : (
              <div className="tdetail-sections">
                <section>
                  <h2>
                    <span />
                    ルール
                  </h2>
                  {ruleLines.length > 0 ? (
                    <ul className="tdetail-dots">
                      {ruleLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>ルール情報は準備中です。</p>
                  )}
                </section>
              </div>
            )}
          </div>
        </section>
      </main>

      <div className="tdetail-entry-wrap">
        <Link to={user ? `/tournaments/${tournament.id}/entry` : "/login"} className="tdetail-entry-btn">
          <span>大会にエントリーする</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
