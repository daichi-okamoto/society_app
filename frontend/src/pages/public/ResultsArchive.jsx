import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import LoadingScreen from "../../components/LoadingScreen";
import { api } from "../../lib/api";
import { formatPublicDate, splitPublicTournaments } from "../../lib/publicTournaments";
import { getTournamentCoverUrl } from "../../lib/tournamentImages";

export default function ResultsArchive() {
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
        setError("過去大会結果の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const pastTournaments = useMemo(() => splitPublicTournaments(tournaments).past, [tournaments]);

  if (loading) return <LoadingScreen />;
  if (error) return <section className="landing-root"><div className="landing-container">{error}</div></section>;

  return (
    <div className="landing-root landing-subpage-root">
      <header className="landing-header landing-header-solid">
        <div className="landing-header-inner">
          <Link to="/" className="landing-brand" aria-label="Takamori Society ホーム">
            <img src="/ts-brand-logo.png" alt="Takamori Society Logo" />
            <span>7-a-side Soccer</span>
          </Link>
          <nav className="landing-nav" aria-label="公開ナビゲーション">
            <Link to="/">ホーム</Link>
            <Link to="/announcements">お知らせ</Link>
            <Link to="/policies?tab=privacy">プライバシーポリシー</Link>
            <Link to="/login">ログイン</Link>
          </nav>
        </div>
      </header>

      <main className="landing-section landing-section-light landing-subpage-main">
        <div className="landing-container landing-section-narrow">
          <div className="landing-section-title landing-section-title-left">
            <h2>Past Tournaments</h2>
            <span />
          </div>
          <div className="landing-subpage-head">
            <h1>過去大会結果一覧</h1>
            <p>ログインなしで過去大会の結果ページを閲覧できます。大会ごとの結果詳細、順位表、試合結果を確認できます。</p>
          </div>

          {pastTournaments.length === 0 ? (
            <p className="landing-empty">公開されている過去大会結果はありません。</p>
          ) : (
            <div className="landing-archive-list landing-archive-list-grid">
              {pastTournaments.map((tournament) => (
                <Link key={tournament.id} to={`/tournaments/${tournament.id}/results`} className="landing-archive-card">
                  <img src={getTournamentCoverUrl(tournament)} alt={tournament.name} />
                  <div className="landing-archive-copy">
                    <div className="landing-archive-meta">
                      <span>{tournament.name}</span>
                      <span>{formatPublicDate(tournament.event_date)}</span>
                    </div>
                    <h3>{tournament.name}</h3>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
