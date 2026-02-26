import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

const PREFECTURES = [
  "北海道",
  "青森県",
  "岩手県",
  "宮城県",
  "秋田県",
  "山形県",
  "福島県",
  "茨城県",
  "栃木県",
  "群馬県",
  "埼玉県",
  "千葉県",
  "東京都",
  "神奈川県",
  "新潟県",
  "富山県",
  "石川県",
  "福井県",
  "山梨県",
  "長野県",
  "岐阜県",
  "静岡県",
  "愛知県",
  "三重県",
  "滋賀県",
  "京都府",
  "大阪府",
  "兵庫県",
  "奈良県",
  "和歌山県",
  "鳥取県",
  "島根県",
  "岡山県",
  "広島県",
  "山口県",
  "徳島県",
  "香川県",
  "愛媛県",
  "高知県",
  "福岡県",
  "佐賀県",
  "長崎県",
  "熊本県",
  "大分県",
  "宮崎県",
  "鹿児島県",
  "沖縄県",
];

function toDigits(value) {
  return String(value || "").replace(/[^\d]/g, "");
}

export default function TeamMemberManualAdd() {
  const navigate = useNavigate();
  const { id: teamId } = useParams();

  const [form, setForm] = useState({
    name: "",
    furigana: "",
    phone: "",
    postal_code: "",
    prefecture: "",
    city_block: "",
    building: "",
    number: "",
    position: "MF",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);

  const canSubmit = useMemo(() => {
    return (
      form.name.trim() &&
      form.furigana.trim() &&
      form.phone.trim() &&
      form.postal_code.trim() &&
      form.prefecture &&
      form.city_block.trim()
    );
  }, [form]);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const onPostalSearch = async () => {
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

      if (!res.ok) {
        throw new Error("address_search_failed");
      }

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
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    if (!canSubmit) {
      setError("必須項目を入力してください。");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/teams/${teamId}/manual_members`, {
        name: form.name.trim(),
        name_kana: form.furigana.trim(),
        phone: form.phone.trim(),
        postal_code: form.postal_code.trim(),
        prefecture: form.prefecture,
        city_block: form.city_block.trim(),
        building: form.building.trim(),
        position: form.position,
        jersey_number: form.number ? Number(form.number) : null,
      });
      navigate(`/teams/${teamId}/members`, {
        state: { flash: { type: "success", message: "メンバーを追加しました。" } },
      });
    } catch {
      setError("保存に失敗しました。もう一度お試しください。");
      setSubmitting(false);
    }
  };

  return (
    <div className="tmadd-root">
      <div className="tmadd-shell">
        <header className="tmadd-header">
          <div className="tmadd-head-left">
            <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
            <h1>メンバーを手動で追加</h1>
          </div>
        </header>

        <main className="tmadd-main">
          <section className="tmadd-note">
            <span className="material-symbols-outlined">info</span>
            <p>アプリに登録していないメンバーをチームに追加します。保険の名簿提出や試合管理に使用できます。</p>
          </section>

          <form className="tmadd-form" onSubmit={onSubmit}>
            <label>
              名前（氏名）<span>*</span>
              <input value={form.name} onChange={(e) => setField("name", e.target.value)} placeholder="例：山田 太郎" />
            </label>

            <label>
              ふりがな<span>*</span>
              <input value={form.furigana} onChange={(e) => setField("furigana", e.target.value)} placeholder="例：やまだ たろう" />
            </label>

            <label>
              電話番号<span>*</span>
              <input value={form.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="例：090-1234-5678" inputMode="tel" />
            </label>

            <label>
              郵便番号<span>*</span>
              <div className="tmadd-postal-row">
                <div className="tmadd-postal-input">
                  <i>〒</i>
                  <input
                    value={form.postal_code}
                    onChange={(e) => setField("postal_code", e.target.value)}
                    placeholder="123-4567"
                    inputMode="numeric"
                  />
                </div>
                <button type="button" onClick={onPostalSearch}>
                  {searchingAddress ? "検索中..." : "住所検索"}
                </button>
              </div>
            </label>

            <label>
              都道府県<span>*</span>
              <div className="tmadd-select-wrap">
                <select value={form.prefecture} onChange={(e) => setField("prefecture", e.target.value)}>
                  <option value="">都道府県を選択</option>
                  {PREFECTURES.map((pref) => (
                    <option value={pref} key={pref}>
                      {pref}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </label>

            <label>
              市区町村・番地<span>*</span>
              <input value={form.city_block} onChange={(e) => setField("city_block", e.target.value)} placeholder="例：渋谷区神南1-2-3" />
            </label>

            <label>
              建物名・部屋番号 <small>（任意）</small>
              <input value={form.building} onChange={(e) => setField("building", e.target.value)} placeholder="例：渋谷コーポ 101号室" />
            </label>

            <hr />

            <label>
              背番号 <small>（任意）</small>
              <input value={form.number} onChange={(e) => setField("number", e.target.value)} placeholder="例：10" inputMode="numeric" />
            </label>

            <fieldset className="tmadd-position">
              <legend>
                ポジション <small>（任意）</small>
              </legend>
              {["FW", "MF", "DF", "GK"].map((pos) => (
                <label key={pos} className={form.position === pos ? "active" : ""}>
                  <input
                    type="radio"
                    name="position"
                    value={pos}
                    checked={form.position === pos}
                    onChange={(e) => setField("position", e.target.value)}
                  />
                  <span>{pos}</span>
                </label>
              ))}
            </fieldset>

            {error ? <p className="tmadd-error">{error}</p> : null}

            <div className="tmadd-submit-wrap">
              <button type="submit" disabled={submitting}>
                {submitting ? "追加中..." : "メンバーを追加する"}
              </button>
            </div>
          </form>
        </main>

        <nav className="tmadd-nav">
          <div className="tmadd-nav-row">
            <Link to="/app/home" className="tmadd-nav-item">
              <span className="material-symbols-outlined">home</span>
              <span>ホーム</span>
            </Link>
            <Link to="/tournaments" className="tmadd-nav-item">
              <span className="material-symbols-outlined">search</span>
              <span>さがす</span>
            </Link>
            <div className="tmadd-nav-center">
              <button type="button" aria-label="フットサル">
                <span className="material-symbols-outlined">sports_soccer</span>
              </button>
            </div>
            <Link to="/teams" className="tmadd-nav-item active">
              <span className="material-symbols-outlined">groups</span>
              <span>チーム</span>
            </Link>
            <Link to="/me" className="tmadd-nav-item">
              <span className="material-symbols-outlined">person</span>
              <span>マイページ</span>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
