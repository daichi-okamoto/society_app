import { Link, useLocation } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AnimatedOutlet from "../components/AnimatedOutlet";
import FlashMessage from "../components/FlashMessage";

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
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
    const enableSse =
      import.meta.env.VITE_ENABLE_SSE === "true" ||
      (import.meta.env.PROD && import.meta.env.VITE_ENABLE_SSE !== "false");
    if (!enableSse) return;

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

  if (
    location.pathname === "/app/home" ||
    location.pathname === "/me" ||
    location.pathname === "/me/edit" ||
    location.pathname === "/help" ||
    location.pathname === "/payments" ||
    location.pathname === "/tournaments" ||
    location.pathname === "/notifications" ||
    location.pathname === "/teams" ||
    location.pathname === "/teams/new" ||
    location.pathname === "/policies" ||
    /^\/teams\/[^/]+\/members$/.test(location.pathname) ||
    /^\/teams\/[^/]+\/members\/manual-add$/.test(location.pathname) ||
    /^\/teams\/[^/]+\/members\/[^/]+\/edit$/.test(location.pathname) ||
    /^\/teams\/[^/]+\/edit$/.test(location.pathname) ||
    /^\/tournaments\/[^/]+\/entry$/.test(location.pathname) ||
    /^\/tournaments\/[^/]+\/entry\/confirm$/.test(location.pathname) ||
    /^\/tournaments\/[^/]+\/entry\/complete$/.test(location.pathname) ||
    /^\/tournaments\/[^/]+\/entry\/review$/.test(location.pathname) ||
    /^\/tournaments\/[^/]+\/entry\/review\/roster$/.test(location.pathname)
  ) {
    return (
      <>
        {banner && (
          <div className="notify-banner">
            <strong>{banner.title}</strong> {banner.body}
          </div>
        )}
        <FlashMessage />
        <div className="route-slide-host">
          <AnimatedOutlet />
        </div>
      </>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">Society App</div>
        <nav className="nav">
          <Link to="/app/home">ホーム</Link>
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
      <FlashMessage />
      <main className="app-main">
        <div className="route-slide-host">
          <AnimatedOutlet />
        </div>
      </main>
    </div>
  );
}
