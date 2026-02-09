import { Link, Outlet } from "react-router-dom";

export default function PublicLayout() {
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
        <Outlet />
      </main>
    </div>
  );
}
