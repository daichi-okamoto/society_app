import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import AdminBottomNav from "../../components/admin/AdminBottomNav";

function formatDateText(value) {
  if (!value) return "-";
  const dt = new Date(value);
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  const h = String(dt.getHours()).padStart(2, "0");
  const min = String(dt.getMinutes()).padStart(2, "0");
  return `${y}/${m}/${d} ${h}:${min}`;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tab, setTab] = useState("sent");

  useEffect(() => {
    let active = true;
    setError(null);
    api
      .get("/notifications/admin")
      .then((data) => {
        if (!active) return;
        setNotifications(data?.notifications || []);
      })
      .catch(() => {
        if (!active) return;
        setError("通知一覧の取得に失敗しました");
      });
    api
      .get("/tournaments")
      .then((data) => {
        if (!active) return;
        setTournaments(data?.tournaments || []);
      })
      .catch(() => {});
    api
      .get("/teams")
      .then((data) => {
        if (!active) return;
        setTeams(data?.teams || []);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const tournamentMap = useMemo(() => {
    const map = new Map();
    tournaments.forEach((item) => map.set(String(item.id), item.name));
    return map;
  }, [tournaments]);

  const teamMap = useMemo(() => {
    const map = new Map();
    teams.forEach((item) => map.set(String(item.id), item.name));
    return map;
  }, [teams]);

  const toScopeText = (item) => {
    if (item.delivery_scope === "everyone") return "全ユーザー";
    if (item.delivery_scope === "tournament_teams") return tournamentMap.get(String(item.target_id)) || "大会参加チーム";
    if (item.delivery_scope === "specific_teams") return "特定のチーム";
    if (item.delivery_scope === "captains") return "各チーム代表者のみ";
    return "配信対象あり";
  };

  const sentItems = useMemo(() => notifications.filter((item) => !!item.sent_at), [notifications]);
  const draftItems = useMemo(() => notifications.filter((item) => !item.sent_at), [notifications]);
  const visibleItems = tab === "sent" ? sentItems : draftItems;

  return (
    <div className="adntf-root">
      <header className="adntf-header">
        <div className="adntf-header-row">
          <h1>通知一覧</h1>
          <div className="adntf-header-spacer" aria-hidden="true" />
        </div>
        <div className="adntf-tabs">
          <button type="button" className={tab === "sent" ? "active" : ""} onClick={() => setTab("sent")}>
            送信済み
          </button>
          <button type="button" className={tab === "draft" ? "active" : ""} onClick={() => setTab("draft")}>
            下書き
          </button>
        </div>
      </header>

      <main className="adntf-main">
        <Link to="/admin/notifications/new" className="adntf-create-btn">
          <span className="material-symbols-outlined">add</span>
          新規通知作成
        </Link>

        {error ? <p className="adntf-info is-error">{error}</p> : null}
        {!error && visibleItems.length === 0 ? (
          <p className="adntf-info">{tab === "sent" ? "送信済み通知はありません。" : "下書き通知はありません。"}</p>
        ) : null}

        <section className="adntf-list">
          {visibleItems.map((item) => {
            const isImportant = /重要/.test(item.title || "");
            const timestamp = formatDateText(item.sent_at || item.scheduled_at);
            return (
              <article key={item.id} className={`adntf-card ${isImportant ? "is-important" : ""}`}>
                <div className="adntf-card-top">
                  <div className="adntf-top-left">
                    {isImportant ? <span className="adntf-important">重要</span> : null}
                    <span className="adntf-date">{timestamp}</span>
                  </div>
                  <span className={`adntf-status ${item.sent_at ? "sent" : "draft"}`}>
                    <span className="material-symbols-outlined">{item.sent_at ? "check_circle" : "edit"}</span>
                    {item.sent_at ? "配信済" : "下書き"}
                  </span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
                <div className="adntf-scope">
                  <span className="material-symbols-outlined">
                    {item.target_type === "everyone" ? "groups" : "filter_list"}
                  </span>
                  <span>{toScopeText(item)}</span>
                </div>
              </article>
            );
          })}
        </section>
      </main>

      <AdminBottomNav />
    </div>
  );
}
