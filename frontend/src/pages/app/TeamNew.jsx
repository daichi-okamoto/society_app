import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";

const PREFECTURES = [
  { value: "", label: "都道府県を選択" },
  { value: "tokyo", label: "東京都" },
  { value: "kanagawa", label: "神奈川県" },
  { value: "saitama", label: "埼玉県" },
  { value: "chiba", label: "千葉県" },
  { value: "osaka", label: "大阪府" },
  { value: "kyoto", label: "京都府" },
  { value: "hyogo", label: "兵庫県" },
  { value: "fukuoka", label: "福岡県" }
];

export default function TeamNew() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [isRepresentative, setIsRepresentative] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const previewUrl = useMemo(() => {
    if (!logoFile) return "";
    return URL.createObjectURL(logoFile);
  }, [logoFile]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (submitting) return;

    if (!name.trim()) {
      setError("チーム名を入力してください");
      return;
    }

    if (!location) {
      setError("活動拠点を選択してください");
      return;
    }

    if (!isRepresentative) {
      setError("代表者チェックをONにしてください");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = await api.post("/teams", { name: name.trim() });
      navigate(`/teams/${data.team.id}`, {
        state: { flash: { type: "success", message: "チームを作成しました。" } },
      });
    } catch {
      setError("チーム作成に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="tnew-root">
      <header className="tnew-header">
        <div className="left">
          <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1>チーム作成</h1>
        </div>
        <button type="button" aria-label="ヘルプ">
          <span className="material-symbols-outlined">help</span>
        </button>
      </header>

      <main className="tnew-main">
        <form className="tnew-form" onSubmit={onSubmit}>
          <section className="tnew-logo-section">
            <label htmlFor="team-logo" className="tnew-logo-wrap">
              <span className="material-symbols-outlined">add_a_photo</span>
              <small>ロゴ</small>
              {previewUrl ? <img src={previewUrl} alt="Team Logo Preview" /> : null}
            </label>

            <input
              id="team-logo"
              type="file"
              accept="image/*"
              onChange={(e) => setLogoFile(e.target.files?.[0] || null)}
              hidden
            />

            <div className="tnew-logo-edit">
              <span className="material-symbols-outlined">edit</span>
            </div>

            <p>
              チームのロゴ画像を
              <br />
              アップロードしてください
            </p>
          </section>

          <section className="tnew-fields">
            <div className="field">
              <label htmlFor="team-name">
                チーム名 <span>*</span>
              </label>
              <input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="例: FC 東京セブンズ"
                required
              />
            </div>

            <div className="field">
              <label htmlFor="team-desc">チーム紹介文</label>
              <textarea
                id="team-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="チームの活動方針や雰囲気などを入力してください"
              />
            </div>

            <div className="field">
              <label htmlFor="team-location">
                活動拠点 <span>*</span>
              </label>
              <div className="select-wrap">
                <span className="material-symbols-outlined icon-left">location_on</span>
                <select
                  id="team-location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  required
                >
                  {PREFECTURES.map((pref) => (
                    <option key={pref.value || "empty"} value={pref.value}>
                      {pref.label}
                    </option>
                  ))}
                </select>
                <span className="material-symbols-outlined icon-right">expand_more</span>
              </div>
            </div>
          </section>

          <section className="tnew-submit-area">
            <label htmlFor="representative-confirm" className="check-row">
              <input
                id="representative-confirm"
                type="checkbox"
                checked={isRepresentative}
                onChange={(e) => setIsRepresentative(e.target.checked)}
              />
              <span>チームを作成する人が代表者になります</span>
            </label>

            {error ? <p className="tnew-error">{error}</p> : null}

            <button type="submit" disabled={submitting}>
              <span>{submitting ? "登録中..." : "チームを登録する"}</span>
            </button>
          </section>
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
            <button type="button">
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
