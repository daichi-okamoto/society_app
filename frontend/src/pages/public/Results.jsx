import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";

export default function Results() {
  const { id } = useParams();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get(`/tournaments/${id}/matches`)
      .then((data) => {
        if (!active) return;
        setMatches(data?.matches || []);
      })
      .catch(() => {
        if (!active) return;
        setError("試合結果の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  if (loading) return <section>読み込み中...</section>;
  if (error) return <section>{error}</section>;

  return (
    <section>
      <h1>試合結果/順位表</h1>
      {matches.length === 0 ? (
        <p>試合結果はまだありません。</p>
      ) : (
        <ul>
          {matches.map((m) => (
            <li key={m.id}>
              {(m.home_team_name || m.home_team_id)} vs {(m.away_team_name || m.away_team_id)}{" "}
              {m.result ? `${m.result.home_score}-${m.result.away_score}` : "試合前"}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
