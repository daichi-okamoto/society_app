import { NavLink } from "react-router-dom";

const navItems = [
  { key: "dashboard", to: "/admin", label: "ダッシュ", icon: "dashboard", end: true },
  { key: "tournaments", to: "/admin/tournaments", label: "大会", icon: "emoji_events" },
  { key: "teams", to: "/admin/teams", label: "チーム", icon: "groups" },
  { key: "payments", to: "/admin/payments", label: "決済", icon: "payments" },
  { key: "notifications", to: "/admin/notifications", label: "通知", icon: "notifications" },
];

export default function AdminBottomNav({ showNotificationDot = false }) {
  return (
    <nav className="admin-bottom-nav" aria-label="管理メニュー">
      <div className="admin-bottom-nav__inner">
        {navItems.map((item) => (
          <NavLink
            key={item.key}
            to={item.to}
            end={item.end}
            className={({ isActive }) => `admin-bottom-nav__item${isActive ? " is-active" : ""}`}
          >
            {item.key === "notifications" && showNotificationDot ? <span className="admin-bottom-nav__dot" /> : null}
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
