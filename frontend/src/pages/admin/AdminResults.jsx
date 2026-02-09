import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminResults() {
  const [tournaments, setTournaments] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [matches, setMatches] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get("/tournaments")
      .then((data) => {
        setTournaments(data?.tournaments || []);
        if (data?.tournaments?.[0]) setSelectedTournamentId(String(data.tournaments[0].id));
      })
      .catch(() => setError("大会一覧の取得に失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTournamentId) return;
    setError(null);
    api
      .get(`/tournaments/${selectedTournamentId}/matches`)
      .then((data) => setMatches(data?.matches || []))
      .catch(() => setError("試合一覧の取得に失敗しました"));
  }, [selectedTournamentId]);

  const onScoreChange = (matchId, key) => (e) => {
    setScores((prev) => ({
      ...prev,
      [matchId]: { ...(prev[matchId] || {}), [key]: e.target.value }
    }));
  };

  const onSubmit = async (matchId) => {
    setError(null);
    const score = scores[matchId] || {};
    try {
      await api.post(`/matches/${matchId}/result`, {
        home_score: Number(score.home_score),
        away_score: Number(score.away_score)
      });
      const data = await api.get(`/tournaments/${selectedTournamentId}/matches`);
      setMatches(data?.matches || []);
    } catch {
      setError("結果の更新に失敗しました");
    }
  };

  if (loading) return <section>読み込み中...</section>;

  return (
    <section>
      <h1>結果管理</h1>
      {error && <p>{error}</p>}

      <div>
        <label htmlFor="result-tournament">大会</label>
        <select
          id="result-tournament"
          value={selectedTournamentId}
          onChange={(e) => setSelectedTournamentId(e.target.value)}
        >
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      {matches.length === 0 ? (
        <p>試合がありません。</p>
      ) : (
        <ul>
          {matches.map((m) => (
            <li key={m.id}>
              {(m.home_team_name || m.home_team_id)} vs {(m.away_team_name || m.away_team_id)}{" "}
              {m.result ? `(${m.result.home_score}-${m.result.away_score})` : ""}
              {m.result_updated_by_name ? ` / 更新者: ${m.result_updated_by_name}` : ""}
              <div>
                <label htmlFor={`home-${m.id}`}>ホーム</label>
                <input
                  id={`home-${m.id}`}
                  value={scores[m.id]?.home_score || ""}
                  onChange={onScoreChange(m.id, "home_score")}
                />
                <label htmlFor={`away-${m.id}`}>アウェイ</label>
                <input
                  id={`away-${m.id}`}
                  value={scores[m.id]?.away_score || ""}
                  onChange={onScoreChange(m.id, "away_score")}
                />
                <button type="button" onClick={() => onSubmit(m.id)}>
                  結果更新
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
