import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";

function iconForNotification(notification) {
  const source = `${notification?.title || ""} ${notification?.body || ""}`;
  if (/招待|加入/.test(source)) return "person_add";
  if (/大会|エントリー/.test(source)) return "emoji_events";
  if (/運営|メンテ/.test(source)) return "campaign";
  return "sports_soccer";
}

function formatRelativeTime(notification) {
  const dateText = notification?.read_at || notification?.sent_at || notification?.created_at;
  if (!dateText) return "-";

  const date = new Date(dateText);
  if (Number.isNaN(date.getTime())) return "-";

  const diffMs = Date.now() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "1時間以内";
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffHours < 48) return "昨日";
  if (diffHours < 24 * 7) return `${Math.floor(diffHours / 24)}日前`;

  return date.toLocaleDateString("ja-JP");
}

export default function NotificationCenter() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markingId, setMarkingId] = useState(null);

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
    const target = notifications.find((n) => n.id === id);
    if (!target) return;
    setMarkingId(id);
    try {
      await api.post(`/notifications/${id}/read`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setHistory((prev) => [{ ...target, read_at: new Date().toISOString() }, ...prev]);
    } catch {
      setError("既読にできませんでした");
    } finally {
      setMarkingId(null);
    }
  };

  const rows = useMemo(() => {
    const unreadRows = notifications.map((n) => ({ ...n, _unread: true }));
    const readRows = history.map((n) => ({ ...n, _unread: false }));
    return [...unreadRows, ...readRows];
  }, [history, notifications]);

  if (loading) return <LoadingScreen />;
  if (error && rows.length === 0) return <section>{error}</section>;

  return (
    <div className="ntf-root">
      <header className="ntf-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1>お知らせ</h1>
      </header>

      <main className="ntf-main">
        <div className="ntf-list">
          {rows.length === 0 ? (
            <p className="ntf-empty">お知らせはありません。</p>
          ) : (
            rows.map((n) => (
              <button
                type="button"
                key={`${n._unread ? "u" : "r"}-${n.id}`}
                className={`ntf-row ${n._unread ? "unread" : ""}`}
                onClick={() => (n._unread ? markRead(n.id) : undefined)}
                disabled={markingId === n.id}
              >
                {n._unread ? <span className="ntf-dot" /> : null}
                <div className="ntf-icon-wrap">
                  <span className={`material-symbols-outlined ${n._unread ? "hot" : ""}`}>
                    {iconForNotification(n)}
                  </span>
                </div>
                <div className="ntf-text">
                  <div className="ntf-title-row">
                    <h3>{n.title}</h3>
                    <span>{formatRelativeTime(n)}</span>
                  </div>
                  <p>{n.body}</p>
                </div>
              </button>
            ))
          )}
        </div>

        {error ? <p className="ntf-error">{error}</p> : null}

        <div className="ntf-load-more">
          <button type="button" onClick={fetchNotifications}>
            過去のお知らせを読み込む
          </button>
        </div>
      </main>

      <nav className="ntf-nav">
        <div className="ntf-nav-row">
          <Link to="/app/home" className="ntf-nav-item">
            <span className="material-symbols-outlined">home</span>
            <span>ホーム</span>
          </Link>
          <Link to="/tournaments" className="ntf-nav-item">
            <span className="material-symbols-outlined">search</span>
            <span>さがす</span>
          </Link>
          <div className="ntf-nav-center">
            <button type="button">
              <span className="material-symbols-outlined">sports_soccer</span>
            </button>
          </div>
          <Link to="/teams" className="ntf-nav-item">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/me" className="ntf-nav-item">
            <span className="material-symbols-outlined">person</span>
            <span>マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
