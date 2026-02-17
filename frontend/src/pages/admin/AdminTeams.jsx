import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";

const sortOptions = {
  latest: "最新順",
  oldest: "古い順",
  members: "メンバー数順",
};

function cardMeta(team) {
  if (team.status === "pending") {
    return {
      chip: "承認待ち",
      chipClass: "is-pending",
      sub: team.created_at ? new Date(team.created_at).toLocaleDateString("ja-JP") : "-",
    };
  }
  if (team.status === "suspended") {
    return {
      chip: "利用停止中",
      chipClass: "is-suspended",
      sub: `ID: TM-${String(team.id).padStart(5, "0")}`,
    };
  }
  return {
    chip: "承認済み",
    chipClass: "is-approved",
    sub: `ID: TM-${String(team.id).padStart(5, "0")}`,
  };
}

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "TM";
  return s.slice(0, 2).toUpperCase();
}

export default function AdminTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const sortMenuRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/teams")
      .then((res) => {
        if (!active) return;
        setTeams(res?.teams || []);
      })
      .catch(() => {
        if (!active) return;
        setTeams([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!sortMenuOpen) return undefined;
    const onClickOutside = (event) => {
      if (!sortMenuRef.current?.contains(event.target)) {
        setSortMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [sortMenuOpen]);

  const totalCount = teams.length;
  const pendingCount = teams.filter((t) => t.status === "pending").length;

  const cards = useMemo(() => {
    const q = search.trim().toLowerCase();
    let filtered = teams.filter((t) => {
      if (!q) return true;
      return [t.name, t.captain_name, t.captain_address]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });

    if (sort === "members") {
      filtered = [...filtered].sort((a, b) => Number(b.member_count || 0) - Number(a.member_count || 0));
    } else if (sort === "oldest") {
      filtered = [...filtered].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else {
      filtered = [...filtered].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    }

    return filtered;
  }, [teams, search, sort]);

  return (
    <div className="adteam-root">
      <header className="adteam-header">
        <div className="adteam-header-row">
          <div>
            <p>Admin Management</p>
            <h1>チーム管理</h1>
          </div>
          <button type="button" className="adteam-settings-btn" aria-label="settings">
            <span className="material-symbols-outlined">settings</span>
          </button>
        </div>

        <div className="adteam-search-row">
          <div className="adteam-search-wrap">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="チーム名、代表者、地域で検索..."
            />
          </div>
          <button type="button" className="adteam-add-btn" aria-label="create team">
            <span className="material-symbols-outlined">add</span>
          </button>
        </div>
      </header>

      <main className="adteam-main">
        <section className="adteam-summary-grid">
          <article className="adteam-summary-card">
            <span>
              <span className="material-symbols-outlined">groups</span>
              総チーム数
            </span>
            <div>
              <strong>{totalCount}</strong>
              <small>団体</small>
            </div>
          </article>

          <button type="button" className="adteam-summary-card adteam-pending-card">
            <span>
              <span className="material-symbols-outlined">pending_actions</span>
              承認待ち
            </span>
            <div>
              <strong>{pendingCount}</strong>
              <small>件</small>
            </div>
          </button>
        </section>

        <section className="adteam-list-section">
          <div className="adteam-list-head">
            <h3>チーム一覧</h3>
            <div className="adteam-sort" ref={sortMenuRef}>
              <button type="button" onClick={() => setSortMenuOpen((prev) => !prev)} aria-expanded={sortMenuOpen}>
                {sortOptions[sort]}
                <span className="material-symbols-outlined">expand_more</span>
              </button>
              {sortMenuOpen ? (
                <div className="adteam-sort-menu">
                  {Object.entries(sortOptions).map(([key, label]) => (
                    <button
                      key={key}
                      type="button"
                      className={sort === key ? "active" : ""}
                      onClick={() => {
                        setSort(key);
                        setSortMenuOpen(false);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="adteam-list">
            {loading ? <p className="adteam-empty">読み込み中...</p> : null}
            {!loading && cards.length === 0 ? <p className="adteam-empty">表示できるチームがありません。</p> : null}
            {cards.map((team) => {
              const meta = cardMeta(team);
              const disabled = team.status === "suspended";
              return (
                <article key={team.id} className={`adteam-card ${disabled ? "is-disabled" : ""}`}>
                  <div className="adteam-card-top">
                    <span className={`adteam-chip ${meta.chipClass}`}>{meta.chip}</span>
                    <span>{meta.sub}</span>
                  </div>

                  <div className="adteam-card-main">
                    <div className={`adteam-avatar ${disabled ? "is-disabled" : ""}`}>{initials(team.name)}</div>
                    <div className="adteam-card-copy">
                      <h4>{team.name}</h4>
                      <p>
                        <span className="material-symbols-outlined">person</span>
                        {team.captain_name || "未設定"} <small>代表者</small>
                      </p>
                    </div>
                    <span className="material-symbols-outlined adteam-right">chevron_right</span>
                  </div>

                  {disabled ? (
                    <div className="adteam-suspended-text">
                      <span className="material-symbols-outlined">warning</span>
                      規約違反による停止
                    </div>
                  ) : (
                    <div className="adteam-card-foot">
                      <div>
                        <span className="material-symbols-outlined">group</span>
                        <strong>
                          {team.member_count || 0} <small>メンバー</small>
                        </strong>
                      </div>
                      <div>
                        <span className="material-symbols-outlined">location_on</span>
                        <strong>{team.captain_address || "住所未設定"}</strong>
                      </div>
                    </div>
                  )}
                </article>
              );
            })}
          </div>

          {!loading && cards.length > 0 ? (
            <button type="button" className="adteam-all-btn">
              全チームを表示 ({cards.length}件)
            </button>
          ) : null}
        </section>
      </main>

      <nav className="adteam-nav">
        <div className="adteam-nav-row">
          <Link to="/admin" className="adteam-nav-item">
            <span className="material-symbols-outlined">dashboard</span>
            <span>ダッシュ</span>
          </Link>
          <Link to="/admin/tournaments" className="adteam-nav-item">
            <span className="material-symbols-outlined">emoji_events</span>
            <span>大会</span>
          </Link>
          <Link to="/admin/teams" className="adteam-nav-item active">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
            <i />
          </Link>
          <Link to="/admin/payments" className="adteam-nav-item">
            <span className="material-symbols-outlined">payments</span>
            <span>決済</span>
          </Link>
          <Link to="/admin/notifications" className="adteam-nav-item">
            <span className="material-symbols-outlined">notifications</span>
            <span>通知</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
