import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import AdminBottomNav from "../../components/admin/AdminBottomNav";

const DEFAULT_RULE_OPTIONS = ["オフサイドなし", "審判1名制"];
const DEFAULT_CAUTION_OPTIONS = ["雨天決行（荒天中止）", "スパイク禁止（トレシュー推奨）", "開始20分前までに受付"];

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
  });
  const [selectedRuleOptions, setSelectedRuleOptions] = useState([]);
  const [customRules, setCustomRules] = useState([]);
  const [customRuleInput, setCustomRuleInput] = useState("");
  const [selectedCautionOptions, setSelectedCautionOptions] = useState([]);
  const [customCautions, setCustomCautions] = useState([]);
  const [customCautionInput, setCustomCautionInput] = useState("");
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
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

  const combinedRules = useMemo(() => [...selectedRuleOptions, ...customRules], [selectedRuleOptions, customRules]);
  const combinedCautions = useMemo(() => [...selectedCautionOptions, ...customCautions], [selectedCautionOptions, customCautions]);

  useEffect(() => {
    if (!selectedImageFile) {
      setImagePreviewUrl("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(selectedImageFile);
    setImagePreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedImageFile]);

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
    if (groups.length > 0) {
      lines.push("グループ設定:");
      groups.forEach((g) => {
        lines.push(`- ${g.name || "未命名"}: ${"★".repeat(g.stars)} (${getLevelLabel(g.stars)})`);
      });
    }
    return lines.join("\n");
  };

  const buildRules = () => {
    return combinedRules.map((rule) => `- ${rule}`).join("\n");
  };

  const buildCautions = () => {
    return combinedCautions.map((item) => `- ${item}`).join("\n");
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!canSubmit) {
      setError("必須項目を入力してください");
      return;
    }
    setSubmitting(true);
    let createdId = null;
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
        start_time: form.start_time,
        end_time: form.end_time,
        rules: buildRules(),
        cautions: buildCautions(),
      };
      const res = await api.post("/tournaments", payload);
      createdId = res?.tournament?.id;
      if (createdId && selectedImageFile) {
        const formData = new FormData();
        formData.append("file", selectedImageFile);
        const uploaded = await api.postForm("/uploads/direct", formData);
        const contentType = uploaded.content_type || selectedImageFile.type || "application/octet-stream";
        await api.post(`/tournaments/${createdId}/images`, {
          file_url: uploaded.public_url,
          file_name: uploaded.file_name || selectedImageFile.name,
          content_type: contentType,
          size_bytes: Number(uploaded.size_bytes || selectedImageFile.size),
        });
      }
      if (createdId) {
        navigate(`/admin/tournaments/${createdId}`, {
          replace: true,
          state: { flash: { type: "success", message: "大会を作成しました。" } },
        });
      } else {
        navigate("/admin/tournaments", {
          replace: true,
          state: { flash: { type: "success", message: "大会を作成しました。" } },
        });
      }
    } catch (e) {
      if (createdId) {
        navigate(`/admin/tournaments/${createdId}`, {
          replace: true,
          state: {
            flash: {
              type: "info",
              message: "大会を作成しましたが、画像のアップロードに失敗しました。",
            },
          },
        });
        return;
      }
      if (e?.status === 422) {
        setError("入力内容を確認してください");
      } else {
        setError("大会作成に失敗しました");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const toggleDefaultRule = (rule) => {
    setSelectedRuleOptions((prev) => (prev.includes(rule) ? prev.filter((item) => item !== rule) : [...prev, rule]));
  };

  const addCustomRule = () => {
    const next = customRuleInput.trim();
    if (!next) return;
    if (combinedRules.includes(next)) {
      setCustomRuleInput("");
      return;
    }
    setCustomRules((prev) => [...prev, next]);
    setCustomRuleInput("");
  };

  const removeCustomRule = (rule) => {
    setCustomRules((prev) => prev.filter((item) => item !== rule));
  };

  const toggleDefaultCaution = (item) => {
    setSelectedCautionOptions((prev) => (prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]));
  };

  const addCustomCaution = () => {
    const next = customCautionInput.trim();
    if (!next) return;
    if (combinedCautions.includes(next)) {
      setCustomCautionInput("");
      return;
    }
    setCustomCautions((prev) => [...prev, next]);
    setCustomCautionInput("");
  };

  const removeCustomCaution = (item) => {
    setCustomCautions((prev) => prev.filter((v) => v !== item));
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
                <input value={form.venue} onChange={onFormChange("venue")} placeholder="例: MIFA Football Park 豊洲" />
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
              <span className="material-symbols-outlined">image</span>
              カバー画像
            </h2>
            <div className="adcreate-card">
              <label>
                大会画像
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) => setSelectedImageFile(event.target.files?.[0] || null)}
                />
              </label>
              {imagePreviewUrl ? (
                <div className="adcreate-image-preview">
                  <img src={imagePreviewUrl} alt="大会画像プレビュー" />
                </div>
              ) : (
                <div className="adcreate-image-empty">画像を設定すると、ホームと大会詳細の背景に表示されます。</div>
              )}
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

              <div className="adcreate-rules-editor">
                <p>ルール</p>
                <div className="adcreate-rule-presets">
                  {DEFAULT_RULE_OPTIONS.map((rule) => {
                    const selected = selectedRuleOptions.includes(rule);
                    return (
                      <button
                        key={rule}
                        type="button"
                        className={`adcreate-rule-preset ${selected ? "is-selected" : ""}`}
                        onClick={() => toggleDefaultRule(rule)}
                      >
                        <span className="material-symbols-outlined">{selected ? "check_circle" : "add_circle"}</span>
                        <span>{rule}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="adcreate-rule-add">
                  <input
                    type="text"
                    value={customRuleInput}
                    onChange={(e) => setCustomRuleInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomRule();
                      }
                    }}
                    placeholder="追加ルールを入力して追加"
                  />
                  <button type="button" onClick={addCustomRule}>
                    追加
                  </button>
                </div>

                <ul className="adcreate-rule-bullets">
                  {combinedRules.map((rule) => (
                    <li key={rule}>
                      <span className="material-symbols-outlined">check</span>
                      <span>{rule}</span>
                      {customRules.includes(rule) ? (
                        <button type="button" onClick={() => removeCustomRule(rule)} aria-label={`${rule}を削除`}>
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      ) : null}
                    </li>
                  ))}
                  {combinedRules.length === 0 ? <li className="adcreate-rule-empty">ルールが未設定です。</li> : null}
                </ul>
              </div>

              <div className="adcreate-rules-editor">
                <p>注意事項</p>
                <div className="adcreate-rule-presets">
                  {DEFAULT_CAUTION_OPTIONS.map((item) => {
                    const selected = selectedCautionOptions.includes(item);
                    return (
                      <button
                        key={item}
                        type="button"
                        className={`adcreate-rule-preset ${selected ? "is-selected" : ""}`}
                        onClick={() => toggleDefaultCaution(item)}
                      >
                        <span className="material-symbols-outlined">{selected ? "check_circle" : "add_circle"}</span>
                        <span>{item}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="adcreate-rule-add">
                  <input
                    type="text"
                    value={customCautionInput}
                    onChange={(e) => setCustomCautionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        addCustomCaution();
                      }
                    }}
                    placeholder="追加注意事項を入力して追加"
                  />
                  <button type="button" onClick={addCustomCaution}>
                    追加
                  </button>
                </div>

                <ul className="adcreate-rule-bullets">
                  {combinedCautions.map((item) => (
                    <li key={item}>
                      <span className="material-symbols-outlined">check</span>
                      <span>{item}</span>
                      {customCautions.includes(item) ? (
                        <button type="button" onClick={() => removeCustomCaution(item)} aria-label={`${item}を削除`}>
                          <span className="material-symbols-outlined">close</span>
                        </button>
                      ) : null}
                    </li>
                  ))}
                  {combinedCautions.length === 0 ? <li className="adcreate-rule-empty">注意事項が未設定です。</li> : null}
                </ul>
              </div>
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

      <AdminBottomNav />
    </div>
  );
}
