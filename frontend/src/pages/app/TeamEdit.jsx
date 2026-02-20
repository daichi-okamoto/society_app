import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";
import { normalizeTeamHandle, readTeamProfileDraft, writeTeamProfileDraft } from "../../lib/teamProfileDraft";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県", "茨城県", "栃木県", "群馬県",
  "埼玉県", "千葉県", "東京都", "神奈川県", "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県", "徳島県", "香川県", "愛媛県", "高知県", "福岡県",
  "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県"
];

function parseLocationLabel(rawLabel) {
  const label = String(rawLabel || "").trim();
  const prefecture = PREFECTURES.find((pref) => label.startsWith(pref)) || PREFECTURES[12];
  const city = label.slice(prefecture.length).trim();
  return { prefecture, city };
}

function composeLocationLabel(prefecture, city) {
  return `${String(prefecture || "").trim()}${String(city || "").trim()}`;
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("file_read_error"));
    reader.readAsDataURL(file);
  });
}

export default function TeamEdit() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    handle: "",
    prefecture: PREFECTURES[12],
    city: "渋谷区",
    introduction: "",
    logoDataUrl: ""
  });

  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .get(`/teams/${id}`)
      .then((data) => {
        if (!active) return;
        const fetched = data?.team || null;
        setTeam(fetched);

        const draft = readTeamProfileDraft(id) || {};
        const locationLabel = draft.locationLabel || "東京都渋谷区";
        const parsedLocation = parseLocationLabel(locationLabel);

        setForm({
          name: fetched?.name || "",
          handle: normalizeTeamHandle(draft.teamHandle || "", fetched?.name || ""),
          prefecture: parsedLocation.prefecture,
          city: parsedLocation.city || "",
          introduction:
            draft.introduction ||
            "社会人を中心とした、エンジョイ志向のチームです。週末の朝を中心に活動しています。未経験者も大歓迎！",
          logoDataUrl: draft.logoDataUrl || ""
        });
      })
      .catch(() => {
        if (!active) return;
        setError("チーム情報の取得に失敗しました。");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const previewLogo = useMemo(() => {
    if (form.logoDataUrl) return form.logoDataUrl;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || team?.name || "FC 東京セブン")}&background=fef3c7&color=b45309&size=256`;
  }, [form.logoDataUrl, form.name, team?.name]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onLogoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readAsDataUrl(file);
      setField("logoDataUrl", String(dataUrl || ""));
    } catch {
      setError("画像の読み込みに失敗しました。");
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (saving) return;

    if (!form.name.trim()) {
      setError("チーム名を入力してください。");
      return;
    }

    setSaving(true);
    setError("");

    try {
      await api.patch(`/teams/${id}`, { name: form.name.trim() });
      writeTeamProfileDraft(id, {
        teamHandle: normalizeTeamHandle(form.handle, form.name),
        locationLabel: composeLocationLabel(form.prefecture, form.city),
        introduction: form.introduction.trim(),
        logoDataUrl: form.logoDataUrl || ""
      });

      navigate("/teams", {
        state: { flash: { type: "success", message: "チーム情報を更新しました。" } }
      });
    } catch {
      setError("更新に失敗しました。");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (!team) return <section>{error || "チームが見つかりません。"}</section>;

  return (
    <div className="ted-root">
      <header className="ted-header">
        <div className="ted-header-row">
          <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1>チーム編集</h1>
        </div>
      </header>

      <main className="ted-main">
        <section className="ted-avatar-section">
          <label htmlFor="team-logo" className="ted-avatar-picker">
            <div className="ted-avatar-shell">
              <img src={previewLogo} alt="Team Logo" />
            </div>
            <span className="ted-camera">
              <span className="material-symbols-outlined">photo_camera</span>
            </span>
          </label>
          <input id="team-logo" type="file" accept="image/*" onChange={onLogoChange} hidden />
          <p>プロフィール写真を変更</p>
        </section>

        <form className="ted-form" onSubmit={onSubmit}>
          <div className="ted-field">
            <label htmlFor="team-name">チーム名</label>
            <input
              id="team-name"
              type="text"
              value={form.name}
              onChange={(e) => setField("name", e.target.value)}
              placeholder="チーム名を入力"
            />
          </div>

          <div className="ted-field">
            <label htmlFor="team-id">
              チームID <span>(変更不可)</span>
            </label>
            <div className="ted-disabled-wrap">
              <input id="team-id" type="text" value={normalizeTeamHandle(form.handle, form.name)} disabled />
              <span className="material-symbols-outlined">lock</span>
            </div>
          </div>

          <div className="ted-field">
            <label>活動拠点</label>
            <div className="ted-location-grid">
              <div className="ted-select-wrap">
                <select
                  id="location-prefecture"
                  value={form.prefecture}
                  onChange={(e) => {
                    const nextPrefecture = e.target.value;
                    setForm((prev) => ({
                      ...prev,
                      prefecture: nextPrefecture,
                      city: prev.city
                    }));
                  }}
                >
                  {PREFECTURES.map((prefecture) => (
                    <option key={prefecture} value={prefecture}>
                      {prefecture}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined">expand_more</span>
              </div>
              <div>
                <input
                  id="location-city"
                  type="text"
                  value={form.city}
                  onChange={(e) => setField("city", e.target.value)}
                  placeholder="市区町村を入力"
                />
              </div>
            </div>
          </div>

          <div className="ted-field">
            <div className="ted-label-row">
              <label htmlFor="introduction">チーム紹介文</label>
              <small>{form.introduction.length}/500</small>
            </div>
            <textarea
              id="introduction"
              rows={5}
              maxLength={500}
              value={form.introduction}
              onChange={(e) => setField("introduction", e.target.value)}
              placeholder="チームの紹介文を入力してください"
            />
          </div>

          {error ? <p className="ted-error">{error}</p> : null}

          <div className="ted-submit-wrap">
            <button type="submit" disabled={saving}>
              <span>{saving ? "保存中..." : "変更を保存する"}</span>
            </button>
          </div>
        </form>
      </main>

      <nav className="tm-nav">
        <div className="tm-nav-row">
          <Link to="/app/home" className="tm-nav-item">
            <span className="material-symbols-outlined">home</span>
            <span>ホーム</span>
          </Link>
          <Link to="/tournaments" className="tm-nav-item">
            <span className="material-symbols-outlined">search</span>
            <span>さがす</span>
          </Link>
          <div className="tm-nav-center">
            <button type="button" aria-label="ブランドロゴ">
              <span className="material-symbols-outlined">sports_soccer</span>
            </button>
          </div>
          <Link to="/teams" className="tm-nav-item active">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/me" className="tm-nav-item">
            <span className="material-symbols-outlined">person</span>
            <span>マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
