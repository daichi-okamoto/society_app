import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";

const MEMBERS = [
  {
    id: 1,
    name: "田中 健太",
    roleLabel: "キャプテン",
    roleBadge: "CP",
    pos: "MF",
    number: 10,
    featured: true,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCX9N6okYrlSA1JKbjKPe2_OujI5m-zAzfcWY6dOzQXUlqN9fIRSxO_fow1KBmxaYSudTZ_ag5J0YGHfE5NyDAiKo88kZu02LEKIs7vX7-YpAIhujKiuIZaTgsNOir5-rx2E2WiM2ozCYYAcfeiFYyxfOngcE6_Tx7HCaieXyeyOVbYf1Pfz8ry5aegO7v_iIommHbn2LUuXWkF4IgkzymE5RF7WbOhknTU51mDkLaYr64wO2o7IWVRuAoo9mNi55XVan_RHplgzHaw"
  },
  {
    id: 2,
    name: "佐藤 大輔",
    roleBadge: "副",
    pos: "FW",
    number: 9,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAAeKupJcOmpiZThZ7bbSDYhNUK0NgjtIU6sFirZJX3m2mpo1pT64o0IJ2IIOVsgoRuoEitPWWCWqSJuiUDAAzL9i9HjWwisZeVzoDKIjX4AewNdQWqBcHfnNS1bQnGrNmR1UueA7dsewPYUsq_oD5eoy5WPZtTsItIjSgARcxF7l3dB7JI-Sd5DpoulpE_xPGhCaXwP-i6RWSAubbcrdxkBpB-FoQeqqYheO9-Q8t1M3K7r30E96u4D1OsOg2c4Dolsp_miQjFKb2f"
  },
  {
    id: 3,
    name: "鈴木 翔太",
    pos: "GK",
    number: 1,
    gk: true,
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC6Rr28EcnfDdbyqtvjUxbDp1nHdd1ReUTUzZRaUItBCfTeBDQpZ5SP5wpvgwEkBTWjJTXhDk1jqddqNvENpeQ3mrPa3fArWaX9AEVpCnHdsWUEQ1xbLH2scVFeaYRPLgegOofhuErS_tRvsTNWvg0OZhyoe4gStyU4gLW7TaVvY_m8YjA2HRsTUHC_Bxd0CzgfN_bNzdGP9Df7EzD83L9HMirbpAuFS6AV2-BcAync8L4PvW_mcIv7fn66iMlIF1EASKo8RN4z3eUN"
  },
  { id: 4, name: "山田 太郎", pos: "DF", number: 4, initial: "person" },
  { id: 5, name: "高橋 宏", pos: "MF", number: 7, initial: "高", tone: "indigo" },
  { id: 6, name: "伊藤 健二", pos: "FW", number: 11, initial: "伊", tone: "emerald" },
  { id: 7, name: "渡辺 蓮", pos: "DF", number: 3, initial: "渡", tone: "rose" },
  { id: 8, name: "中村 颯", pos: "MF", number: 8, initial: "中", tone: "slate" },
  { id: 9, name: "小林 海", pos: "FW", number: 14, initial: "小", tone: "amber" },
  { id: 10, name: "加藤 誠", pos: "DF", number: 5, initial: "加", tone: "sky" },
  { id: 11, name: "松本 亮", pos: "MF", number: 6, initial: "松", tone: "violet" },
  { id: 12, name: "吉田 駿", pos: "DF", number: 2, initial: "吉", tone: "lime" }
];

function toneClass(tone) {
  if (tone === "indigo") return "tone-indigo";
  if (tone === "emerald") return "tone-emerald";
  if (tone === "rose") return "tone-rose";
  if (tone === "amber") return "tone-amber";
  if (tone === "sky") return "tone-sky";
  if (tone === "violet") return "tone-violet";
  if (tone === "lime") return "tone-lime";
  return "tone-slate";
}

export default function TeamMembers() {
  const navigate = useNavigate();
  const { id: teamId } = useParams();
  const { user } = useAuth();
  const [members, setMembers] = useState(MEMBERS);
  const [keyword, setKeyword] = useState("");
  const [sortType, setSortType] = useState("kana_asc");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [permissionMenuId, setPermissionMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [canDeleteMembers, setCanDeleteMembers] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    if (!teamId || !user?.id) {
      setCanDeleteMembers(false);
      return () => {
        active = false;
      };
    }

    api
      .get(`/teams/${teamId}`)
      .then((data) => {
        if (!active) return;
        setCanDeleteMembers(Number(data?.team?.captain_user_id) === Number(user.id));
      })
      .catch(() => {
        if (!active) return;
        setCanDeleteMembers(false);
      });

    return () => {
      active = false;
    };
  }, [teamId, user?.id]);

  const rows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const filtered = members.filter((m) => {
      if (!q) return true;
      return m.name.toLowerCase().includes(q) || m.pos.toLowerCase().includes(q);
    });

    return filtered.sort((a, b) => {
      if (sortType === "kana_asc") return a.name.localeCompare(b.name, "ja");
      if (sortType === "kana_desc") return b.name.localeCompare(a.name, "ja");
      if (sortType === "number_asc") return a.number - b.number;
      if (sortType === "number_desc") return b.number - a.number;
      if (sortType === "position") return a.pos.localeCompare(b.pos, "en");
      return a.name.localeCompare(b.name, "ja");
    });
  }, [keyword, members, sortType]);

  const sortOptions = [
    { key: "kana_asc", label: "五十音順（あ→わ）" },
    { key: "kana_desc", label: "五十音順（わ→あ）" },
    { key: "number_asc", label: "背番号順（小→大）" },
    { key: "number_desc", label: "背番号順（大→小）" },
    { key: "position", label: "ポジション順" },
  ];

  const setRole = (id, role) => {
    setMembers((prev) =>
      prev.map((m) => {
        if (role === "captain") {
          if (m.id === id) {
            return { ...m, roleLabel: "キャプテン", roleBadge: "CP", featured: true };
          }
          return { ...m, roleLabel: undefined, roleBadge: undefined, featured: false };
        }

        if (m.id !== id) return m;
        if (role === "vice") {
          return { ...m, roleLabel: undefined, roleBadge: "副", featured: false };
        }
        return { ...m, roleLabel: undefined, roleBadge: undefined, featured: false };
      })
    );
    setPermissionMenuId(null);
    setActiveMenuId(null);
  };

  const removeMember = (id) => {
    setMembers((prev) => prev.filter((m) => m.id !== id));
    setPermissionMenuId(null);
    setActiveMenuId(null);
    setDeleteTarget(null);
  };

  const openDeleteDialog = (member) => {
    if (!canDeleteMembers) {
      setMessage("メンバーを削除できるのはチームの代表者のみです。");
      setPermissionMenuId(null);
      setActiveMenuId(null);
      return;
    }
    setDeleteTarget(member);
    setPermissionMenuId(null);
    setActiveMenuId(null);
  };

  return (
    <div className="tml-root">
      <header className="tml-header">
        <div className="left">
          <button type="button" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1>メンバー一覧</h1>
        </div>
        <div className="team-pill">FC 東京セブン</div>
      </header>

      <section className="tml-toolbar">
        <div className="search-wrap">
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="名前やポジションで検索"
          />
        </div>

        <button type="button" className="add-btn">
          <span className="material-symbols-outlined">person_add</span>
          <span>メンバーを追加する</span>
        </button>
      </section>

      <main className="tml-main">
        <div className="tml-meta">
          <span>
            登録メンバー <b>{rows.length}名</b>
          </span>
          <button type="button" onClick={() => setSortMenuOpen((v) => !v)} aria-label="並び替え">
            <span className="material-symbols-outlined">sort</span>
            並び替え
          </button>
        </div>
        {sortMenuOpen ? (
          <div className="tml-sort-menu" role="menu" aria-label="並び替え選択">
            {sortOptions.map((opt) => (
              <button
                key={opt.key}
                type="button"
                className={sortType === opt.key ? "active" : ""}
                onClick={() => {
                  setSortType(opt.key);
                  setSortMenuOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {sortType === opt.key ? (
                  <span className="material-symbols-outlined">check</span>
                ) : null}
              </button>
            ))}
          </div>
        ) : null}
        {message ? <p className="tml-inline-message">{message}</p> : null}

        <div className="tml-list">
          {rows.map((m, index) => (
            <article key={m.id} className={`tml-card ${m.featured ? "featured" : ""}`}>
              <div className="left">
                <div className="avatar-wrap">
                  {m.avatar ? (
                    <img src={m.avatar} alt={m.name} />
                  ) : (
                    <div className={`fallback ${toneClass(m.tone)}`}>
                      {m.initial === "person" ? <span className="material-symbols-outlined">person</span> : m.initial}
                    </div>
                  )}

                  {m.roleBadge ? <span className={`mini-badge ${m.roleBadge === "CP" ? "cp" : "vice"}`}>{m.roleBadge}</span> : null}
                </div>

                <div>
                  <div className="name-row">
                    <strong>{m.name}</strong>
                    {m.roleLabel ? <span className="role-label">{m.roleLabel}</span> : null}
                  </div>
                  <div className="sub-row">
                    <span className={`pos ${m.gk ? "gk" : ""}`}>{m.pos}</span>
                    <span>No. {m.number}</span>
                  </div>
                </div>
              </div>

              <div className="tml-card-actions">
                <button
                  type="button"
                  className="more-btn"
                  aria-label={`${m.name}の操作メニュー`}
                  onClick={() => {
                    setMessage("");
                    setActiveMenuId((prev) => (prev === m.id ? null : m.id));
                    setPermissionMenuId(null);
                  }}
                >
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
                {activeMenuId === m.id ? (
                  <div className={`tml-action-menu ${index >= rows.length - 2 ? "up" : ""}`}>
                    <button
                      type="button"
                      className="edit"
                      onClick={() => {
                        setMessage(`「${m.name}」の編集機能は準備中です。`);
                        setActiveMenuId(null);
                      }}
                    >
                      <span className="material-symbols-outlined">edit</span>
                      編集
                    </button>
                    <button type="button" className="danger" onClick={() => openDeleteDialog(m)}>
                      <span className="material-symbols-outlined">delete</span>
                      削除
                    </button>
                    <button
                      type="button"
                      className="permission"
                      onClick={() => setPermissionMenuId((prev) => (prev === m.id ? null : m.id))}
                    >
                      <span className="material-symbols-outlined">admin_panel_settings</span>
                      権限
                    </button>
                    {permissionMenuId === m.id ? (
                      <div className="tml-permission-menu">
                        <button type="button" onClick={() => setRole(m.id, "captain")}>
                          <span className="material-symbols-outlined">workspace_premium</span>
                          キャプテン
                        </button>
                        <button type="button" onClick={() => setRole(m.id, "vice")}>
                          <span className="material-symbols-outlined">verified</span>
                          副キャプテン
                        </button>
                        <button type="button" onClick={() => setRole(m.id, "member")}>
                          <span className="material-symbols-outlined">person</span>
                          メンバー
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
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

      {deleteTarget ? (
        <div className="tml-delete-overlay">
          <div className="tml-delete-modal">
            <h2>メンバーを削除しますか？</h2>

            <div className="member-preview">
              <div className="avatar-wrap">
                {deleteTarget.avatar ? (
                  <img src={deleteTarget.avatar} alt={deleteTarget.name} />
                ) : (
                  <div className={`fallback ${toneClass(deleteTarget.tone)}`}>
                    {deleteTarget.initial === "person" ? (
                      <span className="material-symbols-outlined">person</span>
                    ) : (
                      deleteTarget.initial
                    )}
                  </div>
                )}
              </div>
              <p className="name">{deleteTarget.name}</p>
              <p className="number">背番号: {deleteTarget.number}</p>
            </div>

            <div className="warning-box">一度削除すると元に戻せません。</div>

            <div className="actions">
              <button type="button" className="danger" onClick={() => removeMember(deleteTarget.id)}>
                削除する
              </button>
              <button type="button" className="cancel" onClick={() => setDeleteTarget(null)}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
