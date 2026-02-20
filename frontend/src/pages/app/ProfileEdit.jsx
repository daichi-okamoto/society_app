import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県",
  "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県",
  "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

function formatBirthDate(value) {
  if (!value) return "";
  if (value.includes("/")) return value;
  return value.replaceAll("-", "/");
}

function normalizeBirthDate(value) {
  return value.trim().replaceAll("/", "-");
}

function toDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

function splitAddress(rawAddress) {
  const address = String(rawAddress || "").trim();
  if (!address) {
    return { postal_code: "", prefecture: "", city_block: "", building: "" };
  }

  const postalMatch = address.match(/(?:〒)?\s*(\d{3}-?\d{4})/);
  const postalCode = postalMatch ? postalMatch[1] : "";
  let rest = address.replace(/(?:〒)?\s*\d{3}-?\d{4}\s*/, "").trim();

  const pref = PREFECTURES.find((p) => rest.startsWith(p)) || "";
  if (pref) rest = rest.slice(pref.length).trim();

  return {
    postal_code: postalCode,
    prefecture: pref,
    city_block: rest,
    building: "",
  };
}

function composeAddress({ postal_code, prefecture, city_block, building }) {
  const digits = toDigits(postal_code);
  const zip = digits.length === 7 ? `〒${digits.slice(0, 3)}-${digits.slice(3)}` : "";
  return [zip, `${prefecture || ""}${city_block || ""}`.trim(), String(building || "").trim()]
    .filter(Boolean)
    .join(" ");
}

export default function ProfileEdit() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    name_kana: "",
    birth_date: "",
    email: "",
    phone: "",
    address: "",
    postal_code: "",
    prefecture: "",
    city_block: "",
    building: "",
  });

  useEffect(() => {
    if (!user) return;
    const parsedAddress = splitAddress(user.address || "");
    setForm({
      name: user.name || "",
      name_kana: user.name_kana || "",
      birth_date: formatBirthDate(user.birth_date || ""),
      email: user.email || "",
      phone: user.phone || "",
      address: user.address || "",
      postal_code: parsedAddress.postal_code,
      prefecture: parsedAddress.prefecture,
      city_block: parsedAddress.city_block,
      building: parsedAddress.building,
    });
  }, [user]);

  const avatarUrl = useMemo(() => {
    const displayName = form.name || user?.name || "田中 太郎";
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=fef3c7&color=b45309&size=256`;
  }, [form.name, user?.name]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onPostalSearch() {
    if (searchingAddress) return;
    const digits = toDigits(form.postal_code);
    if (digits.length !== 7) {
      setError("郵便番号は7桁で入力してください。");
      return;
    }

    setSearchingAddress(true);
    setError("");
    try {
      const controller = new AbortController();
      const timer = window.setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${digits}`, {
        method: "GET",
        signal: controller.signal,
      });
      window.clearTimeout(timer);

      if (!res.ok) throw new Error("address_search_failed");
      const data = await res.json();
      if (data?.status !== 200 || !Array.isArray(data.results) || data.results.length === 0) {
        setError("該当する住所が見つかりませんでした。");
        return;
      }

      const row = data.results[0];
      const prefecture = row.address1 || "";
      const cityBlock = `${row.address2 || ""}${row.address3 || ""}`.trim();
      setForm((prev) => ({
        ...prev,
        prefecture: prefecture || prev.prefecture,
        city_block: cityBlock || prev.city_block,
      }));
    } catch {
      setError("住所検索に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSearchingAddress(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const composedAddress = composeAddress(form);
      const payload = {
        name: form.name,
        name_kana: form.name_kana,
        email: form.email,
        phone: form.phone,
        birth_date: normalizeBirthDate(form.birth_date)
,
        address: composedAddress,
      };
      const data = await api.patch("/users/me", payload);
      setUser(data?.user || null);
      navigate("/me", {
        state: { flash: { type: "success", message: "プロフィールを更新しました。" } },
      });
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

            <label htmlFor="postal_code">郵便番号</label>
            <div className="mpe-postal-row">
              <div className="mpe-postal-input">
                <i>〒</i>
                <input
                  id="postal_code"
                  value={form.postal_code}
                  onChange={(e) => setField("postal_code", e.target.value)}
                  placeholder="123-4567"
                  inputMode="numeric"
                />
              </div>
              <button type="button" onClick={onPostalSearch} disabled={searchingAddress}>
                {searchingAddress ? "検索中..." : "住所検索"}
              </button>
            </div>

            <label htmlFor="prefecture">都道府県</label>
            <div className="mpe-select-wrap">
              <select id="prefecture" value={form.prefecture} onChange={(e) => setField("prefecture", e.target.value)}>
                <option value="">都道府県を選択</option>
                {PREFECTURES.map((pref) => (
                  <option value={pref} key={pref}>
                    {pref}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined">expand_more</span>
            </div>

            <label htmlFor="city_block">市区町村・番地</label>
            <input
              id="city_block"
              value={form.city_block}
              onChange={(e) => setField("city_block", e.target.value)}
              placeholder="例：渋谷区神南1-2-3"
            />

            <label htmlFor="building">建物名・部屋番号 <small>（任意）</small></label>
            <input
              id="building"
              value={form.building}
              onChange={(e) => setField("building", e.target.value)}
              placeholder="例：渋谷コーポ 101号室"
            />
          </div>

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
