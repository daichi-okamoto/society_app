import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminMatches() {
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    home_team_id: "",
    away_team_id: "",
    kickoff_at: "",
    field: ""
  });

  useEffect(() => {
    Promise.all([api.get("/tournaments"), api.get("/teams")])
      .then(([tRes, teamRes]) => {
        setTournaments(tRes?.tournaments || []);
        setTeams(teamRes?.teams || []);
        if (tRes?.tournaments?.[0]) setSelectedTournamentId(String(tRes.tournaments[0].id));
      })
      .catch(() => setError("初期データの取得に失敗しました"))
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

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/tournaments/${selectedTournamentId}/matches`, {
        tournament_id: Number(selectedTournamentId),
        home_team_id: Number(form.home_team_id),
        away_team_id: Number(form.away_team_id),
        kickoff_at: form.kickoff_at,
        field: form.field
      });
      setForm({ home_team_id: "", away_team_id: "", kickoff_at: "", field: "" });
      const data = await api.get(`/tournaments/${selectedTournamentId}/matches`);
      setMatches(data?.matches || []);
    } catch {
      setError("試合の作成に失敗しました");
    }
  };

  if (loading) return <section>読み込み中...</section>;

  return (
    <section>
      <h1>試合管理</h1>
      {error && <p>{error}</p>}

      <div>
        <label htmlFor="match-tournament">大会</label>
        <select
          id="match-tournament"
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

      <h2>試合一覧</h2>
      {matches.length === 0 ? (
        <p>試合がありません。</p>
      ) : (
        <ul>
          {matches.map((m) => (
            <li key={m.id}>
              {(m.home_team_name || m.home_team_id)} vs {(m.away_team_name || m.away_team_id)} /{" "}
              {m.kickoff_at} / {m.field}
            </li>
          ))}
        </ul>
      )}

      <h2>試合作成</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="home-team">ホーム</label>
          <select id="home-team" value={form.home_team_id} onChange={onChange("home_team_id")}>
            <option value="">選択</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="away-team">アウェイ</label>
          <select id="away-team" value={form.away_team_id} onChange={onChange("away_team_id")}>
            <option value="">選択</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="kickoff">開始時刻</label>
          <input id="kickoff" value={form.kickoff_at} onChange={onChange("kickoff_at")} />
        </div>
        <div>
          <label htmlFor="field">コート</label>
          <input id="field" value={form.field} onChange={onChange("field")} />
        </div>
        <button type="submit">作成</button>
      </form>
    </section>
  );
}
