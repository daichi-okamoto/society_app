import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import AdminTeamsBottomNav from "../../components/admin/teams/AdminTeamsBottomNav";
import { initials } from "../../components/admin/teams/teamCardUtils";

export default function AdminPendingTeams() {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/teams?status=pending&sort=created_desc")
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

  return (
    <div className="adpending-root">
      <header className="adpending-header">
        <div className="adpending-header-row">
          <Link to="/admin/teams" className="adpending-back" aria-label="back">
            <span className="material-symbols-outlined">chevron_left</span>
          </Link>
          <h1>承認待ちチーム</h1>
          <div />
        </div>
      </header>

      <main className="adpending-main">
        {loading ? <p className="adpending-empty">読み込み中...</p> : null}
        {!loading && teams.length === 0 ? <p className="adpending-empty">承認待ちチームはありません。</p> : null}

        <div className="adpending-list">
          {teams.map((team) => (
            <Link key={team.id} to={`/admin/teams/pending/${team.id}`} className="adpending-card">
              <div className="adpending-avatar">{initials(team.name)}</div>
              <div className="adpending-copy">
                <span className="adpending-chip">承認待ち</span>
                <h3>{team.name}</h3>
                <p>
                  {team.captain_name || "未設定"} ・ {team.captain_address || "住所未設定"}
                </p>
              </div>
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          ))}
        </div>
      </main>

      <AdminTeamsBottomNav />
    </div>
  );
}
