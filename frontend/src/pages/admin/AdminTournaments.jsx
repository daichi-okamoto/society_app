import { useEffect, useState } from "react";
import { api } from "../../lib/api";

export default function AdminTournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState("");
  const [editForm, setEditForm] = useState(null);

  const [form, setForm] = useState({
    name: "",
    event_date: "",
    venue: "",
    match_half_minutes: 12,
    max_teams: 15,
    entry_fee_amount: "",
    entry_fee_currency: "JPY",
    cancel_deadline_date: ""
  });

  const fetchTournaments = () => {
    setLoading(true);
    setError(null);
    api
      .get("/tournaments")
      .then((data) => setTournaments(data?.tournaments || []))
      .catch(() => setError("大会一覧の取得に失敗しました"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const onEditChange = (key) => (e) => {
    setEditForm((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const loadDetail = async (id) => {
    setError(null);
    try {
      const data = await api.get(`/tournaments/${id}`);
      setEditForm(data?.tournament || null);
    } catch {
      setError("大会詳細の取得に失敗しました");
    }
  };

  const onSelectTournament = (e) => {
    const id = e.target.value;
    setSelectedId(id);
    if (id) loadDetail(id);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      await api.post("/tournaments", {
        ...form,
        match_half_minutes: Number(form.match_half_minutes),
        max_teams: Number(form.max_teams),
        entry_fee_amount: Number(form.entry_fee_amount)
      });
      setForm({
        name: "",
        event_date: "",
        venue: "",
        match_half_minutes: 12,
        max_teams: 15,
        entry_fee_amount: "",
        entry_fee_currency: "JPY",
        cancel_deadline_date: ""
      });
      fetchTournaments();
    } catch {
      setError("大会の作成に失敗しました");
    }
  };

  const onUpdate = async (e) => {
    e.preventDefault();
    if (!selectedId || !editForm) return;
    setError(null);
    try {
      await api.patch(`/tournaments/${selectedId}`, {
        ...editForm,
        match_half_minutes: Number(editForm.match_half_minutes),
        max_teams: Number(editForm.max_teams),
        entry_fee_amount: Number(editForm.entry_fee_amount)
      });
      fetchTournaments();
    } catch {
      setError("大会の更新に失敗しました");
    }
  };

  const onDelete = async (id) => {
    if (!window.confirm("本当に削除しますか？")) return;
    setError(null);
    try {
      await api.del(`/tournaments/${id}`);
      setTournaments((prev) => prev.filter((t) => t.id !== id));
      if (String(id) === selectedId) {
        setSelectedId("");
        setEditForm(null);
      }
      fetchTournaments();
    } catch {
      setError("大会の削除に失敗しました");
    }
  };

  return (
    <section>
      <h1>大会管理</h1>
      {loading && <p>読み込み中...</p>}
      {error && <p>{error}</p>}

      <h2>大会一覧</h2>
      {tournaments.length === 0 ? (
        <p>大会がありません。</p>
      ) : (
        <ul>
          {tournaments.map((t) => (
            <li key={t.id}>
              {t.name} / {t.event_date} / {t.venue}{" "}
              <button type="button" onClick={() => onDelete(t.id)}>
                削除
              </button>
            </li>
          ))}
        </ul>
      )}

      <h2>大会編集</h2>
      <div>
        <label htmlFor="t-edit-select">大会</label>
        <select id="t-edit-select" value={selectedId} onChange={onSelectTournament}>
          <option value="">選択してください</option>
          {tournaments.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      {editForm && (
        <form onSubmit={onUpdate}>
          <div>
            <label htmlFor="t-edit-name">大会名(編集)</label>
            <input id="t-edit-name" value={editForm.name || ""} onChange={onEditChange("name")} />
          </div>
          <div>
            <label htmlFor="t-edit-date">開催日(編集)</label>
            <input
              id="t-edit-date"
              value={editForm.event_date || ""}
              onChange={onEditChange("event_date")}
            />
          </div>
          <div>
            <label htmlFor="t-edit-venue">会場(編集)</label>
            <input id="t-edit-venue" value={editForm.venue || ""} onChange={onEditChange("venue")} />
          </div>
          <div>
            <label htmlFor="t-edit-half">試合時間(編集)</label>
            <input
              id="t-edit-half"
              value={editForm.match_half_minutes || ""}
              onChange={onEditChange("match_half_minutes")}
            />
          </div>
          <div>
            <label htmlFor="t-edit-max">最大チーム数(編集)</label>
            <input id="t-edit-max" value={editForm.max_teams || ""} onChange={onEditChange("max_teams")} />
          </div>
          <div>
            <label htmlFor="t-edit-fee">参加費(編集)</label>
            <input
              id="t-edit-fee"
              value={editForm.entry_fee_amount || ""}
              onChange={onEditChange("entry_fee_amount")}
            />
          </div>
          <div>
            <label htmlFor="t-edit-currency">通貨(編集)</label>
            <input
              id="t-edit-currency"
              value={editForm.entry_fee_currency || ""}
              onChange={onEditChange("entry_fee_currency")}
            />
          </div>
          <div>
            <label htmlFor="t-edit-cancel">キャンセル期限(編集)</label>
            <input
              id="t-edit-cancel"
              value={editForm.cancel_deadline_date || ""}
              onChange={onEditChange("cancel_deadline_date")}
            />
          </div>
          <button type="submit">更新</button>
        </form>
      )}

      <h2>大会作成</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="t-name">大会名</label>
          <input id="t-name" value={form.name} onChange={onChange("name")} />
        </div>
        <div>
          <label htmlFor="t-date">開催日</label>
          <input id="t-date" value={form.event_date} onChange={onChange("event_date")} />
        </div>
        <div>
          <label htmlFor="t-venue">会場</label>
          <input id="t-venue" value={form.venue} onChange={onChange("venue")} />
        </div>
        <div>
          <label htmlFor="t-half">試合時間(分ハーフ)</label>
          <input id="t-half" value={form.match_half_minutes} onChange={onChange("match_half_minutes")} />
        </div>
        <div>
          <label htmlFor="t-max">最大チーム数</label>
          <input id="t-max" value={form.max_teams} onChange={onChange("max_teams")} />
        </div>
        <div>
          <label htmlFor="t-fee">参加費</label>
          <input id="t-fee" value={form.entry_fee_amount} onChange={onChange("entry_fee_amount")} />
        </div>
        <div>
          <label htmlFor="t-currency">通貨</label>
          <input id="t-currency" value={form.entry_fee_currency} onChange={onChange("entry_fee_currency")} />
        </div>
        <div>
          <label htmlFor="t-cancel">キャンセル期限</label>
          <input
            id="t-cancel"
            value={form.cancel_deadline_date}
            onChange={onChange("cancel_deadline_date")}
          />
        </div>
        <button type="submit">作成</button>
      </form>
    </section>
  );
}
