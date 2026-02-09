import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get("/teams")
      .then((data) => {
        if (!active) return;
        setTeams(data?.teams || []);
      })
      .catch(() => {
        if (!active) return;
        setError("チーム一覧の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading) return <section>読み込み中...</section>;
  if (error) return <section>{error}</section>;

  return (
    <section>
      <h1>チーム一覧</h1>
      {teams.length === 0 ? (
        <p>チームがありません。</p>
      ) : (
        <ul>
          {teams.map((t) => (
            <li key={t.id}>
              {t.name} / 代表: {t.captain_name}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
