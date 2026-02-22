import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";
import { useAuth } from "../../context/AuthContext";

const COVER_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCX9N6okYrlSA1JKbjKPe2_OujI5m-zAzfcWY6dOzQXUlqN9fIRSxO_fow1KBmxaYSudTZ_ag5J0YGHfE5NyDAiKo88kZu02LEKIs7vX7-YpAIhujKiuIZaTgsNOir5-rx2E2WiM2ozCYYAcfeiFYyxfOngcE6_Tx7HCaieXyeyOVbYf1Pfz8ry5aegO7v_iIommHbn2LUuXWkF4IgkzymE5RF7WbOhknTU51mDkLaYr64wO2o7IWVRuAoo9mNi55XVan_RHplgzHaw";

function formatHeaderDate(dateText) {
  if (!dateText) return "-";
  const date = new Date(`${dateText}T00:00:00`);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const weekday = date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase();
  return `${yyyy}.${mm}.${dd} ${weekday}`;
}

function formatKickoffTime(kickoffAt, index) {
  if (!kickoffAt) return `${String(10 + index).padStart(2, "0")}:00 Kickoff`;
  const text = new Date(kickoffAt).toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return `${text} Kickoff`;
}

function formatKickoffDateTime(kickoffAt, index) {
  if (!kickoffAt) return `第${index + 1}試合`;
  const date = new Date(kickoffAt);
  const dateText = date.toLocaleDateString("ja-JP", {
    month: "numeric",
    day: "numeric",
    weekday: "short"
  });
  const timeText = date.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
  return `${dateText} ${timeText}`;
}

function hasScoreResult(match) {
  if (!match?.result) return false;
  const { home_score: homeScore, away_score: awayScore } = match.result;
  return homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined;
}

function parseScore(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function summarizeMatches(matches, focusTeamId) {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  const normalizedMatches = matches
    .filter((match) => hasScoreResult(match))
    .filter((match) => {
      return match.home_team_id === focusTeamId || match.away_team_id === focusTeamId;
    })
    .map((match, index) => {
      const homeName = match.home_team_name || "HOME";
      const awayName = match.away_team_name || "AWAY";
      const homeScore = parseScore(match.result?.home_score);
      const awayScore = parseScore(match.result?.away_score);
      if (homeScore === null || awayScore === null) return null;
      const isFocusHome = match.home_team_id === focusTeamId;
      const leftName = isFocusHome ? homeName : awayName;
      const rightName = isFocusHome ? awayName : homeName;
      const leftScore = isFocusHome ? homeScore : awayScore;
      const rightScore = isFocusHome ? awayScore : homeScore;

    goalsFor += leftScore;
    goalsAgainst += rightScore;

    let resultLabel = "DRAW";
    if (leftScore > rightScore) {
      wins += 1;
      resultLabel = "WIN";
    } else if (leftScore < rightScore) {
      losses += 1;
      resultLabel = "LOSS";
    } else {
      draws += 1;
    }

    return {
      id: match.id || `${index}-${match.kickoff_at || ""}`,
      kickoffLabel: formatKickoffTime(match.kickoff_at, index),
      resultLabel,
      leftName,
      rightName,
      leftScore,
      rightScore
    };
  })
  .filter(Boolean);

  return { wins, losses, draws, goalsFor, goalsAgainst, normalizedMatches };
}

function buildStandings(matches, focusTeamId) {
  const table = new Map();

  const ensureRow = (teamId, name) => {
    const key = `${teamId || "none"}:${name || "unknown"}`;
    if (!table.has(key)) {
      table.set(key, {
        teamId: teamId || null,
        teamName: name,
        played: 0,
        win: 0,
        draw: 0,
        loss: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0
      });
    }
    return table.get(key);
  };

  matches.forEach((match) => {
    if (!hasScoreResult(match)) return;
    const homeName = match.home_team_name || "HOME";
    const awayName = match.away_team_name || "AWAY";
    const homeScore = parseScore(match.result?.home_score);
    const awayScore = parseScore(match.result?.away_score);
    if (homeScore === null || awayScore === null) return;

    const home = ensureRow(match.home_team_id, homeName);
    const away = ensureRow(match.away_team_id, awayName);

    home.played += 1;
    away.played += 1;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.win += 1;
      away.loss += 1;
      home.points += 3;
    } else if (homeScore < awayScore) {
      away.win += 1;
      home.loss += 1;
      away.points += 3;
    } else {
      home.draw += 1;
      away.draw += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  const rows = Array.from(table.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aDiff = a.goalsFor - a.goalsAgainst;
    const bDiff = b.goalsFor - b.goalsAgainst;
    if (bDiff !== aDiff) return bDiff - aDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName, "ja");
  });

  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    diff: row.goalsFor - row.goalsAgainst,
    isFocus: row.teamId === focusTeamId
  }));
}

export default function Results() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [entryTeamId, setEntryTeamId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("matches");
  const [sheetOffset, setSheetOffset] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const [maxSheetOffset, setMaxSheetOffset] = useState(200);
  const dragRef = useRef({ startY: 0, startOffset: 0 });
  const tabsRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.get(`/tournaments/${id}`), api.get(`/tournaments/${id}/matches`)])
      .then(([tournamentData, matchesData]) => {
        if (!active) return;
        setTournament(tournamentData?.tournament || null);
        setMatches(matchesData?.matches || []);
      })
      .catch(() => {
        if (!active) return;
        setError("大会結果の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user) {
      setEntryTeamId(null);
      return;
    }
    let active = true;
    api
      .get(`/tournaments/${id}/entries/me`)
      .then((data) => {
        if (!active) return;
        const teamId = data?.entry?.team_id || null;
        setEntryTeamId(teamId);
        if (typeof window !== "undefined" && teamId) {
          try {
            window.sessionStorage.setItem("active_team_id", String(teamId));
          } catch {
            // ignore storage errors
          }
        }
      })
      .catch(() => {
        if (!active) return;
        setEntryTeamId(null);
      });
    return () => {
      active = false;
    };
  }, [id, user]);

  const standings = useMemo(() => buildStandings(matches, entryTeamId), [matches, entryTeamId]);
  const focusStanding = useMemo(
    () => standings.find((row) => row.teamId === entryTeamId) || null,
    [standings, entryTeamId]
  );
  const focusTeamName = focusStanding?.teamName || "所属チーム未設定";
  const summary = useMemo(() => summarizeMatches(matches, entryTeamId), [matches, entryTeamId]);
  const matchCards = useMemo(
    () =>
      matches
        .filter((match) => hasScoreResult(match))
        .map((match, index) => ({
        id: match.id || `${index}-${match.kickoff_at || ""}`,
        label: formatKickoffDateTime(match.kickoff_at, index),
        homeName: match.home_team_name || "HOME",
        awayName: match.away_team_name || "AWAY",
        homeScore: Number(match.result?.home_score),
        awayScore: Number(match.result?.away_score),
        containsFocus: match.home_team_id === entryTeamId || match.away_team_id === entryTeamId
      })),
    [matches, entryTeamId]
  );

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

  if (loading) return <LoadingScreen />;
  if (error) return <section>{error}</section>;
  if (!tournament) return <section>大会が見つかりません。</section>;

  const totalGames = summary.wins + summary.losses + summary.draws;
  const winRate = totalGames > 0 ? Math.round((summary.wins / totalGames) * 100) : 0;
  const diff = summary.goalsFor - summary.goalsAgainst;
  const totalGoals = summary.goalsFor + summary.goalsAgainst;
  const goalsForPercent = totalGoals > 0 ? (summary.goalsFor / totalGoals) * 100 : 50;
  const goalsAgainstPercent = 100 - goalsForPercent;
  const winBar = totalGames > 0 ? (summary.wins / totalGames) * 100 : 0;
  const lossBar = totalGames > 0 ? (summary.losses / totalGames) * 100 : 0;
  const drawBar = 100 - winBar - lossBar;
  const othersMatches = matchCards.filter((match) => !match.containsFocus);

  function startSheetDrag(event) {
    dragRef.current = { startY: event.clientY, startOffset: sheetOffset };
    setIsDraggingSheet(true);
  }

  return (
    <div
      className={`pastres-root ${isDraggingSheet ? "dragging" : ""} ${sheetOffset > maxSheetOffset * 0.5 ? "expanded" : ""}`}
      style={{ "--sheet-offset": `${sheetOffset}px` }}
    >
      <div className="pastres-hero">
        <img src={tournament.image_url || COVER_IMAGE} alt="Tournament Cover" />
        <div className="pastres-hero-overlay" />
        <div className="pastres-page-label">大会結果詳細</div>
        <button type="button" className="pastres-back" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="pastres-hero-copy">
          <span className="pastres-status">大会終了</span>
          <h1>{tournament.name}</h1>
          <p>{formatHeaderDate(tournament.event_date)}</p>
          <div className="pastres-hero-venue">
            <span className="material-symbols-outlined">location_on</span>
            <span>{tournament.venue || "会場未設定"}</span>
          </div>
        </div>
      </div>

      <main className="pastres-main">
        <div className="pastres-handle-wrap">
          <button
            type="button"
            className="pastres-handle-btn"
            aria-label="シートを移動"
            onPointerDown={startSheetDrag}
            onClick={() => setSheetOffset((prev) => (prev > 0 ? 0 : maxSheetOffset))}
          >
            <span className="pastres-handle" />
          </button>
        </div>

        <section className="pastres-content">
          <div className="pastres-section-stack">
            <section className="pastres-summary-head">
              <h2>
                <span />
                最終結果
              </h2>
              <small>{focusTeamName}</small>
            </section>

              <section className="pastres-medal-block">
                <div className="pastres-medal-icon">
                  <span className="material-symbols-outlined">emoji_events</span>
                </div>
                <div className="pastres-medal-copy">
                  <strong>{focusStanding ? `${focusStanding.rank}位` : "-"}</strong>
                </div>
                <p>{focusStanding ? `${focusStanding.rank}位 / ${standings.length}チーム中` : "順位未確定"}</p>
              </section>

            <section className="pastres-stats-card">
              <div className="pastres-stats-top">
                <div className="pastres-rate-ring">
                  <svg viewBox="0 0 36 36">
                    <path className="pastres-circle-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path className="pastres-circle" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" strokeDasharray={`${winRate}, 100`} />
                  </svg>
                  <div className="pastres-rate-copy">
                    <strong>{winRate}%</strong>
                    <span>勝率</span>
                  </div>
                </div>

                <div className="pastres-record">
                  <div>
                    <h4>総合成績</h4>
                    <div className="pastres-record-line">
                      <strong>{summary.wins}</strong><span>勝</span>
                      <strong>{summary.losses}</strong><span>敗</span>
                      <strong>{summary.draws}</strong><span>分</span>
                    </div>
                  </div>
                  <div className="pastres-record-bar">
                    <div style={{ width: `${winBar}%` }} />
                    <div style={{ width: `${lossBar}%` }} />
                    <div style={{ width: `${drawBar}%` }} />
                  </div>
                </div>
              </div>

              <div className="pastres-stats-bottom">
                <div>
                  <p>得点 / Goals For</p>
                  <strong>{summary.goalsFor}</strong>
                </div>
                <div>
                  <span>{`DIFF ${diff >= 0 ? "+" : ""}${diff}`}</span>
                </div>
                <div>
                  <p>失点 / Goals Against</p>
                  <strong>{summary.goalsAgainst}</strong>
                </div>
              </div>
              <div className="pastres-gfga-bar">
                <div style={{ width: `${goalsForPercent}%` }} />
                <span />
                <div style={{ width: `${goalsAgainstPercent}%` }} />
              </div>
            </section>
          </div>
        </section>

        <section className="pastres-tabs-wrap" ref={tabsRef}>
          <div className="pastres-tabs">
            <button
              type="button"
              className={activeTab === "matches" ? "active" : ""}
              onClick={() => setActiveTab("matches")}
            >
              試合結果
            </button>
            <button
              type="button"
              className={activeTab === "table" ? "active" : ""}
              onClick={() => setActiveTab("table")}
            >
              順位表
            </button>
          </div>
        </section>

        <section className="pastres-content">
          {activeTab === "matches" ? (
            <div className="pastres-section-stack">
              <section className="pastres-block">
                <h3>
                  <span />
                  所属チーム試合結果
                </h3>
                <div className="pastres-match-list">
                  {summary.normalizedMatches.length === 0 ? (
                    <p className="pastres-empty">試合結果はまだありません。</p>
                  ) : (
                    summary.normalizedMatches.map((match) => (
                      <article key={match.id} className="pastres-match-card">
                        <div className="pastres-match-top">
                          <span>{match.kickoffLabel}</span>
                          <em className={match.resultLabel.toLowerCase()}>{match.resultLabel}</em>
                        </div>
                        <div className="pastres-score-row">
                          <b className={match.resultLabel === "LOSS" ? "muted" : ""}>{match.leftName}</b>
                          <div>
                            <strong className={match.resultLabel === "LOSS" ? "muted" : ""}>{match.leftScore}</strong>
                            <span>-</span>
                            <strong className={match.resultLabel === "WIN" ? "muted" : ""}>{match.rightScore}</strong>
                          </div>
                          <b className={match.resultLabel === "WIN" ? "muted" : ""}>{match.rightName}</b>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
              <section className="pastres-block">
                <h3>
                  <span />
                  他チームの結果
                </h3>
                <div className="pastres-match-list">
                  {othersMatches.length === 0 ? (
                    <p className="pastres-empty">他チームの結果はまだありません。</p>
                  ) : (
                    othersMatches.map((match) => (
                      <article key={match.id} className="pastres-match-card">
                        <div className="pastres-match-top">
                          <span>{match.label}</span>
                        </div>
                        <div className="pastres-score-row plain">
                          <b>{match.homeName}</b>
                          <div>
                            <strong>{match.homeScore}</strong>
                            <span>-</span>
                            <strong>{match.awayScore}</strong>
                          </div>
                          <b>{match.awayName}</b>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            </div>
          ) : null}

          {activeTab === "table" ? (
            <section className="pastres-league">
              <div className="pastres-matches-head">
                <h3>
                  <span />
                  リーグ順位表
                </h3>
                <small>※横にスクロールできます</small>
              </div>
              <div className="pastres-league-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>順位</th>
                      <th>チーム名</th>
                      <th>試合</th>
                      <th>勝</th>
                      <th>分</th>
                      <th>負</th>
                      <th>得失</th>
                      <th>勝点</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row) => (
                      <tr key={row.teamName} className={row.isFocus ? "focus" : ""}>
                        <td>{row.rank}</td>
                        <td>
                          <span>{row.teamName}</span>
                          {row.isFocus ? <em>MY TEAM</em> : null}
                        </td>
                        <td>{row.played}</td>
                        <td>{row.win}</td>
                        <td>{row.draw}</td>
                        <td>{row.loss}</td>
                        <td className={row.diff > 0 ? "plus" : row.diff < 0 ? "minus" : ""}>
                          {row.diff > 0 ? `+${row.diff}` : row.diff}
                        </td>
                        <td className="point">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}
        </section>
      </main>

      <nav className="pastres-nav">
        <div className="pastres-nav-row">
          <Link to="/app/home" className="pastres-nav-item">
            <span className="material-symbols-outlined">home</span>
            <span>ホーム</span>
          </Link>
          <Link to="/tournaments" className="pastres-nav-item">
            <span className="material-symbols-outlined">search</span>
            <span>さがす</span>
          </Link>
          <div className="pastres-nav-center">
            <button type="button" aria-label="ボール">
              <span className="material-symbols-outlined">sports_soccer</span>
            </button>
          </div>
          <Link to="/teams" className="pastres-nav-item">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/me" className="pastres-nav-item">
            <span className="material-symbols-outlined">person</span>
            <span>マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
