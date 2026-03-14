import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AnimatedOutlet from "../components/AnimatedOutlet";
import FlashMessage from "../components/FlashMessage";

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  useEffect(() => {
    if (!user) return;

    let active = true;
    api
      .get("/notifications")
      .then((data) => {
        if (!active) return;
        const unreadCount = Number(data?.unread_count || 0);
        const unreadList = data?.notifications || [];
        setHasUnreadNotifications(unreadCount > 0 || unreadList.length > 0);
      })
      .catch(() => {
        if (!active) return;
        setHasUnreadNotifications(false);
      });

    return () => {
      active = false;
    };
  }, [location.pathname, user]);

  useEffect(() => {
    if (!user) return;
    const enableSse =
      import.meta.env.VITE_ENABLE_SSE === "true" ||
      (import.meta.env.DEV && import.meta.env.VITE_ENABLE_SSE !== "false") ||
      (import.meta.env.PROD && import.meta.env.VITE_ENABLE_SSE !== "false");
    if (!enableSse) return;

    const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";
    const es = new EventSource(`${baseUrl}/notifications/stream`, { withCredentials: true });

    es.addEventListener("notification", (event) => {
      try {
        JSON.parse(event.data);
        setHasUnreadNotifications(true);
      } catch {
        // ignore parse errors
      }
    });

    return () => {
      es.close();
    };
  }, [user]);

  return (
    <>
      <FlashMessage />
      <Link to="/notifications" className="app-notify-link" aria-label="お知らせ">
        <span className="material-symbols-outlined app-notify-link__icon">notifications</span>
        {hasUnreadNotifications ? <span className="app-notify-link__dot" /> : null}
      </Link>
      <div className="route-slide-host">
        <AnimatedOutlet />
      </div>
    </>
  );
}
