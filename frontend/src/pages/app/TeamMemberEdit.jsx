import { useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import {
  loadManualMemberRecords,
  removeManualMemberRecord,
  setMemberOverride,
  updateManualMemberRecord,
} from "../../lib/teamMembersStorage";

const POSITION_OPTIONS = ["FW", "MF", "DF", "GK"];

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("file_read_error"));
    reader.readAsDataURL(file);
  });
}

function buildFallbackMember(memberId) {
  return {
    id: memberId,
    name: "未設定メンバー",
    furigana: "",
    pos: "MF",
    number: 0,
    source: "invited",
    avatar: "",
  };
}

export default function TeamMemberEdit() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id: teamId, memberId } = useParams();

  const manualRecord = useMemo(() => {
    return loadManualMemberRecords(teamId).find((m) => String(m.id) === String(memberId)) || null;
  }, [teamId, memberId]);

  const sourceMember = useMemo(() => {
    const fromState = location.state?.member;
    if (fromState && fromState.source !== "manual") return fromState;

    if (manualRecord) {
      return {
        id: manualRecord.id,
        name: manualRecord.name,
        furigana: manualRecord.furigana || "",
        pos: manualRecord.position || "MF",
        number: Number(manualRecord.number || 0),
        source: "manual",
        avatar: manualRecord.avatar_data_url || "",
        phone: manualRecord.phone || "",
        postal_code: manualRecord.postal_code || "",
        prefecture: manualRecord.prefecture || "",
        city_block: manualRecord.city_block || "",
        building: manualRecord.building || "",
      };
    }

    if (fromState) return fromState;
    return buildFallbackMember(memberId);
  }, [location.state?.member, memberId, manualRecord]);

  const isManual = sourceMember?.source === "manual";

  const [form, setForm] = useState({
    name: sourceMember?.name || "",
    furigana: sourceMember?.furigana || "",
    position: sourceMember?.pos || "MF",
    number: sourceMember?.number ? String(sourceMember.number) : "",
    avatar: sourceMember?.avatar || "",
    phone: sourceMember?.phone || "",
    postal_code: sourceMember?.postal_code || "",
    prefecture: sourceMember?.prefecture || "",
    city_block: sourceMember?.city_block || "",
    building: sourceMember?.building || "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  const avatarUrl = useMemo(() => {
    if (form.avatar) return form.avatar;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(form.name || sourceMember?.name || "メンバー")}&background=fef3c7&color=b45309&size=256`;
  }, [form.avatar, form.name, sourceMember?.name]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onAvatarChange(event) {
    if (!isManual) return;
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const dataUrl = await readAsDataUrl(file);
      setField("avatar", String(dataUrl || ""));
    } catch {
      setError("画像の読み込みに失敗しました。");
    }
  }

  function normalizeNumber(value) {
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) return 0;
    return Math.floor(n);
  }

  function onSubmit(event) {
    event.preventDefault();
    if (saving) return;

    if (isManual && !form.name.trim()) {
      setError("名前を入力してください。");
      return;
    }

    setSaving(true);
    setError("");

    try {
      const normalizedPos = POSITION_OPTIONS.includes(form.position) ? form.position : "MF";
      const normalizedNumber = normalizeNumber(form.number);

      if (isManual) {
        updateManualMemberRecord(teamId, memberId, (record) => ({
          ...record,
          name: form.name.trim(),
          furigana: form.furigana.trim(),
          phone: form.phone.trim(),
          postal_code: form.postal_code.trim(),
          prefecture: form.prefecture.trim(),
          city_block: form.city_block.trim(),
          building: form.building.trim(),
          position: normalizedPos,
          number: normalizedNumber,
          avatar_data_url: form.avatar || "",
        }));
      } else {
        setMemberOverride(teamId, memberId, {
          pos: normalizedPos,
          number: normalizedNumber,
        });
      }

      navigate(`/teams/${teamId}/members`, {
        state: { flash: { type: "success", message: "メンバー情報を更新しました。" } },
      });
    } catch {
      setError("更新に失敗しました。もう一度お試しください。");
      setSaving(false);
    }
  }

  function onDelete() {
    if (!isManual || deleting) return;
    setDeleting(true);

    try {
      removeManualMemberRecord(teamId, memberId);
      navigate(`/teams/${teamId}/members`, {
        state: { flash: { type: "success", message: "メンバーを削除しました。" } },
      });
    } catch {
      setError("削除に失敗しました。もう一度お試しください。");
      setDeleting(false);
    }
  }

  return (
    <div className="tmed-root">
      <header className="tmed-header">
        <div className="left">
          <button type="button" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1>メンバー編集</h1>
        </div>
        <div className="spacer" />
      </header>

      <main className="tmed-main">
        <div className="tmed-note">
          <p>
            {isManual
              ? "※手動で追加したメンバーの情報のみ変更可能です"
              : "※招待コードで参加したメンバーは背番号・ポジションのみ変更できます"}
          </p>
        </div>

        <div className="tmed-body">
          <section className="tmed-avatar-block">
            <label htmlFor="member-avatar" className={`avatar-wrap ${isManual ? "clickable" : "disabled"}`}>
              <div className="ring">
                <img src={avatarUrl} alt="Member Profile" />
              </div>
              <span className="camera-btn">
                <span className="material-symbols-outlined">photo_camera</span>
              </span>
            </label>
            <input id="member-avatar" type="file" accept="image/*" onChange={onAvatarChange} hidden disabled={!isManual} />
          </section>

          <form className="tmed-form" onSubmit={onSubmit}>
            <div className="field">
              <label htmlFor="name">名前</label>
              <input
                id="name"
                type="text"
                value={form.name}
                onChange={(e) => setField("name", e.target.value)}
                placeholder="例：山田 太郎"
                disabled={!isManual}
              />
            </div>

            <div className="field">
              <label htmlFor="furigana">ふりがな</label>
              <input
                id="furigana"
                type="text"
                value={form.furigana}
                onChange={(e) => setField("furigana", e.target.value)}
                placeholder="例：やまだ たろう"
                disabled={!isManual}
              />
            </div>

            <div className="grid">
              <div className="field">
                <label htmlFor="position">ポジション</label>
                <div className="select-wrap">
                  <select id="position" value={form.position} onChange={(e) => setField("position", e.target.value)}>
                    {POSITION_OPTIONS.map((pos) => (
                      <option key={pos} value={pos}>
                        {pos}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>

              <div className="field">
                <label htmlFor="number">背番号</label>
                <input
                  id="number"
                  type="number"
                  value={form.number}
                  onChange={(e) => setField("number", e.target.value)}
                  placeholder="00"
                />
              </div>
            </div>

            {isManual ? (
              <>
                <div className="field">
                  <label htmlFor="phone">電話番号</label>
                  <input
                    id="phone"
                    type="text"
                    value={form.phone}
                    onChange={(e) => setField("phone", e.target.value)}
                    placeholder="例：090-1234-5678"
                  />
                </div>

                <div className="grid">
                  <div className="field">
                    <label htmlFor="postal-code">郵便番号</label>
                    <input
                      id="postal-code"
                      type="text"
                      value={form.postal_code}
                      onChange={(e) => setField("postal_code", e.target.value)}
                      placeholder="例：123-4567"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="prefecture">都道府県</label>
                    <input
                      id="prefecture"
                      type="text"
                      value={form.prefecture}
                      onChange={(e) => setField("prefecture", e.target.value)}
                      placeholder="例：東京都"
                    />
                  </div>
                </div>

                <div className="field">
                  <label htmlFor="city-block">市区町村・番地</label>
                  <input
                    id="city-block"
                    type="text"
                    value={form.city_block}
                    onChange={(e) => setField("city_block", e.target.value)}
                    placeholder="例：渋谷区神南1-2-3"
                  />
                </div>

                <div className="field">
                  <label htmlFor="building">建物名・部屋番号</label>
                  <input
                    id="building"
                    type="text"
                    value={form.building}
                    onChange={(e) => setField("building", e.target.value)}
                    placeholder="例：渋谷コーポ 101号室"
                  />
                </div>
              </>
            ) : null}

            {error ? <p className="error-text">{error}</p> : null}

            <div className="actions">
              <button type="submit" className="save-btn" disabled={saving}>
                {saving ? "保存中..." : "変更を保存する"}
              </button>

              {isManual ? (
                <button type="button" className="delete-btn" onClick={onDelete} disabled={deleting}>
                  <span className="material-symbols-outlined">delete</span>
                  メンバーを削除する
                </button>
              ) : null}
            </div>
          </form>
        </div>
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
