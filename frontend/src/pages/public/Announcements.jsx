import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get("/announcements")
      .then((data) => {
        if (!active) return;
        setAnnouncements(data?.announcements || []);
      })
      .catch(() => {
        if (!active) return;
        setError("お知らせの取得に失敗しました");
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
      <h1>お知らせ</h1>
      {announcements.length === 0 ? (
        <p>お知らせはありません。</p>
      ) : (
        <ul>
          {announcements.map((a) => (
            <li key={a.id}>
              {a.title} / {a.published_at}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
