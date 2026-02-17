import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

const venueOptions = [
  { value: "", label: "会場を選択してください" },
  { value: "代々木フットサルパーク", label: "代々木フットサルパーク" },
  { value: "MIFA Football Park 豊洲", label: "MIFA Football Park 豊洲" },
  { value: "多摩川河川敷グラウンド", label: "多摩川河川敷グラウンド" },
];

const ruleOptions = [
  "スパイク禁止",
  "スライディング禁止",
  "雨天決行（荒天中止）",
  "審判1名制",
  "女性ゴール2点",
];

function getLevelLabel(stars) {
  if (stars <= 2) return "ビギナー（初心者中心）";
  if (stars === 3) return "エンジョイ（楽しむ重視）";
  if (stars === 4) return "スタンダード（経験者歓迎）";
  return "コンペティティブ（競技志向）";
}

export default function AdminTournamentCreate() {
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    event_date: "",
    start_time: "",
    end_time: "",
    venue: "",
    max_teams: "16",
    entry_fee_amount: "15000",
    description: "",
    other_rules: "",
    selectedRules: [],
  });
  const [groups, setGroups] = useState([
    { id: 1, name: "Aグループ", stars: 2 },
    { id: 2, name: "Bグループ", stars: 3 },
  ]);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      form.event_date &&
      form.start_time &&
      form.end_time &&
      form.venue &&
      Number(form.max_teams) > 0 &&
      Number(form.entry_fee_amount) >= 0
    );
  }, [form]);

  const onFormChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const toggleRule = (rule) => {
    setForm((prev) => ({
      ...prev,
      selectedRules: prev.selectedRules.includes(rule)
        ? prev.selectedRules.filter((r) => r !== rule)
        : [...prev.selectedRules, rule],
    }));
  };

  const addGroup = () => {
    setGroups((prev) => [...prev, { id: Date.now(), name: `${String.fromCharCode(65 + prev.length)}グループ`, stars: 3 }]);
  };

  const removeGroup = (id) => {
    setGroups((prev) => prev.filter((g) => g.id !== id));
  };

  const setGroupName = (id, value) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, name: value } : g)));
  };

  const setGroupStars = (id, stars) => {
    setGroups((prev) => prev.map((g) => (g.id === id ? { ...g, stars } : g)));
  };

  const buildDescription = () => {
    const lines = [];
    if (form.description.trim()) lines.push(form.description.trim());
    lines.push(`開催時間: ${form.start_time}〜${form.end_time}`);
    if (groups.length > 0) {
      lines.push("グループ設定:");
      groups.forEach((g) => {
        lines.push(`- ${g.name || "未命名"}: ${"★".repeat(g.stars)} (${getLevelLabel(g.stars)})`);
      });
    }
    if (form.selectedRules.length > 0) {
      lines.push("主要ルール:");
      form.selectedRules.forEach((r) => lines.push(`- ${r}`));
    }
    if (form.other_rules.trim()) {
      lines.push("補足事項:");
      lines.push(form.other_rules.trim());
    }
    return lines.join("\n");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!canSubmit) {
      setError("必須項目を入力してください");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        event_date: form.event_date,
        venue: form.venue,
        match_half_minutes: 12,
        max_teams: Number(form.max_teams),
        entry_fee_amount: Number(form.entry_fee_amount),
        entry_fee_currency: "JPY",
        cancel_deadline_date: form.event_date,
        description: buildDescription(),
      };
      const res = await api.post("/tournaments", payload);
      const createdId = res?.tournament?.id;
      if (createdId) {
        navigate(`/admin/tournaments/${createdId}`, { replace: true });
      } else {
        navigate("/admin/tournaments", { replace: true });
      }
    } catch (e) {
      if (e?.status === 422) {
        setError("入力内容を確認してください");
      } else {
        setError("大会作成に失敗しました");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="adcreate-root">
      <header className="adcreate-header">
        <div className="adcreate-header-row">
          <div className="adcreate-left">
            <button type="button" className="adcreate-icon-btn" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
            <h1>大会新規作成</h1>
          </div>
          <button type="button" className="adcreate-icon-btn">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>
      </header>

      <main className="adcreate-main">
        <form onSubmit={onSubmit} className="adcreate-form">
          <section className="adcreate-section">
            <h2>
              <span className="material-symbols-outlined">edit_document</span>
              基本情報
            </h2>
            <div className="adcreate-card">
              <label>
                大会名 <span className="req">*</span>
                <input value={form.name} onChange={onFormChange("name")} placeholder="例: 第10回 東京セブンズカップ" />
              </label>
              <label>
                開催日 <span className="req">*</span>
                <input type="date" value={form.event_date} onChange={onFormChange("event_date")} />
              </label>
              <div className="adcreate-grid-2">
                <label>
                  開始時間 <span className="req">*</span>
                  <input type="time" value={form.start_time} onChange={onFormChange("start_time")} />
                </label>
                <label>
                  終了時間 <span className="req">*</span>
                  <input type="time" value={form.end_time} onChange={onFormChange("end_time")} />
                </label>
              </div>
              <label>
                会場 <span className="req">*</span>
                <select value={form.venue} onChange={onFormChange("venue")}>
                  {venueOptions.map((opt) => (
                    <option key={opt.value || "blank"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="adcreate-section">
            <h2>
              <span className="material-symbols-outlined">groups</span>
              募集・カテゴリー
            </h2>
            <div className="adcreate-card">
              <div className="adcreate-grid-2">
                <label>
                  募集チーム数
                  <div className="suffix-wrap">
                    <input type="number" min="1" value={form.max_teams} onChange={onFormChange("max_teams")} />
                    <span>枠</span>
                  </div>
                </label>
                <label>
                  参加費 (1チーム)
                  <div className="prefix-wrap">
                    <span>¥</span>
                    <input type="number" min="0" value={form.entry_fee_amount} onChange={onFormChange("entry_fee_amount")} />
                  </div>
                </label>
              </div>

              <div className="adcreate-group-head">
                <label>希望グループ設定</label>
                <button type="button" onClick={addGroup}>
                  <span className="material-symbols-outlined">add</span>グループを追加
                </button>
              </div>

              <div className="adcreate-groups">
                {groups.map((group) => (
                  <div key={group.id} className="adcreate-group-card">
                    <button type="button" className="close-btn" onClick={() => removeGroup(group.id)}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                    <label>
                      グループ名
                      <input value={group.name} onChange={(e) => setGroupName(group.id, e.target.value)} />
                    </label>
                    <div className="adcreate-stars">
                      <div className="adcreate-stars-head">
                        <label>強度・レベル</label>
                        <span>{getLevelLabel(group.stars)}</span>
                      </div>
                      <div className="star-row">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <button type="button" key={v} onClick={() => setGroupStars(group.id, v)}>
                            <span className={`material-symbols-outlined ${v <= group.stars ? "filled" : ""}`}>star</span>
                          </button>
                        ))}
                      </div>
                      <p>レベルを選択してください</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="adcreate-section">
            <h2>
              <span className="material-symbols-outlined">description</span>
              詳細・規約
            </h2>
            <div className="adcreate-card">
              <label>
                大会説明
                <textarea rows={4} value={form.description} onChange={onFormChange("description")} placeholder="大会の魅力や特徴を入力してください。" />
              </label>

              <div className="adcreate-rules">
                <label>主要ルール選択</label>
                <div className="adcreate-rule-list">
                  {ruleOptions.map((rule) => (
                    <label key={rule} className="rule-item">
                      <input
                        type="checkbox"
                        checked={form.selectedRules.includes(rule)}
                        onChange={() => toggleRule(rule)}
                      />
                      <span>{rule}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label>
                その他の規約・補足事項
                <textarea
                  rows={3}
                  value={form.other_rules}
                  onChange={onFormChange("other_rules")}
                  placeholder="上記以外の特別なルールや注意事項があれば入力してください。"
                />
              </label>
            </div>
          </section>

          {error ? <p className="adcreate-error">{error}</p> : null}

          <div className="adcreate-actions">
            <button type="submit" disabled={submitting || !canSubmit}>
              <span className="material-symbols-outlined">publish</span>
              {submitting ? "公開中..." : "大会を公開する"}
            </button>
            <p>
              公開後も編集は可能です。まずは下書き保存する場合は
              <Link to="/admin/tournaments">こちら</Link>
            </p>
          </div>
        </form>
      </main>

      <nav className="adcreate-nav">
        <div className="adcreate-nav-row">
          <Link to="/admin" className="adcreate-nav-item">
            <span className="material-symbols-outlined">dashboard</span>
            <span>ダッシュ</span>
          </Link>
          <Link to="/admin/tournaments/new" className="adcreate-nav-item active">
            <span className="material-symbols-outlined">add_circle</span>
            <span>大会</span>
          </Link>
          <Link to="/admin/teams" className="adcreate-nav-item">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/admin/payments" className="adcreate-nav-item">
            <span className="material-symbols-outlined">payments</span>
            <span>決済</span>
          </Link>
          <Link to="/admin/notifications" className="adcreate-nav-item">
            <span className="material-symbols-outlined">notifications</span>
            <span>通知</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
