import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

function formatKickoff(dateString) {
  if (!dateString) return "--:--";
  const dt = new Date(dateString);
  return dt.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false
  });
}

function formatDoneDate(dateString) {
  if (!dateString) return "";
  const dt = new Date(dateString);
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  const hh = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd} ${hh}:${min}`;
}

function pickMyTeam(matches, entryTeamId) {
  const byId = new Map();
  const byName = new Map();

  matches.forEach((match) => {
    if (match.home_team_id) {
      byId.set(match.home_team_id, {
        id: match.home_team_id,
        name: match.home_team_name || "My Team",
        count: (byId.get(match.home_team_id)?.count || 0) + 1
      });
    }
    if (match.away_team_id) {
      byId.set(match.away_team_id, {
        id: match.away_team_id,
        name: match.away_team_name || "My Team",
        count: (byId.get(match.away_team_id)?.count || 0) + 1
      });
    }

    if (match.home_team_name) {
      byName.set(match.home_team_name, (byName.get(match.home_team_name) || 0) + 1);
    }
    if (match.away_team_name) {
      byName.set(match.away_team_name, (byName.get(match.away_team_name) || 0) + 1);
    }
  });

  if (entryTeamId && byId.has(entryTeamId)) {
    const team = byId.get(entryTeamId);
    return { id: team.id, name: team.name };
  }

  const idTeams = [...byId.values()].sort((a, b) => b.count - a.count);
  if (idTeams.length > 0) {
    return { id: idTeams[0].id, name: idTeams[0].name };
  }

  const nameTeams = [...byName.entries()].sort((a, b) => b[1] - a[1]);
  if (nameTeams.length > 0) {
    return { id: null, name: nameTeams[0][0] };
  }

  return { id: null, name: "My Team" };
}

function computeSummary(matches, myTeam) {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let diff = 0;

  matches.forEach((match) => {
    if (!match.result) return;

    const isHome = myTeam.id
      ? match.home_team_id === myTeam.id
      : match.home_team_name === myTeam.name;

    const myScore = Number(isHome ? match.result.home_score : match.result.away_score);
    const oppScore = Number(isHome ? match.result.away_score : match.result.home_score);

    diff += myScore - oppScore;
    if (myScore > oppScore) wins += 1;
    else if (myScore < oppScore) losses += 1;
    else draws += 1;
  });

  return { wins, losses, draws, diff };
}

function buildStandings(matches) {
  const table = new Map();

  function ensureTeam(id, name) {
    const key = `${id || "none"}:${name || "unknown"}`;
    if (!table.has(key)) {
      table.set(key, {
        key,
        teamId: id || null,
        teamName: name || "未定",
        played: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        diff: 0,
        points: 0
      });
    }
    return table.get(key);
  }

  matches.forEach((match) => {
    const home = ensureTeam(match.home_team_id, match.home_team_name);
    const away = ensureTeam(match.away_team_id, match.away_team_name);

    if (!match.result) return;

    const homeScore = Number(match.result.home_score || 0);
    const awayScore = Number(match.result.away_score || 0);

    home.played += 1;
    away.played += 1;

    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (homeScore < awayScore) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += 1;
      away.points += 1;
    }
  });

  const rows = [...table.values()].map((row) => ({
    ...row,
    diff: row.goalsFor - row.goalsAgainst
  }));

  rows.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.diff !== a.diff) return b.diff - a.diff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.teamName.localeCompare(b.teamName, "ja");
  });

  return rows.map((row, index) => ({ ...row, rank: index + 1 }));
}

const TEAM_DESCRIPTION_MAP = {
  "FC 渋谷ユナイテッド": "渋谷区を中心に活動する地域密着型クラブ",
  "恵比寿スターズ": "恵比寿ガーデンプレイス近隣の社会人チーム",
  "世田谷レッズ": "創立10周年の歴史ある7人制サッカーチーム",
  "代々木サンダース": "代々木公園フットサルコートがホームグラウンド",
  "新宿ジャイアンツ": "新宿エリアの精鋭が集結した強豪チーム",
  "目黒グリフォンズ": "パスサッカーを主体とするテクニカルな集団"
};

const TEAM_DEMO_ORDER = [
  "FC 渋谷ユナイテッド",
  "恵比寿スターズ",
  "世田谷レッズ",
  "代々木サンダース",
  "新宿ジャイアンツ",
  "目黒グリフォンズ"
];

export default function TournamentDetailLive({ tournament, entryTeamId }) {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [tab, setTab] = useState("matches");
  const [showAllTeams, setShowAllTeams] = useState(false);

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

  const myTeam = useMemo(() => pickMyTeam(matches, entryTeamId), [matches, entryTeamId]);
  const standings = useMemo(() => buildStandings(matches), [matches]);
  const summary = useMemo(() => computeSummary(matches, myTeam), [matches, myTeam]);
  const teamsForView = useMemo(() => {
    const teams = new Map();

    matches.forEach((match) => {
      if (match.home_team_name) {
        teams.set(match.home_team_name, {
          name: match.home_team_name,
          description: TEAM_DESCRIPTION_MAP[match.home_team_name] || "大会参加チーム",
          isMyTeam: myTeam.name === match.home_team_name
        });
      }
      if (match.away_team_name) {
        teams.set(match.away_team_name, {
          name: match.away_team_name,
          description: TEAM_DESCRIPTION_MAP[match.away_team_name] || "大会参加チーム",
          isMyTeam: myTeam.name === match.away_team_name
        });
      }
    });

    TEAM_DEMO_ORDER.forEach((name) => {
      if (!teams.has(name)) {
        teams.set(name, {
          name,
          description: TEAM_DESCRIPTION_MAP[name] || "大会参加チーム",
          isMyTeam: myTeam.name === name
        });
      }
    });

    return [...teams.values()].sort((a, b) => a.name.localeCompare(b.name, "ja"));
  }, [matches, myTeam.name]);

  const myStanding = standings.find((row) =>
    myTeam.id ? row.teamId === myTeam.id : row.teamName === myTeam.name
  );

  const firstUnfinishedIndex = matches.findIndex((match) => match.status !== "finished");
  const teamCount = standings.length > 0 ? standings.length : 12;

  return (
    <div className="tdlv-root">
      <header className="tdlv-header">
        <button className="tdlv-back" type="button" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1>{tournament.name}</h1>
      </header>

      <main className="tdlv-main">
        <section className="tdlv-rank-section">
          <div className="tdlv-rank-card">
            <div className="tdlv-badge">開催中</div>
            <p className="tdlv-rank-caption">現在の順位</p>
            <div className="tdlv-rank-line">
              <span className="tdlv-rank-num">{myStanding?.rank || 2}</span>
              <span className="tdlv-rank-meta">位 / {Math.max(teamCount, 12)}チーム</span>
            </div>
            <div className="tdlv-mini-wrap">
              <div className="tdlv-mini-block">
                <span>勝敗</span>
                <b>
                  {summary.wins}勝 {summary.losses}敗 {summary.draws}分
                </b>
              </div>
              <div className="tdlv-mini-sep" />
              <div className="tdlv-mini-block">
                <span>得失点</span>
                <b>{summary.diff >= 0 ? `+${summary.diff}` : summary.diff}</b>
              </div>
            </div>
          </div>
        </section>

        <div className="tdlv-tabs-wrap">
          <div className="tdlv-tabs">
            <button type="button" className={tab === "matches" ? "active" : ""} onClick={() => setTab("matches")}>
              対戦表・結果
            </button>
            <button type="button" className={tab === "standings" ? "active" : ""} onClick={() => setTab("standings")}>
              全体順位表
            </button>
            <button type="button" className={tab === "teams" ? "active" : ""} onClick={() => setTab("teams")}>
              チーム情報
            </button>
            <button type="button" className={tab === "venue" ? "active" : ""} onClick={() => setTab("venue")}>
              会場情報
            </button>
          </div>
        </div>

        {tab === "matches" ? (
          <section className="tdlv-list-section">
            {matches.map((match, index) => {
              const tone =
                match.status === "finished"
                  ? "done"
                  : index === firstUnfinishedIndex
                    ? "next"
                    : "upcoming";

              const isHome = myTeam.id
                ? match.home_team_id === myTeam.id
                : match.home_team_name === myTeam.name;

              const myName = isHome ? match.home_team_name : match.away_team_name;
              const opponentName = isHome ? match.away_team_name : match.home_team_name;

              const myScore = match.result
                ? Number(isHome ? match.result.home_score : match.result.away_score)
                : null;
              const oppScore = match.result
                ? Number(isHome ? match.result.away_score : match.result.home_score)
                : null;

              let resultLabel = null;
              if (myScore !== null && oppScore !== null) {
                if (myScore > oppScore) resultLabel = "WIN";
                else if (myScore < oppScore) resultLabel = "LOSS";
                else resultLabel = "DRAW";
              }

              const heading =
                tone === "done"
                  ? `第${index + 1}節 (終了)`
                  : tone === "next"
                    ? `第${index + 1}節 (次戦)`
                    : `第${index + 1}節`;

              const rightLabel =
                tone === "done" ? formatDoneDate(match.kickoff_at) : `${formatKickoff(match.kickoff_at)} KICK OFF`;

              return (
                <div key={match.id || `${match.kickoff_at}-${index}`} className="tdlv-round">
                  <div className="tdlv-round-head">
                    <h2 className={`tdlv-round-title ${tone}`}>
                      <span className="tdlv-round-bar" />
                      {heading}
                    </h2>
                    <span className={`tdlv-round-time ${tone === "next" ? "next" : ""}`}>{rightLabel}</span>
                  </div>

                  <article className={`tdlv-match-card ${tone}`}>
                    <div className={`tdlv-match-row ${tone === "upcoming" ? "muted" : ""}`}>
                      <div className="tdlv-team-col">
                        <div className={`tdlv-team-caption ${tone === "next" ? "next" : ""}`}>My Team</div>
                        <div className={`tdlv-team-name ${tone !== "upcoming" ? "primary" : ""}`}>{myName || myTeam.name}</div>
                      </div>

                      <div className="tdlv-score-col">
                        {myScore === null || oppScore === null ? (
                          <div className="tdlv-vs">VS</div>
                        ) : (
                          <div className="tdlv-score-line">
                            <span>{myScore}</span>
                            <span className="dash">-</span>
                            <span className={tone === "done" ? "opp" : ""}>{oppScore}</span>
                          </div>
                        )}
                        {resultLabel ? <div className={`tdlv-result ${resultLabel.toLowerCase()}`}>{resultLabel}</div> : null}
                      </div>

                      <div className="tdlv-team-col right">
                        <div className="tdlv-team-caption">相手</div>
                        <div className={`tdlv-team-name ${tone === "done" ? "opp-muted" : ""}`}>{opponentName || "未定"}</div>
                      </div>
                    </div>

                    {tone === "upcoming" ? (
                      <div className="tdlv-footer muted">
                        <span>
                          <span className="material-symbols-outlined">location_on</span>
                          {match.field || "Aコート"}
                        </span>
                      </div>
                    ) : (
                      <div className={`tdlv-footer ${tone === "next" ? "next" : ""}`}>
                        <span>
                          <span className="material-symbols-outlined">location_on</span>
                          {tone === "next" && match.field ? `${match.field} (中央)` : match.field || "Aコート"}
                        </span>
                        {tone === "next" ? <span>準備中</span> : <button type="button">スタッツ詳細</button>}
                      </div>
                    )}
                  </article>
                </div>
              );
            })}

            {matches.length === 0 && (
              <div className="tdlv-empty">対戦データがまだありません。管理画面で試合を登録してください。</div>
            )}
          </section>
        ) : null}

        {tab === "standings" ? (
          <section className="tdlv-standings-section">
            <div className="tdlv-standings-card">
              <div className="tdlv-standings-scroll">
                <table className="tdlv-standings-table">
                  <thead>
                    <tr>
                      <th>順位</th>
                      <th>チーム名</th>
                      <th>試合</th>
                      <th>勝</th>
                      <th>分</th>
                      <th>負</th>
                      <th>得失</th>
                      <th>勝ち点</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row) => {
                      const isMine = myTeam.id ? row.teamId === myTeam.id : row.teamName === myTeam.name;
                      return (
                        <tr key={row.key} className={isMine ? "mine" : ""}>
                          <td className={`rank ${isMine ? "mine" : ""}`}>{row.rank}</td>
                          <td className={`name ${isMine ? "mine" : ""}`}>
                            {row.teamName}
                            {isMine ? (
                              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                                stars
                              </span>
                            ) : null}
                          </td>
                          <td>{row.played}</td>
                          <td>{row.wins}</td>
                          <td>{row.draws}</td>
                          <td>{row.losses}</td>
                          <td className={row.diff > 0 ? "diff-pos" : row.diff < 0 ? "diff-neg" : "diff-zero"}>
                            {row.diff > 0 ? `+${row.diff}` : row.diff}
                          </td>
                          <td className={`points ${isMine ? "mine" : ""}`}>{row.points}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="tdlv-standings-note">
              ※ 同勝ち点の場合、得失点差、総得点、直接対決の結果の順で順位を決定します。
            </p>
          </section>
        ) : null}

        {tab === "teams" ? (
          <section className="tdlv-teams-section">
            <div className="tdlv-teams-head">
              <h2>参加チーム一覧 ({Math.max(teamsForView.length, 12)})</h2>
              <span>五十音順</span>
            </div>

            <div className="tdlv-teams-list">
              {(showAllTeams ? teamsForView : teamsForView.slice(0, 6)).map((team) => (
                <button key={team.name} type="button" className={`tdlv-team-card ${team.isMyTeam ? "mine" : ""}`}>
                  <div className={`tdlv-team-icon ${team.isMyTeam ? "mine" : ""}`}>
                    <span className={`material-symbols-outlined ${team.isMyTeam ? "mine" : ""}`}>shield</span>
                  </div>
                  <div className="tdlv-team-copy">
                    <div className="tdlv-team-title-row">
                      <h3 className={team.isMyTeam ? "mine" : ""}>{team.name}</h3>
                      {team.isMyTeam ? <span className="my-chip">MY</span> : null}
                    </div>
                    <p className={team.isMyTeam ? "mine" : ""}>{team.description}</p>
                  </div>
                  <span className={`material-symbols-outlined tdlv-team-chevron ${team.isMyTeam ? "mine" : ""}`}>
                    chevron_right
                  </span>
                </button>
              ))}
            </div>

            {teamsForView.length > 6 ? (
              <div className="tdlv-teams-more-wrap">
                <button type="button" className="tdlv-teams-more" onClick={() => setShowAllTeams((v) => !v)}>
                  {showAllTeams ? "表示を閉じる" : "すべてのチームを表示"}
                  <span className="material-symbols-outlined">{showAllTeams ? "expand_less" : "expand_more"}</span>
                </button>
              </div>
            ) : null}
          </section>
        ) : null}

        {tab === "venue" ? (
          <>
            <div className="tdlv-venue-map-hero">
              <div className="tdlv-venue-map-grid" />
              <div className="tdlv-venue-map-center">
                <span className="material-symbols-outlined pin">location_on</span>
                <div className="tdlv-venue-map-label">
                  <p>{tournament.venue || "代々木公園フットサルコート"}</p>
                </div>
              </div>
            </div>

            <section className="tdlv-venue-section">
              <div className="tdlv-venue-block">
                <div className="tdlv-venue-head">
                  <span className="material-symbols-outlined">stadium</span>
                  <h2>会場詳細</h2>
                </div>

                <div className="tdlv-venue-details">
                  <div>
                    <p className="label">会場名</p>
                    <p className="value">{tournament.venue || "代々木公園フットサルコート"}</p>
                  </div>

                  <div>
                    <p className="label">住所</p>
                    <div className="tdlv-venue-address-row">
                      <p className="value">東京都渋谷区代々木神園町2-1</p>
                      <button type="button" className="map-btn">
                        <span className="material-symbols-outlined">map</span>
                        Google Mapで開く
                      </button>
                    </div>
                  </div>

                  <div>
                    <p className="label">アクセス</p>
                    <p className="value">
                      JR山手線「原宿」駅下車 徒歩3分
                      <br />
                      東京メトロ千代田線「代々木公園」駅下車 徒歩3分
                    </p>
                  </div>

                  <div>
                    <p className="label">設備</p>
                    <div className="tdlv-facilities">
                      <div className="item">
                        <div className="icon">
                          <span className="material-symbols-outlined">local_parking</span>
                        </div>
                        <span>駐車場</span>
                      </div>
                      <div className="item">
                        <div className="icon">
                          <span className="material-symbols-outlined">shower</span>
                        </div>
                        <span>シャワー</span>
                      </div>
                      <div className="item">
                        <div className="icon">
                          <span className="material-symbols-outlined">checkroom</span>
                        </div>
                        <span>更衣室</span>
                      </div>
                      <div className="item">
                        <div className="icon">
                          <span className="material-symbols-outlined">local_convenience_store</span>
                        </div>
                        <span>自販機</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="tdlv-venue-court-wrap">
                <div className="tdlv-venue-head">
                  <span className="material-symbols-outlined">map</span>
                  <h2>コート配置図</h2>
                </div>

                <div className="tdlv-court-box">
                  <div className="tdlv-court">
                    <div className="inner" />
                    <div className="midline" />
                    <div className="circle" />
                    <div className="a">
                      <div className="badge">A</div>
                      <span>Aコート</span>
                    </div>
                    <div className="b">
                      <div className="badge">B</div>
                      <span>Bコート</span>
                    </div>
                    <div className="c">
                      <div className="badge">C</div>
                      <span>Cコート</span>
                    </div>
                    <div className="entry">入口</div>
                  </div>
                </div>
              </div>
            </section>
          </>
        ) : null}
      </main>

      <nav className="tdlv-nav">
        <div className="tdlv-nav-row">
          <Link to="/app/home" className="active">
            <span className="material-symbols-outlined">home</span>
            <span>ホーム</span>
          </Link>
          <Link to="/tournaments">
            <span className="material-symbols-outlined">search</span>
            <span>さがす</span>
          </Link>
          <div className="tdlv-nav-center">
            <button type="button" aria-label="フットサル">
              <span className="material-symbols-outlined">sports_soccer</span>
            </button>
          </div>
          <Link to="/teams">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/me">
            <span className="material-symbols-outlined">person</span>
            <span>マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
