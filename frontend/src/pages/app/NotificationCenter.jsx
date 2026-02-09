import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNotifications = () => {
    setLoading(true);
    setError(null);
    Promise.all([api.get("/notifications"), api.get("/notifications/history")])
      .then(([unreadRes, historyRes]) => {
        setNotifications(unreadRes?.notifications || []);
        setHistory(historyRes?.notifications || []);
      })
      .catch(() => setError("通知の取得に失敗しました"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markRead = async (id) => {
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setError("既読にできませんでした");
    }
  };

  return (
    <section>
      <h1>通知センター</h1>
      {loading && <p>読み込み中...</p>}
      {error && <p>{error}</p>}
      <h2>未読</h2>
      {notifications.length === 0 ? (
        <p>未読の通知はありません。</p>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li key={n.id}>
              <strong>{n.title}</strong> {n.body}{" "}
              <button type="button" onClick={() => markRead(n.id)}>
                既読
              </button>
            </li>
          ))}
        </ul>
      )}
      <h2>既読</h2>
      {history.length === 0 ? (
        <p>既読の通知はありません。</p>
      ) : (
        <ul>
          {history.map((n) => (
            <li key={n.id}>
              <strong>{n.title}</strong> {n.body} / {n.read_at}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
