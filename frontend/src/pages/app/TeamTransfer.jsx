import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";

export default function TeamTransfer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [selected, setSelected] = useState("");
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .get(`/teams/${id}`)
      .then((data) => {
        setTeam(data.team);
      })
      .catch(() => setError("チーム情報の取得に失敗しました"));
  }, [id]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post(`/teams/${id}/transfer_captain`, { new_captain_user_id: selected });
      navigate(`/teams/${id}`, {
        state: { flash: { type: "success", message: "代表を移譲しました。" } },
      });
    } catch {
      setError("移譲に失敗しました");
    }
  };

  if (!team && !error) return <LoadingScreen />;
  if (error) return <section>{error}</section>;

  return (
    <section>
      <h1>代表移譲</h1>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="captain-select">移譲先</label>
          <select id="captain-select" value={selected} onChange={(e) => setSelected(e.target.value)}>
            <option value="">選択してください</option>
            {(team?.members || []).map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.name} ({m.role})
              </option>
            ))}
          </select>
        </div>
        {error && <p>{error}</p>}
        <button type="submit" disabled={!selected}>移譲</button>
      </form>
    </section>
  );
}
