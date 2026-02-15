import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";

const FILTERS = [
  { key: "all", label: "すべて" },
  { key: "open", label: "募集中" },
  { key: "weekend", label: "週末開催" },
  { key: "night", label: "平日夜間" },
  { key: "beginner", label: "初心者歓迎" },
];

const CARD_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCX9N6okYrlSA1JKbjKPe2_OujI5m-zAzfcWY6dOzQXUlqN9fIRSxO_fow1KBmxaYSudTZ_ag5J0YGHfE5NyDAiKo88kZu02LEKIs7vX7-YpAIhujKiuIZaTgsNOir5-rx2E2WiM2ozCYYAcfeiFYyxfOngcE6_Tx7HCaieXyeyOVbYf1Pfz8ry5aegO7v_iIommHbn2LUuXWkF4IgkzymE5RF7WbOhknTU51mDkLaYr64wO2o7IWVRuAoo9mNi55XVan_RHplgzHaw",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAAeKupJcOmpiZThZ7bbSDYhNUK0NgjtIU6sFirZJX3m2mpo1pT64o0IJ2IIOVsgoRuoEitPWWCWqSJuiUDAAzL9i9HjWwisZeVzoDKIjX4AewNdQWqBcHfnNS1bQnGrNmR1UueA7dsewPYUsq_oD5eoy5WPZtTsItIjSgARcxF7l3dB7JI-Sd5DpoulpE_xPGhCaXwP-i6RWSAubbcrdxkBpB-FoQeqqYheO9-Q8t1M3K7r30E96u4D1OsOg2c4Dolsp_miQjFKb2f",
];

function formatDateAndTime(date, name) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "-";
  const jp = d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
  const isNight = /夜|ナイト|midnight/i.test(name || "");
  return `${jp} ${isNight ? "20:00〜" : "10:00〜"}`;
}

function isWeekend(date) {
  const d = new Date(`${date}T00:00:00`);
  const day = d.getDay();
  return day === 0 || day === 6;
}

function isUpcoming(date) {
  const d = new Date(`${date}T00:00:00`);
  if (Number.isNaN(d.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return d >= today;
}

function statusLabel(date, index) {
  if (!isUpcoming(date)) return "開催終了";
  if (index % 3 === 2) return "残りわずか";
  return "募集中";
}

export default function Tournaments() {
  const [tournaments, setTournaments] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get("/tournaments")
      .then((data) => {
        if (!active) return;
        setTournaments(data?.tournaments || []);
      })
      .catch(() => {
        if (!active) return;
        setError("大会一覧の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase();
    return tournaments
      .filter((t) => {
        if (!q) return true;
        return [t.name, t.venue].some((v) => (v || "").toLowerCase().includes(q));
      })
      .filter((t) => {
        if (activeFilter === "all") return true;
        if (activeFilter === "open") return isUpcoming(t.event_date);
        if (activeFilter === "weekend") return isWeekend(t.event_date);
        if (activeFilter === "night") return /夜|ナイト|midnight/i.test(`${t.name} ${t.venue}`);
        if (activeFilter === "beginner") return /初心者|ビギナー/i.test(`${t.name}`);
        return true;
      });
  }, [activeFilter, keyword, tournaments]);

  if (loading) return <LoadingScreen />;
  if (error) return <section>{error}</section>;

  return (
    <div className="tsrch-root">
      <header className="tsrch-header">
        <div className="tsrch-head-inner">
          <h1>大会をさがす</h1>
          <div className="tsrch-search-wrap">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              placeholder="大会名・エリア・会場で検索"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
        </div>
        <div className="tsrch-filters" role="tablist" aria-label="大会フィルター">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={activeFilter === item.key ? "active" : ""}
              onClick={() => setActiveFilter(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      <main className="tsrch-main">
        {filtered.length === 0 ? (
          <p className="tsrch-empty">条件に合う大会はありません。</p>
        ) : (
          <div className="tsrch-list">
            {filtered.map((tournament, index) => {
              const status = statusLabel(tournament.event_date, index);
              return (
                <Link key={tournament.id} to={`/tournaments/${tournament.id}`} className="tsrch-card">
                  <div className={`tsrch-card-image ${status === "残りわずか" ? "few" : ""}`}>
                    <img
                      src={CARD_IMAGES[index % CARD_IMAGES.length]}
                      alt="Tournament Venue"
                      loading="lazy"
                    />
                    <span className={`tsrch-status ${status === "残りわずか" ? "few" : ""}`}>{status}</span>
                  </div>
                  <div className="tsrch-card-body">
                    <h3>{tournament.name}</h3>
                    <div className="tsrch-meta">
                      <p>
                        <span className="material-symbols-outlined">calendar_today</span>
                        <span>{formatDateAndTime(tournament.event_date, tournament.name)}</span>
                      </p>
                      <p>
                        <span className="material-symbols-outlined">location_on</span>
                        <span>{tournament.venue}</span>
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <nav className="tsrch-nav">
        <div className="tsrch-nav-row">
          <Link to="/app/home" className="tsrch-nav-item">
            <span className="material-symbols-outlined">home</span>
            <span>ホーム</span>
          </Link>
          <Link to="/tournaments" className="tsrch-nav-item active">
            <span className="material-symbols-outlined">search</span>
            <span>さがす</span>
          </Link>
          <div className="tsrch-nav-center">
            <button type="button">
              <span className="material-symbols-outlined">sports_soccer</span>
            </button>
          </div>
          <Link to="/teams" className="tsrch-nav-item">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/me" className="tsrch-nav-item">
            <span className="material-symbols-outlined">person</span>
            <span>マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
