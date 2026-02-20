import { Link, useLocation } from "react-router-dom";
import AnimatedOutlet from "../components/AnimatedOutlet";
import FlashMessage from "../components/FlashMessage";

export default function AdminLayout() {
  const location = useLocation();
  const isDashboard = /^\/admin\/?$/.test(location.pathname);
  const isTournaments = /^\/admin\/tournaments\/?$/.test(location.pathname);
  const isTournamentCreate = /^\/admin\/tournaments\/new\/?$/.test(location.pathname);
  const isTournamentDetail = /^\/admin\/tournaments\/[^/]+\/?$/.test(location.pathname);
  const isNotifications = /^\/admin\/notifications\/?$/.test(location.pathname);
  const isPayments = /^\/admin\/payments\/?$/.test(location.pathname);
  const isTeams = /^\/admin\/teams\/?$/.test(location.pathname);

  if (isDashboard || isTournaments || isTournamentCreate || isTournamentDetail || isNotifications || isPayments || isTeams) {
    return (
      <>
        <FlashMessage />
        <div className="route-slide-host">
          <AnimatedOutlet />
        </div>
      </>
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
      <FlashMessage />
      <main className="app-main">
        <div className="route-slide-host">
          <AnimatedOutlet />
        </div>
      </main>
    </div>
  );
}
