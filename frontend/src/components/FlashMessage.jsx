import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function normalizeFlash(raw) {
  if (!raw) return null;
  if (typeof raw === "string") {
    return { type: "success", message: raw };
  }
  if (typeof raw?.message !== "string" || !raw.message.trim()) return null;
  return {
    type: raw.type === "error" ? "error" : raw.type === "info" ? "info" : "success",
    message: raw.message.trim(),
  };
}

export default function FlashMessage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flash, setFlash] = useState(null);
  const [hiding, setHiding] = useState(false);
  const touchStartYRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const removeTimerRef = useRef(null);

  const parsed = useMemo(() => normalizeFlash(location.state?.flash), [location.state]);

  const dismiss = () => {
    if (!flash) return;
    setHiding(true);
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
    if (removeTimerRef.current) {
      window.clearTimeout(removeTimerRef.current);
    }
    removeTimerRef.current = window.setTimeout(() => {
      setFlash(null);
      setHiding(false);
      removeTimerRef.current = null;
    }, 260);
  };

  useEffect(() => {
    if (!parsed) return;
    setFlash(parsed);
    setHiding(false);

    const nextState = { ...(location.state || {}) };
    delete nextState.flash;
    navigate(`${location.pathname}${location.search}${location.hash}`, {
      replace: true,
      state: Object.keys(nextState).length ? nextState : null,
    });
  }, [parsed, navigate, location.pathname, location.search, location.hash, location.state]);

  useEffect(() => {
    if (!flash) return undefined;
    if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
    dismissTimerRef.current = window.setTimeout(() => dismiss(), 3000);

    return () => {
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = null;
      }
    };
  }, [flash]);

  useEffect(() => {
    return () => {
      if (dismissTimerRef.current) window.clearTimeout(dismissTimerRef.current);
      if (removeTimerRef.current) window.clearTimeout(removeTimerRef.current);
    };
  }, []);

  if (!flash) return null;

  return (
    <div
      className={`flash-message flash-${flash.type} ${hiding ? "is-hiding" : ""}`}
      role="status"
      aria-live="polite"
      onTouchStart={(e) => {
        touchStartYRef.current = e.changedTouches?.[0]?.clientY ?? null;
      }}
      onTouchEnd={(e) => {
        const startY = touchStartYRef.current;
        const endY = e.changedTouches?.[0]?.clientY ?? null;
        if (typeof startY === "number" && typeof endY === "number" && startY - endY > 36) {
          dismiss();
        }
        touchStartYRef.current = null;
      }}
    >
      <span className="flash-icon-wrap">
        <span className="material-symbols-outlined">
          {flash.type === "error" ? "error" : flash.type === "info" ? "info" : "check"}
        </span>
      </span>
      <p className="flash-message-text">{flash.message}</p>
    </div>
  );
}
