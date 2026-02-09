import { Link, Outlet } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";

export default function AppLayout() {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [banner, setBanner] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api
      .get("/notifications")
      .then((data) => setUnreadCount(data?.unread_count || 0))
      .catch(() => {});
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const es = new EventSource(`${baseUrl}/notifications/stream`, { withCredentials: true });

    es.addEventListener("notification", (event) => {
      try {
        const payload = JSON.parse(event.data);
        setUnreadCount((c) => c + 1);
        setBanner(payload);

        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
          setBanner(null);
          api.post(`/notifications/${payload.id}/read`).catch(() => {});
        }, 10000);
      } catch {
        // ignore parse errors
      }
    });

    return () => {
      es.close();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">Society App</div>
        <nav className="nav">
          <Link to="/tournaments">大会</Link>
          <Link to="/teams">チーム</Link>
          <Link to="/me">マイページ</Link>
          <Link to="/notifications">通知</Link>
          <span className="nav-badge">
            通知 {unreadCount > 0 ? <strong>({unreadCount})</strong> : null}
          </span>
        </nav>
      </header>
      {banner && (
        <div className="notify-banner">
          <strong>{banner.title}</strong> {banner.body}
        </div>
      )}
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
