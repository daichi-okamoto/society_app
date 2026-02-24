import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import AdminTeamsBottomNav from "../../components/admin/teams/AdminTeamsBottomNav";
import TeamListCard from "../../components/admin/teams/TeamListCard";
import TeamSortDropdown from "../../components/admin/teams/TeamSortDropdown";
import TeamSummaryCards from "../../components/admin/teams/TeamSummaryCards";

const PAGE_SIZE = 10;

function sortToParam(sort) {
  if (sort === "oldest") return "created_asc";
  if (sort === "members") return "members_desc";
  return "created_desc";
}

export default function AdminTeams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("latest");
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({ total_teams: 0, pending_teams: 0 });

  useEffect(() => {
    let active = true;
    setLoading(true);
    const query = new URLSearchParams({
      limit: String(PAGE_SIZE),
      offset: "0",
      sort: sortToParam(sort),
    });
    if (search.trim()) query.set("q", search.trim());

    api
      .get(`/teams?${query.toString()}`)
      .then((res) => {
        if (!active) return;
        setTeams(res?.teams || []);
        setTotalCount(Number(res?.meta?.total_count || 0));
        setSummary({
          total_teams: Number(res?.summary?.total_teams || 0),
          pending_teams: Number(res?.summary?.pending_teams || 0),
        });
      })
      .catch(() => {
        if (!active) return;
        setTeams([]);
        setTotalCount(0);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [search, sort]);

  const hasMore = teams.length < totalCount;

  const cards = useMemo(() => teams, [teams]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const query = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(teams.length),
        sort: sortToParam(sort),
      });
      if (search.trim()) query.set("q", search.trim());
      const res = await api.get(`/teams?${query.toString()}`);
      setTeams((prev) => [...prev, ...(res?.teams || [])]);
      setTotalCount(Number(res?.meta?.total_count || totalCount));
    } catch {
      // no-op
    } finally {
      setLoadingMore(false);
    }
  };

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
        <TeamSummaryCards
          totalCount={summary.total_teams}
          pendingCount={summary.pending_teams}
          onPendingClick={() => navigate("/admin/teams/pending")}
        />

        <section className="adteam-list-section">
          <div className="adteam-list-head">
            <h3>チーム一覧</h3>
            <TeamSortDropdown value={sort} onChange={setSort} />
          </div>

          <div className="adteam-list">
            {loading ? <p className="adteam-empty">読み込み中...</p> : null}
            {!loading && cards.length === 0 ? <p className="adteam-empty">表示できるチームがありません。</p> : null}
            {cards.map((team) => (
              <TeamListCard key={team.id} team={team} />
            ))}
          </div>

          {!loading && cards.length > 0 && hasMore ? (
            <button type="button" className="adteam-all-btn" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "読み込み中..." : `他のチームを表示 (${totalCount - cards.length}件)`}
            </button>
          ) : null}
        </section>
      </main>

      <AdminTeamsBottomNav />
    </div>
  );
}
