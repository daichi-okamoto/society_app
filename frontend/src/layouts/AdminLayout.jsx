import { Link, useLocation } from "react-router-dom";
import AnimatedOutlet from "../components/AnimatedOutlet";

export default function AdminLayout() {
  const location = useLocation();
  const isDashboard = /^\/admin\/?$/.test(location.pathname);

  if (isDashboard) {
    return (
      <div className="route-slide-host">
        <AnimatedOutlet />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">Society Admin</div>
        <nav className="nav">
          <Link to="/admin">ダッシュボード</Link>
          <Link to="/admin/tournaments">大会</Link>
          <Link to="/admin/entries">申込</Link>
          <Link to="/admin/matches">試合</Link>
          <Link to="/admin/notifications">通知</Link>
        </nav>
      </header>
      <main className="app-main">
        <div className="route-slide-host">
          <AnimatedOutlet />
        </div>
      </main>
    </div>
  );
}
