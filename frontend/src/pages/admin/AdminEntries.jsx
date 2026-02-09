import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

export default function AdminEntries() {
  const [entries, setEntries] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [filterTournamentId, setFilterTournamentId] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const tournamentMap = useMemo(() => {
    const map = new Map();
    tournaments.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [tournaments]);

  const teamMap = useMemo(() => {
    const map = new Map();
    teams.forEach((t) => map.set(t.id, t.name));
    return map;
  }, [teams]);

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      if (filterTournamentId && String(e.tournament_id) !== filterTournamentId) return false;
      if (filterStatus && e.status !== filterStatus) return false;
      return true;
    });
  }, [entries, filterTournamentId, filterStatus]);

  const fetchAll = () => {
    setLoading(true);
    setError(null);
    Promise.all([api.get("/tournament_entries"), api.get("/tournaments"), api.get("/teams")])
      .then(([entriesRes, tournamentsRes, teamsRes]) => {
        setEntries(entriesRes?.entries || []);
        setTournaments(tournamentsRes?.tournaments || []);
        setTeams(teamsRes?.teams || []);
      })
      .catch(() => setError("申込一覧の取得に失敗しました"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const onUpdateStatus = async (entryId, status) => {
    setError(null);
    try {
      await api.patch(`/tournament_entries/${entryId}`, { status });
      setEntries((prev) => prev.map((e) => (e.id === entryId ? { ...e, status } : e)));
    } catch {
      setError("申込の更新に失敗しました");
    }
  };

  return (
    <section>
      <h1>申込管理</h1>
      {loading && <p>読み込み中...</p>}
      {error && <p>{error}</p>}

      <div>
        <label htmlFor="entry-tournament">大会</label>
        <select
          id="entry-tournament"
          value={filterTournamentId}
          onChange={(e) => setFilterTournamentId(e.target.value)}
        >
          <option value="">全て</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
        <label htmlFor="entry-status">状態</label>
        <select
          id="entry-status"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="">全て</option>
          <option value="pending">pending</option>
          <option value="approved">approved</option>
          <option value="rejected">rejected</option>
          <option value="cancelled">cancelled</option>
        </select>
      </div>

      {filteredEntries.length === 0 ? (
        <p>申込がありません。</p>
      ) : (
        <ul>
          {filteredEntries.map((e) => (
            <li key={e.id}>
              大会: {tournamentMap.get(e.tournament_id) || e.tournament_id} / チーム:{" "}
              {teamMap.get(e.team_id) || e.team_id} / 状態: {e.status}
              {e.status === "pending" && (
                <>
                  {" "}
                  <button type="button" onClick={() => onUpdateStatus(e.id, "approved")}>
                    承認
                  </button>{" "}
                  <button type="button" onClick={() => onUpdateStatus(e.id, "rejected")}>
                    却下
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
