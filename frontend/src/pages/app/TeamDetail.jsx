import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";

export default function TeamDetail() {
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get(`/teams/${id}`)
      .then((data) => {
        if (!active) return;
        setTeam(data?.team || null);
      })
      .catch(() => {
        if (!active) return;
        setError("チーム詳細の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <LoadingScreen />;
  if (error) return <section>{error}</section>;
  if (!team) return <section>チームが見つかりません。</section>;

  return (
    <section>
      <h1>{team.name}</h1>
      <p>参加コード: {team.join_code}</p>
      <h2>メンバー</h2>
      <ul>
        {(team.members || []).map((m) => (
          <li key={m.user_id}>
            {m.name} ({m.role})
          </li>
        ))}
      </ul>
    </section>
  );
}
