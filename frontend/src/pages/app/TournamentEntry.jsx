import { useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";

export default function TournamentEntry() {
  const { id } = useParams();
  const [teamId, setTeamId] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);
    try {
      await api.post(`/tournaments/${id}/entries`, { team_id: teamId });
      setMessage("申込しました。運営の承認をお待ちください。");
    } catch {
      setError("申込に失敗しました");
    }
  };

  return (
    <section>
      <h1>大会参加申込</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="team-id">チームID</label>
          <input id="team-id" value={teamId} onChange={(e) => setTeamId(e.target.value)} />
        </div>
        {message && <p>{message}</p>}
        {error && <p>{error}</p>}
        <button type="submit">申込</button>
      </form>
    </section>
  );
}
