import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ title: "", body: "", published_at: "" });

  const fetchAnnouncements = () => {
    setLoading(true);
    setError(null);
    api
      .get("/announcements")
      .then((data) => setAnnouncements(data?.announcements || []))
      .catch(() => setError("お知らせの取得に失敗しました"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const onChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/announcements", {
        title: form.title,
        body: form.body,
        published_at: form.published_at || undefined
      });
      setForm({ title: "", body: "", published_at: "" });
      fetchAnnouncements();
    } catch {
      setError("お知らせの作成に失敗しました");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("本当に削除しますか？")) return;
    setError(null);
    try {
      await api.del(`/announcements/${id}`);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch {
      setError("お知らせの削除に失敗しました");
    }
  };

  return (
    <section>
      <h1>お知らせ管理</h1>
      {loading && <p>読み込み中...</p>}
      {error && <p>{error}</p>}

      <h2>お知らせ一覧</h2>
      {announcements.length === 0 ? (
        <p>お知らせがありません。</p>
      ) : (
        <ul>
          {announcements.map((a) => (
            <li key={a.id}>
              {a.title} / {a.published_at}
              <button type="button" onClick={() => onDelete(a.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>お知らせ作成</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="ann-title">タイトル</label>
          <input id="ann-title" value={form.title} onChange={onChange("title")} />
        </div>
        <div>
          <label htmlFor="ann-body">本文</label>
          <textarea id="ann-body" value={form.body} onChange={onChange("body")} />
        </div>
        <div>
          <label htmlFor="ann-date">公開日時</label>
          <input id="ann-date" value={form.published_at} onChange={onChange("published_at")} />
        </div>
        <button type="submit">作成</button>
      </form>
    </section>
  );
}
