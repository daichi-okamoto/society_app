import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [form, setForm] = useState({
    title: "",
    body: "",
    scheduled_at: "",
    target_type: "everyone",
    target_id: ""
  });

  const upcoming = notifications.filter((n) => !n.sent_at && n.scheduled_at);

  const fetchNotifications = () => {
    api
      .get("/notifications/admin")
      .then((data) => setNotifications(data?.notifications || []))
      .catch(() => setError("通知一覧の取得に失敗しました"));
  };

  useEffect(() => {
    fetchNotifications();
    api
      .get("/tournaments")
      .then((data) => setTournaments(data?.tournaments || []))
      .catch(() => {});
    api
      .get("/teams")
      .then((data) => setTeams(data?.teams || []))
      .catch(() => {});
  }, []);

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!form.title || !form.body || !form.scheduled_at) {
      setError("タイトル/本文/送信時間は必須です");
      return;
    }
    if (form.target_type !== "everyone" && !form.target_id) {
      setError("対象を選択してください");
      return;
    }
    try {
      await api.post("/notifications", {
        title: form.title,
        body: form.body,
        scheduled_at: form.scheduled_at,
        target_type: form.target_type,
        target_id: form.target_type === "everyone" ? null : form.target_id
      });
      setForm({ title: "", body: "", scheduled_at: "", target_type: "everyone", target_id: "" });
      fetchNotifications();
    } catch {
      setError("通知の作成に失敗しました");
    }
  };

  return (
    <section>
      <h1>通知管理</h1>
      {error && <p>{error}</p>}

      <h2>通知作成</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="n-title">タイトル</label>
          <input id="n-title" value={form.title} onChange={onChange("title")} />
        </div>
        <div>
          <label htmlFor="n-body">本文</label>
          <textarea id="n-body" value={form.body} onChange={onChange("body")} />
        </div>
        <div>
          <label htmlFor="n-scheduled">送信時間</label>
          <input id="n-scheduled" value={form.scheduled_at} onChange={onChange("scheduled_at")} />
        </div>
        <div>
          <label htmlFor="n-target-type">対象</label>
          <select id="n-target-type" value={form.target_type} onChange={onChange("target_type")}>
            <option value="everyone">全体</option>
            <option value="tournament">大会</option>
            <option value="team">チーム</option>
            <option value="user">ユーザー</option>
          </select>
        </div>
        {form.target_type === "tournament" && (
          <div>
            <label htmlFor="n-target-tournament">大会</label>
            <select
              id="n-target-tournament"
              value={form.target_id}
              onChange={onChange("target_id")}
            >
              <option value="">選択</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {form.target_type === "team" && (
          <div>
            <label htmlFor="n-target-team">チーム</label>
            <select id="n-target-team" value={form.target_id} onChange={onChange("target_id")}>
              <option value="">選択</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        )}
        {form.target_type === "user" && (
          <div>
            <label htmlFor="n-target-user">ユーザーID</label>
            <input id="n-target-user" value={form.target_id} onChange={onChange("target_id")} />
          </div>
        )}
        <button type="submit">送信</button>
      </form>

      <h2>送信予約</h2>
      {upcoming.length === 0 ? (
        <p>予約はありません。</p>
      ) : (
        <ul>
          {upcoming.map((n) => (
            <li key={n.id}>
              {n.title} / {n.scheduled_at}{" "}
              <button
                type="button"
                onClick={async () => {
                  try {
                    await api.del(`/notifications/${n.id}`);
                    fetchNotifications();
                  } catch {
                    setError("予約の取消に失敗しました");
                  }
                }}
              >
                取消
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>送信履歴</h2>
      {notifications.length === 0 ? (
        <p>通知がありません。</p>
      ) : (
        <ul>
          {notifications.map((n) => (
            <li key={n.id}>
              {n.title} / {n.sent_at || n.scheduled_at}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
