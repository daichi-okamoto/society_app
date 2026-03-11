import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import AnimatedOutlet from "../components/AnimatedOutlet";
import FlashMessage from "../components/FlashMessage";

export default function AppLayout() {
  const { user } = useAuth();
  const [banner, setBanner] = useState(null);
  const timerRef = useRef(null);

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
