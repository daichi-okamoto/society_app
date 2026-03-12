import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
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

  if (loading) return <LoadingScreen />;
  if (error) return <section className="public-home-shell">{error}</section>;

  return (
    <div className="public-home-shell">
      <section className="public-home-hero">
        <p className="public-home-eyebrow">Takmori Society</p>
        <h1>高森ソサイチ</h1>
        <p className="public-home-lead">
          高森のソサイチ大会を探して、そのままエントリーできる運営プラットフォームです。
        </p>
        <div className="public-home-actions">
          <Link to="/login" className="public-home-button primary">
            ログイン
          </Link>
          <Link to="/register" className="public-home-button secondary">
            新規登録
          </Link>
        </div>
      </section>

      <section className="public-home-section">
        <div className="public-home-section-header">
          <h2>公開中の大会</h2>
          <Link to="/login">すべて見る</Link>
        </div>

        {tournaments.length === 0 ? (
          <p className="public-home-empty">現在公開中の大会はありません。</p>
        ) : (
          <ul className="public-home-list">
            {tournaments.slice(0, 6).map((t) => (
              <li key={t.id} className="public-home-card">
                <p className="public-home-card-title">{t.name}</p>
                <p>{t.event_date}</p>
                <p>{t.venue}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <footer className="public-home-footer">
        <Link to="/policies?tab=privacy">プライバシーポリシー</Link>
        <Link to="/policies?tab=terms">利用規約</Link>
      </footer>
    </div>
  );
}
