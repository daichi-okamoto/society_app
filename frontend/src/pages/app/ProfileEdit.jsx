import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

function formatBirthDate(value) {
  if (!value) return "";
  if (value.includes("/")) return value;
  return value.replaceAll("-", "/");
}

function normalizeBirthDate(value) {
  return value.trim().replaceAll("/", "-");
}

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    name_kana: "",
    birth_date: "",
    email: "",
    phone: "",
    address: ""
  });

  useEffect(() => {
    if (!user) return;
    setForm({
      name: user.name || "",
      name_kana: user.name_kana || "",
      birth_date: formatBirthDate(user.birth_date || ""),
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || ""
    });
  }, [user]);

  const avatarUrl = useMemo(() => {
    const displayName = form.name || user?.name || "田中 太郎";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=fef3c7&color=b45309&size=256`;
  }, [form.name, user?.name]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        ...form,
        birth_date: normalizeBirthDate(form.birth_date)
      };
      const data = await api.patch("/users/me", payload);
      setUser(data?.user || null);
      setMessage("プロフィールを更新しました");
      setTimeout(() => navigate("/me"), 500);
    } catch {
      setError("更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mpe-root">
      <header className="mpe-header">
        <button type="button" onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h1>プロフィールを編集</h1>
        <div className="spacer" />
      </header>

      <main className="mpe-main">
        <section className="mpe-avatar-section">
          <div className="mpe-avatar-wrap">
            <img src={avatarUrl} alt={form.name || "ユーザー"} />
            <button type="button" aria-label="写真を変更">
              <span className="material-symbols-outlined">photo_camera</span>
            </button>
          </div>
        </section>

        <form className="mpe-form" onSubmit={onSubmit}>
          <div className="mpe-group">
            <h2>基本情報</h2>

            <label htmlFor="name">氏名</label>
            <input id="name" value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="例：田中 太郎" />

            <label htmlFor="kana">ふりがな</label>
            <input id="kana" value={form.name_kana} onChange={(e) => setField("name_kana", e.target.value)} placeholder="例：たなか たろう" />

            <label htmlFor="birthday">生年月日</label>
            <input
              id="birthday"
              value={form.birth_date}
              onChange={(e) => setField("birth_date", e.target.value)}
              placeholder="YYYY/MM/DD"
            />
          </div>

          <div className="mpe-group">
            <h2>連絡先</h2>

            <label htmlFor="email">メールアドレス</label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => setField("email", e.target.value)}
              placeholder="example@mail.com"
            />

            <label htmlFor="phone">電話番号</label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setField("phone", e.target.value)}
              placeholder="000-0000-0000"
            />

            <label htmlFor="address">住所</label>
            <input
              id="address"
              value={form.address}
              onChange={(e) => setField("address", e.target.value)}
              placeholder="都道府県・市区町村・番地"
            />
          </div>

          {message ? <p className="mpe-msg ok">{message}</p> : null}
          {error ? <p className="mpe-msg ng">{error}</p> : null}

          <div className="mpe-fixed-submit">
            <button type="submit" disabled={submitting}>
              <span>{submitting ? "保存中..." : "変更を保存する"}</span>
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
