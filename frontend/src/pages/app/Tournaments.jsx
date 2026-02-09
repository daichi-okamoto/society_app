import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get("/tournaments")
      .then((data) => {
        if (!active) return;
        setTournaments(data?.tournaments || []);
      })
      .catch(() => {
        if (!active) return;
        setError("大会一覧の取得に失敗しました");
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
      <h1>大会一覧</h1>
      {tournaments.length === 0 ? (
        <p>現在公開中の大会はありません。</p>
      ) : (
        <ul>
          {tournaments.map((t) => (
            <li key={t.id}>
              {t.name} / {t.event_date} / {t.venue}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
