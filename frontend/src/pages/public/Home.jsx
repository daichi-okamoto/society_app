import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LoadingScreen from "../../components/LoadingScreen";
import { api } from "../../lib/api";
import { formatPublicDate, splitPublicTournaments } from "../../lib/publicTournaments";
import { getTournamentCoverUrl } from "../../lib/tournamentImages";

const HERO_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuDr58PzcIuA5UMn6EYIBMuVtyBERyqhTUBblG3Xn_8GDI_7VSpntWJIbroPvzW9RBv6_rc-OqBQhk1hs3c_mLODjxOuGfXjn6i6egcGZaq1h9tI5ZFpg6wcxbQksFhz_p9fnRv-CmHJ4oaBRrECHBAScqAME8IrTS7-SdKPJnKYvdXDW-iyo634KFaNrqBRQU_n6Xl8w4tIDMomMVIajaAGGHOwkgV1Sf1QOHWcXr1JkQYQJW_khuO83CE5tQymIN5Y4IbObd1XP0Fb";

function PastTournamentCard({ tournament }) {
  return (
    <Link to={`/tournaments/${tournament.id}/results`} className="marketing-past-card">
      <div
        className="marketing-past-card-image"
        style={{ backgroundImage: `url(${getTournamentCoverUrl(tournament)})` }}
        aria-hidden="true"
      >
        <div className="marketing-past-card-overlay" />
      </div>
      <div className="marketing-past-card-copy">
        <p>{tournament.name}</p>
        <span>
          <span className="material-symbols-outlined" aria-hidden="true">event</span>
          {formatPublicDate(tournament.event_date)}
        </span>
      </div>
    </Link>
  );
}

export default function Home() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visiblePastCount, setVisiblePastCount] = useState(3);

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
        setError("公開情報の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const { past } = useMemo(() => splitPublicTournaments(tournaments), [tournaments]);
  const pastTournaments = past.slice(0, visiblePastCount);

  useEffect(() => {
    setVisiblePastCount(3);
  }, [past.length]);

  if (loading) return <LoadingScreen />;
  if (error) {
    return (
      <section className="marketing-home-shell">
        <div className="marketing-mobile-frame"><div className="marketing-home-error">{error}</div></div>
      </section>
    );
  }

  return (
    <div className="marketing-home-shell">
      <div className="marketing-mobile-frame">
        <section className="marketing-hero" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
        <div className="marketing-hero-overlay" />
        <div className="marketing-hero-content">
          <div className="marketing-hero-copy">
            <div className="marketing-hero-brand">
              <div className="marketing-hero-brand-mark">
                <img src="/ts-brand-logo.png" alt="高森ソサイチ大会" />
              </div>
              <span>高森ソサイチ大会</span>
            </div>
            <h1>あの頃の楽しさを<br />もう一度</h1>
                      </div>
          <div className="marketing-hero-actions">
            <Link to="/register" className="marketing-hero-button primary">
              今すぐ始める
            </Link>
            <Link to="/login" className="marketing-hero-button secondary">
              ログイン
            </Link>
          </div>
        </div>
      </section>

      <main className="marketing-home-main">
        <section className="marketing-section">
          <div className="marketing-section-heading">
            <span>Our Services</span>
            <h2>サービス機能</h2>
            <p>大会をよりスムーズに、より楽しむための機能を提供します。</p>
          </div>
          <div className="marketing-feature-grid">
            <article className="marketing-feature-card">
              <div className="marketing-feature-icon">
                <span className="material-symbols-outlined" aria-hidden="true">search</span>
              </div>
              <div>
                <h3>大会検索</h3>
                <p>参加可能な大会を条件に合わせて簡単に検索・エントリーできます。</p>
              </div>
            </article>
            <article className="marketing-feature-card">
              <div className="marketing-feature-icon">
                <span className="material-symbols-outlined" aria-hidden="true">groups</span>
              </div>
              <div>
                <h3>チーム管理</h3>
                <p>チームメンバーの出欠やプロフィールを一括管理できます。</p>
              </div>
            </article>
            <article className="marketing-feature-card">
              <div className="marketing-feature-icon">
                <span className="material-symbols-outlined" aria-hidden="true">emoji_events</span>
              </div>
              <div>
                <h3>リアルタイム結果</h3>
                <p>試合ごとのスコアや大会順位をリアルタイムで確認できます。</p>
              </div>
            </article>
            <article className="marketing-feature-card">
              <div className="marketing-feature-icon">
                <span className="material-symbols-outlined" aria-hidden="true">payments</span>
              </div>
              <div>
                <h3>オンライン決済</h3>
                <p>エントリーから決済までアプリで完結。大会参加をスムーズに進められます。</p>
              </div>
            </article>
          </div>
        </section>

        <section className="marketing-archive-section">
          <div className="marketing-archive-inner">
            <div className="marketing-archive-heading">
              <h2>過去の大会</h2>
            </div>
            {pastTournaments.length === 0 ? (
              <p className="marketing-archive-empty">公開中の過去大会はまだありません。</p>
            ) : (
              <>
                <div className="marketing-past-grid">
                  {pastTournaments.map((tournament) => (
                    <PastTournamentCard key={tournament.id} tournament={tournament} />
                  ))}
                </div>
                {visiblePastCount < past.length && (
                  <button
                    type="button"
                    className="marketing-past-more"
                    onClick={() => setVisiblePastCount((count) => count + 3)}
                  >
                    さらに表示する
                  </button>
                )}
              </>
            )}
          </div>
        </section>

        <section className="marketing-bottom-cta">
          <div className="marketing-bottom-cta-inner">
            <h2>大会にエントリーしよう</h2>
            <div className="marketing-bottom-cta-actions">
              <Link to="/register" className="marketing-bottom-cta-button primary">今すぐ登録</Link>
              <Link to="/login" className="marketing-bottom-cta-button secondary">ログイン</Link>
            </div>
          </div>
        </section>

        <footer className="marketing-footer">
          <div className="marketing-footer-brand">
            <img src="/ts-brand-logo.png" alt="高森ソサイチ" />
          </div>
          <nav className="marketing-footer-links" aria-label="公開フッターリンク">
            <Link to="/policies?tab=terms">利用規約</Link>
            <Link to="/policies?tab=privacy">プライバシーポリシー</Link>
          </nav>
          <p>© 2026 Takamori Society. All rights reserved.</p>
        </footer>
      </main>
      </div>
    </div>
  );
}
