import { Link } from "react-router-dom";

export default function AdminTeamsBottomNav() {
  return (
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
  );
}
