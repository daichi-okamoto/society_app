import { Link, useLocation } from "react-router-dom";
import AnimatedOutlet from "../components/AnimatedOutlet";

export default function PublicLayout() {
  const location = useLocation();
  const hideHeader =
    location.pathname === "/login" ||
    location.pathname === "/register" ||
    /^\/tournaments\/[^/]+(?:\/results)?$/.test(location.pathname);

  if (hideHeader) {
    return (
      <div className="route-slide-host">
        <AnimatedOutlet />
      </div>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">Society App</div>
        <nav className="nav">
          <Link to="/">大会一覧</Link>
          <Link to="/announcements">お知らせ</Link>
          <Link to="/login">ログイン</Link>
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
