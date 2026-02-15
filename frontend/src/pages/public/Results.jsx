import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";

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

function pickFocusTeamName(matches) {
  const counts = new Map();
  matches.forEach((match) => {
    const home = match.home_team_name || "HOME";
    const away = match.away_team_name || "AWAY";
    counts.set(home, (counts.get(home) || 0) + 1);
    counts.set(away, (counts.get(away) || 0) + 1);
  });
  let bestName = "自チーム";
  let bestCount = -1;
  counts.forEach((count, name) => {
    if (count > bestCount) {
      bestCount = count;
      bestName = name;
    }
  });
  return bestName;
}

function summarizeMatches(matches, focusTeamName) {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  const normalizedMatches = matches.map((match, index) => {
    const homeName = match.home_team_name || "HOME";
    const awayName = match.away_team_name || "AWAY";
    const homeScore = Number(match.result?.home_score ?? 0);
    const awayScore = Number(match.result?.away_score ?? 0);
    const isFocusHome = homeName === focusTeamName;
    const leftName = focusTeamName;
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
  });

  return { wins, losses, draws, goalsFor, goalsAgainst, normalizedMatches };
}

function buildStandings(matches, focusTeamName) {
  const table = new Map();

  const ensureRow = (name) => {
    if (!table.has(name)) {
      table.set(name, {
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
    return table.get(name);
  };

  matches.forEach((match) => {
    const homeName = match.home_team_name || "HOME";
    const awayName = match.away_team_name || "AWAY";
    const homeScore = Number(match.result?.home_score ?? 0);
    const awayScore = Number(match.result?.away_score ?? 0);

    const home = ensureRow(homeName);
    const away = ensureRow(awayName);

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
    isFocus: row.teamName === focusTeamName
  }));
}

function medalLabelByWinRate(winRate) {
  if (winRate >= 80) return { label: "優勝", short: "1st" };
  if (winRate >= 50) return { label: "準優勝", short: "2nd" };
  return { label: "ベスト4", short: "3rd" };
}

export default function Results() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [tournament, setTournament] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("matches");

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

  const focusTeamName = useMemo(() => pickFocusTeamName(matches), [matches]);
  const summary = useMemo(() => summarizeMatches(matches, focusTeamName), [matches, focusTeamName]);
  const standings = useMemo(() => buildStandings(matches, focusTeamName), [matches, focusTeamName]);

  if (loading) return <LoadingScreen />;
  if (error) return <section>{error}</section>;
  if (!tournament) return <section>大会が見つかりません。</section>;

  const totalGames = summary.wins + summary.losses + summary.draws;
  const winRate = totalGames > 0 ? Math.round((summary.wins / totalGames) * 100) : 0;
  const medal = medalLabelByWinRate(winRate);
  const diff = summary.goalsFor - summary.goalsAgainst;
  const totalGoals = summary.goalsFor + summary.goalsAgainst;
  const goalsForPercent = totalGoals > 0 ? (summary.goalsFor / totalGoals) * 100 : 50;
  const goalsAgainstPercent = 100 - goalsForPercent;
  const winBar = totalGames > 0 ? (summary.wins / totalGames) * 100 : 0;
  const lossBar = totalGames > 0 ? (summary.losses / totalGames) * 100 : 0;
  const drawBar = 100 - winBar - lossBar;

  return (
    <div className="pastres-root">
      <header className="pastres-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h1>大会結果詳細</h1>
      </header>

      <main className="pastres-main">
        <section className="pastres-overview">
          <div className="pastres-overview-title">
            <span>{formatHeaderDate(tournament.event_date)}</span>
            <h2>{tournament.name}</h2>
          </div>
          <div className="pastres-medal">
            <div className="pastres-medal-icon">
              <span className="material-symbols-outlined">emoji_events</span>
            </div>
            <div className="pastres-medal-rank">{medal.short}</div>
            <div className="pastres-medal-label">{medal.label}</div>
          </div>
        </section>

        <section className="pastres-stats-wrap">
          <div className="pastres-stats-card">
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
          </div>
        </section>

        <section className="pastres-tabbar">
          <div>
            <button
              type="button"
              className={`pastres-tab-btn ${activeTab === "matches" ? "active" : ""}`}
              onClick={() => setActiveTab("matches")}
            >
              試合結果
            </button>
            <button
              type="button"
              className={`pastres-tab-btn ${activeTab === "table" ? "active" : ""}`}
              onClick={() => setActiveTab("table")}
            >
              対戦表
            </button>
          </div>
        </section>

        {activeTab === "matches" ? (
          <section className="pastres-matches">
            <div className="pastres-matches-head">
              <h3>
                <span />
                試合結果一覧
              </h3>
            </div>
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
        ) : (
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
        )}
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
