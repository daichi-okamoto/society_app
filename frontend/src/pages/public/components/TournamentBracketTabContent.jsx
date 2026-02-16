function formatKickoff(dateString) {
  if (!dateString) return "--:--";
  const dt = new Date(dateString);
  return dt.toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit", hour12: false });
}

function pickTeams(matches) {
  const names = [];
  matches.forEach((match) => {
    if (match.home_team_name && !names.includes(match.home_team_name)) names.push(match.home_team_name);
    if (match.away_team_name && !names.includes(match.away_team_name)) names.push(match.away_team_name);
  });
  return names.slice(0, 3);
}

function findPairMatch(matches, teamA, teamB) {
  return matches.find(
    (match) =>
      (match.home_team_name === teamA && match.away_team_name === teamB) ||
      (match.home_team_name === teamB && match.away_team_name === teamA)
  );
}

function buildPoints(matches, teams) {
  const points = Object.fromEntries(teams.map((name) => [name, 0]));
  matches.forEach((match) => {
    if (!match.result) return;
    if (!teams.includes(match.home_team_name) || !teams.includes(match.away_team_name)) return;
    const home = Number(match.result.home_score || 0);
    const away = Number(match.result.away_score || 0);
    if (home > away) {
      points[match.home_team_name] += 3;
    } else if (home < away) {
      points[match.away_team_name] += 3;
    } else {
      points[match.home_team_name] += 1;
      points[match.away_team_name] += 1;
    }
  });
  return points;
}

export default function TournamentBracketTabContent({ matches }) {
  if (!matches || matches.length === 0) {
    return (
      <section className="tdetail-entry-match-content">
        <div className="tdetail-entry-empty">対戦表はこれから作成します。公開までお待ちください。</div>
      </section>
    );
  }

  const sorted = matches
    .slice()
    .sort((a, b) => new Date(a.kickoff_at || 0).getTime() - new Date(b.kickoff_at || 0).getTime());
  const firstUnfinishedIndex = sorted.findIndex((match) => match.status !== "finished");
  const teams = pickTeams(sorted);
  const points = buildPoints(sorted, teams);

  return (
    <div className="tdetail-entry-match-content">
      {teams.length > 1 ? (
        <section className="tdetail-bracket-block">
          <h2 className="tdetail-bracket-title">
            <span className="w-1.5 h-4 bg-primary rounded-full" />
            星取表 (グループA)
          </h2>

          <div className="tdetail-bracket-table-wrap">
            <table className="tdetail-bracket-table">
              <thead>
                <tr>
                  <th className="left">チーム</th>
                  {teams.map((_, index) => (
                    <th key={`head-${index}`} className="center">{`T${index + 1}`}</th>
                  ))}
                  <th className="point">勝点</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((rowTeam, rowIndex) => (
                  <tr key={rowTeam}>
                    <td className="team-name">{`${rowIndex + 1}. ${rowTeam}`}</td>
                    {teams.map((colTeam) => {
                      if (rowTeam === colTeam) {
                        return (
                          <td key={`${rowTeam}-${colTeam}`} className="self">
                            ー
                          </td>
                        );
                      }
                      const pairMatch = findPairMatch(sorted, rowTeam, colTeam);
                      if (!pairMatch?.result) {
                        return (
                          <td key={`${rowTeam}-${colTeam}`} className="pending">
                            vs
                          </td>
                        );
                      }
                      const home = Number(pairMatch.result.home_score || 0);
                      const away = Number(pairMatch.result.away_score || 0);
                      const rowScore = pairMatch.home_team_name === rowTeam ? home : away;
                      const colScore = pairMatch.home_team_name === rowTeam ? away : home;
                      return <td key={`${rowTeam}-${colTeam}`}>{`${rowScore}-${colScore}`}</td>;
                    })}
                    <td className="point-value">{points[rowTeam] || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      <section className="tdetail-bracket-block">
        <h2 className="tdetail-bracket-title">
          <span className="w-1.5 h-4 bg-primary rounded-full" />
          試合日程
        </h2>

        <div className="tdetail-schedule-list">
          {sorted.map((match, index) => {
            const isLive = match.status !== "finished" && index === (firstUnfinishedIndex < 0 ? 0 : firstUnfinishedIndex);
            const statusLabel = match.status === "finished" ? "終了" : isLive ? "進行中" : "予定";
            return (
              <article key={match.id || `${match.kickoff_at}-${index}`} className="tdetail-schedule-card">
                <div className="tdetail-schedule-head">
                  <span className={`chip ${isLive ? "live" : ""}`}>{statusLabel}</span>
                  <div className="meta">
                    <span>
                      <span className="material-symbols-outlined">schedule</span>
                      {formatKickoff(match.kickoff_at)}
                    </span>
                    <span>
                      <span className="material-symbols-outlined">sports_soccer</span>
                      {match.field || "Aコート"}
                    </span>
                  </div>
                </div>

                <div className="tdetail-schedule-row">
                  <div className="team">{match.home_team_name || "未定"}</div>
                  <div className="vs">
                    {match.result ? (
                      <>
                        <strong>{match.result.home_score}</strong>
                        <i>-</i>
                        <strong>{match.result.away_score}</strong>
                      </>
                    ) : (
                      <span>vs</span>
                    )}
                  </div>
                  <div className="team">{match.away_team_name || "未定"}</div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}
