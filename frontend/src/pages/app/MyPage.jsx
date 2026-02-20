import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import LoadingScreen from "../../components/LoadingScreen";

const ACTIVE_ENTRY_STATUSES = new Set(["approved", "pending"]);

export default function MyPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);
  const [teams, setTeams] = useState([]);
  const [appearanceCount, setAppearanceCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadPageData() {
      try {
        const [teamsData, tournamentsData] = await Promise.all([api.get("/teams"), api.get("/tournaments")]);
        if (!active) return;

        const memberTeams = (teamsData?.teams || []).filter((team) => team?.is_member);
        setTeams(memberTeams);

        const tournaments = tournamentsData?.tournaments || [];
        const entryResults = await Promise.allSettled(
          tournaments.map((tournament) => api.get(`/tournaments/${tournament.id}/entries/me`))
        );
        if (!active) return;

        const joinedCount = entryResults.reduce((count, result) => {
          if (result.status !== "fulfilled") return count;
          const status = result.value?.entry?.status;
          return ACTIVE_ENTRY_STATUSES.has(status) ? count + 1 : count;
        }, 0);
        setAppearanceCount(joinedCount);
      } catch {
        if (!active) return;
        setTeams([]);
        setAppearanceCount(0);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    loadPageData();
    return () => {
      active = false;
    };
  }, []);

  const displayName = user?.name || "ユーザー";
  const teamName = useMemo(() => {
    if (teams.length > 0) return teams[0].name;
    return "未所属";
  }, [teams]);
  const avatarUrl =
    user?.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=fef3c7&color=b45309&size=256`;

  async function handleLogout() {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await api.post("/auth/logout");
    } catch {
      // ignore and continue local sign out
    }
    setUser(null);
    navigate("/login", {
      replace: true,
      state: { flash: { type: "info", message: "ログアウトしました。" } },
    });
  }

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="mp-root">
      <header className="mp-header">
        <div className="mp-avatar-wrap">
          <div className="mp-avatar">
            <img src={avatarUrl} alt={displayName} />
          </div>
          <button type="button" className="mp-camera" aria-label="写真を変更">
            <span className="material-symbols-outlined">photo_camera</span>
          </button>
        </div>

        <h1>{displayName}</h1>
        <p>{teamName}</p>

        <button type="button" className="mp-edit-btn" onClick={() => navigate("/me/edit")}>
          プロフィールを編集
        </button>
      </header>

      <main className="mp-main">
        <section className="mp-section">
          <div className="mp-stat-card">
            <div className="left">
              <span className="material-symbols-outlined">emoji_events</span>
              <span>出場大会数</span>
            </div>
            <div className="right">
              <strong>{appearanceCount}</strong>
              <small>大会</small>
            </div>
          </div>

          <div className="mp-divider" />

          <Link to="/teams" className="mp-link-card">
            <div className="left">
              <span className="material-symbols-outlined">groups</span>
              <span>マイチーム設定</span>
            </div>
            <span className="material-symbols-outlined chevron">chevron_right</span>
          </Link>

          <Link to="/notifications" className="mp-link-card">
            <div className="left">
              <span className="material-symbols-outlined">notifications_active</span>
              <span>通知設定</span>
            </div>
            <span className="material-symbols-outlined chevron">chevron_right</span>
          </Link>

          <Link to="/payments" className="mp-link-card">
            <div className="left">
              <span className="material-symbols-outlined">credit_card</span>
              <span>お支払い情報</span>
            </div>
            <span className="material-symbols-outlined chevron">chevron_right</span>
          </Link>

          <Link to="/help" className="mp-link-card">
            <div className="left">
              <span className="material-symbols-outlined">help_center</span>
              <span>ヘルプ・お問い合わせ</span>
            </div>
            <span className="material-symbols-outlined chevron">chevron_right</span>
          </Link>

          <button type="button" className="mp-logout" onClick={handleLogout} disabled={loggingOut}>
            <div className="left">
              <span className="material-symbols-outlined">logout</span>
              <span>ログアウト</span>
            </div>
          </button>
        </section>
      </main>

      <nav className="mp-nav">
        <div className="mp-nav-row">
          <Link to="/app/home" className="mp-nav-item">
            <span className="material-symbols-outlined">home</span>
            <span>ホーム</span>
          </Link>
          <Link to="/tournaments" className="mp-nav-item">
            <span className="material-symbols-outlined">search</span>
            <span>さがす</span>
          </Link>
          <div className="mp-nav-center">
            <button type="button" aria-label="フットサル">
              <span className="material-symbols-outlined">sports_soccer</span>
            </button>
          </div>
          <Link to="/teams" className="mp-nav-item">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/me" className="mp-nav-item active">
            <span className="material-symbols-outlined">person</span>
            <span>マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
