import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import { applyOverridesToMember, loadMemberOverrides } from "../../lib/teamMembersStorage";

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

function toMemberRow(member, overrides) {
  const patched = applyOverridesToMember(
    {
      id: member.id,
      name: member.name,
      pos: "",
      number: 0,
    },
    overrides
  );

  return {
    id: member.id,
    user_id: member.user_id,
    team_member_id: member.id,
    name: member.name || "メンバー",
    furigana: "",
    roleLabel: member.role === "captain" ? "キャプテン" : undefined,
    roleBadge: member.role === "captain" ? "CP" : undefined,
    pos: patched.pos || "--",
    number: Number(patched.number) || 0,
    featured: member.role === "captain",
    source: "invited",
    tone: "slate",
    initial: (member.name || "メ").slice(0, 1),
    avatar:
      member.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || "Member")}&background=e2e8f0&color=334155&size=128`,
  };
}

export default function TeamMembers() {
  const navigate = useNavigate();
  const { id: teamId } = useParams();
  const { user } = useAuth();
  const [members, setMembers] = useState([]);
  const [teamName, setTeamName] = useState("チーム");
  const [keyword, setKeyword] = useState("");
  const [sortType, setSortType] = useState("kana_asc");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [permissionMenuId, setPermissionMenuId] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [canDeleteMembers, setCanDeleteMembers] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadTeamMembers() {
    if (!teamId) return;

    const data = await api.get(`/teams/${teamId}`);
    const detail = data?.team || null;
    const overrides = loadMemberOverrides(teamId);
    const apiMembers = Array.isArray(detail?.members)
      ? detail.members.map((member) => toMemberRow(member, overrides))
      : [];
    const manualMembers = Array.isArray(detail?.manual_members)
      ? detail.manual_members.map((m) => ({
          id: m.id,
          user_id: null,
          team_member_id: null,
          name: m.name || "メンバー",
          furigana: m.name_kana || "",
          roleLabel: undefined,
          roleBadge: undefined,
          pos: m.position || "MF",
          number: Number(m.jersey_number || 0),
          featured: false,
          source: "manual",
          tone: "amber",
          initial: (m.name || "メ").slice(0, 1),
          avatar:
            m.avatar_data_url ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name || "Guest")}&background=fef3c7&color=b45309&size=128`,
          phone: m.phone || "",
          postal_code: m.postal_code || "",
          prefecture: m.prefecture || "",
          city_block: m.city_block || "",
          building: m.building || "",
        }))
      : [];

    setTeamName(detail?.name || "チーム");
    setCanDeleteMembers(Number(detail?.captain_user_id) === Number(user?.id));
    setMembers([...apiMembers, ...manualMembers]);
  }

  useEffect(() => {
    let active = true;

    setLoading(true);
    loadTeamMembers()
      .catch(() => {
        if (!active) return;
        setMessage("メンバー情報の取得に失敗しました。");
        setMembers([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [teamId, user?.id]);

  const rows = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    const filtered = members.filter((m) => {
      if (!q) return true;
      return (m.name || "").toLowerCase().includes(q) || (m.pos || "").toLowerCase().includes(q);
    });

    return filtered.sort((a, b) => {
      if (sortType === "kana_asc") return (a.name || "").localeCompare(b.name || "", "ja");
      if (sortType === "kana_desc") return (b.name || "").localeCompare(a.name || "", "ja");
      if (sortType === "number_asc") return (a.number || 0) - (b.number || 0);
      if (sortType === "number_desc") return (b.number || 0) - (a.number || 0);
      if (sortType === "position") return (a.pos || "").localeCompare(b.pos || "", "en");
      return (a.name || "").localeCompare(b.name || "", "ja");
    });
  }, [keyword, members, sortType]);

  const sortOptions = [
    { key: "kana_asc", label: "五十音順（あ→わ）" },
    { key: "kana_desc", label: "五十音順（わ→あ）" },
    { key: "number_asc", label: "背番号順（小→大）" },
    { key: "number_desc", label: "背番号順（大→小）" },
    { key: "position", label: "ポジション順" },
  ];

  async function setRole(memberKey, role) {
    const target = members.find((m) => `${m.source}-${m.id}` === memberKey);
    if (!target) return;

    if (role === "captain") {
      if (!canDeleteMembers) {
        setMessage("権限変更ができるのは代表者のみです。");
        return;
      }
      if (!target.user_id) {
        setMessage("手動追加メンバーには代表権限を付与できません。");
        return;
      }
      try {
        await api.post(`/teams/${teamId}/transfer_captain`, { new_captain_user_id: target.user_id });
        await loadTeamMembers();
        setMessage("代表権限を更新しました。");
      } catch {
        setMessage("権限更新に失敗しました。");
      }
      setPermissionMenuId(null);
      setActiveMenuId(null);
      return;
    }

    setMembers((prev) =>
      prev.map((m) => {
        if (`${m.source}-${m.id}` !== memberKey) return m;
        if (role === "vice") {
          return { ...m, roleLabel: undefined, roleBadge: "副", featured: false };
        }
        return { ...m, roleLabel: undefined, roleBadge: undefined, featured: false };
      })
    );
    setPermissionMenuId(null);
    setActiveMenuId(null);
  }

  async function removeMember(id) {
    const target = members.find((m) => String(m.id) === String(id));
    if (!target) return;
    if (Number(target.user_id) === Number(user?.id)) {
      setMessage("自分自身は削除できません。");
      setPermissionMenuId(null);
      setActiveMenuId(null);
      setDeleteTarget(null);
      return;
    }

    try {
      if (target.source === "manual") {
        await api.del(`/teams/${teamId}/manual_members/${target.id}`);
      } else if (target.team_member_id) {
        if (!canDeleteMembers) {
          setMessage("メンバーを削除できるのはチームの代表者のみです。");
          return;
        }
        await api.del(`/team_members/${target.team_member_id}`);
      }

      await loadTeamMembers();
      setMessage("メンバーを削除しました。");
    } catch {
      setMessage("メンバー削除に失敗しました。");
    } finally {
      setPermissionMenuId(null);
      setActiveMenuId(null);
      setDeleteTarget(null);
    }
  }

  const openDeleteDialog = (member) => {
    if (Number(member?.user_id) === Number(user?.id)) {
      setMessage("自分自身は削除できません。");
      setPermissionMenuId(null);
      setActiveMenuId(null);
      return;
    }
    if (!canDeleteMembers && member.source !== "manual") {
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
        <div className="team-pill">{teamName}</div>
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

        <button type="button" className="add-btn" onClick={() => navigate(`/teams/${teamId}/members/manual-add`)}>
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
                {sortType === opt.key ? <span className="material-symbols-outlined">check</span> : null}
              </button>
            ))}
          </div>
        ) : null}
        {message ? <p className="tml-inline-message">{message}</p> : null}

        <div className="tml-list">
          {!loading && rows.length === 0 ? <p className="tml-inline-message">メンバーがいません。</p> : null}
          {rows.map((m, index) => {
            const memberKey = `${m.source}-${m.id}`;
            const isSelf = Number(m.user_id) === Number(user?.id);
            const shouldOpenUp = rows.length > 3 && index >= rows.length - 2;
            return (
            <article key={`${m.source}-${m.id}`} className={`tml-card ${m.featured ? "featured" : ""}`}>
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
                    <span>No. {m.number || "-"}</span>
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
                    setActiveMenuId((prev) => (prev === memberKey ? null : memberKey));
                    setPermissionMenuId(null);
                  }}
                >
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
                {activeMenuId === memberKey ? (
                  <div className={`tml-action-menu ${shouldOpenUp ? "up" : ""}`}>
                    <button
                      type="button"
                      className="edit"
                      onClick={() => {
                        if (isSelf) {
                          navigate("/me/edit");
                        } else {
                          navigate(`/teams/${teamId}/members/${encodeURIComponent(String(m.id))}/edit`, {
                            state: { member: m },
                          });
                        }
                        setActiveMenuId(null);
                      }}
                    >
                      <span className="material-symbols-outlined">edit</span>
                      編集
                    </button>
                    {!isSelf ? (
                      <button type="button" className="danger" onClick={() => openDeleteDialog(m)}>
                        <span className="material-symbols-outlined">delete</span>
                        削除
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="permission"
                      onClick={() => setPermissionMenuId((prev) => (prev === memberKey ? null : memberKey))}
                    >
                      <span className="material-symbols-outlined">admin_panel_settings</span>
                      権限
                    </button>
                    {permissionMenuId === memberKey ? (
                      <div className="tml-permission-menu">
                        <button type="button" onClick={() => setRole(memberKey, "captain")}>
                          <span className="material-symbols-outlined">workspace_premium</span>
                          キャプテン
                        </button>
                        <button type="button" onClick={() => setRole(memberKey, "vice")}>
                          <span className="material-symbols-outlined">verified</span>
                          副キャプテン
                        </button>
                        <button type="button" onClick={() => setRole(memberKey, "member")}>
                          <span className="material-symbols-outlined">person</span>
                          メンバー
                        </button>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </article>
            );
          })}
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
              <p className="number">背番号: {deleteTarget.number || "-"}</p>
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
