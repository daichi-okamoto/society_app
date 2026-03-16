import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import AdminBottomNav from "../../components/admin/AdminBottomNav";
import { getTournamentCoverUrl } from "../../lib/tournamentImages";

function statusByDate(eventDate) {
  if (!eventDate) return "recruiting";
  const dt = new Date(`${eventDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dt.getTime() < today.getTime()) return "finished";
  if (dt.getTime() === today.getTime()) return "live";
  return "recruiting";
}

function formatDateLabel(eventDate) {
  if (!eventDate) return "日付未設定";
  const dt = new Date(`${eventDate}T00:00:00`);
  const w = ["日", "月", "火", "水", "木", "金", "土"][dt.getDay()];
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${m}/${d} (${w}) • 10:00 - 16:00`;
}

export default function AdminTournaments() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("q") || "");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const params = new URLSearchParams(searchParams);
    if (search.trim()) params.set("q", search.trim());
    else params.delete("q");
    setSearchParams(params, { replace: true });
  }, [search, setSearchParams]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/tournaments")
      .then((data) => {
        if (!active) return;
        const list = (data?.tournaments || []).map((t) => {
          const maxTeams = Number(t.max_teams || 16);
          const current = Math.max(0, Math.min(maxTeams, Number(t.active_entry_teams_count || 0)));
          const progress = Math.round((current / Math.max(maxTeams, 1)) * 100);
          const status = statusByDate(t.event_date);
          return {
            id: String(t.id),
            kind: status === "finished" ? "finished" : status === "live" ? "live" : "hero-recruiting",
            badge: status === "finished" ? "終了" : status === "live" ? "開催中" : "募集中",
            badgeClass: status === "finished" ? "is-finished" : status === "live" ? "is-success" : "is-primary",
            date: status === "live" ? "本日 • 13:00 - 18:00" : formatDateLabel(t.event_date),
            title: t.name,
            current,
            total: maxTeams,
            progress,
            progressColor: status === "live" ? "#059669" : "var(--tour-primary)",
            revenueLabel: status === "live" ? "確定売上" : status === "finished" ? "最終売上" : "現在の売上",
            revenue: `¥${Number(t.entry_fee_amount || 0).toLocaleString("ja-JP")}`,
            image: getTournamentCoverUrl(t),
            teamsText: `${current}チーム`,
            phaseText: "予選リーグ中",
            winner: "優勝: -",
          };
        });
        setTournaments(list);
      })
      .catch(() => {
        if (!active) return;
        setTournaments([]);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filteredCards = useMemo(() => {
    return tournaments.filter((card) => {
      const bySearch = search.trim() ? card.title.toLowerCase().includes(search.trim().toLowerCase()) : true;
      const status = card.kind === "finished" ? "finished" : card.kind === "live" ? "live" : "recruiting";
      const byFilter = filter === "all" ? true : filter === status;
      return bySearch && byFilter;
    });
  }, [tournaments, search, filter]);

  const openTournamentDetail = (id) => {
    navigate(`/admin/tournaments/${id}`);
  };

  const onCardKeyDown = (event, id) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openTournamentDetail(id);
  };

  const stopPropagation = (event) => {
    event.stopPropagation();
  };

  return (
    <div className="adtour-root">
      <header className="adtour-head">
        <div className="adtour-head-top">
          <div className="adtour-head-left">
            <button type="button" className="adtour-back-btn" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1>運営中の大会</h1>
          </div>
          <button type="button" className="adtour-create-btn" onClick={() => navigate("/admin/tournaments/new")}>
            <span className="material-symbols-outlined">add</span>
            新規作成
          </button>
        </div>

        <div className="adtour-search-wrap">
          <span className="material-symbols-outlined">search</span>
          <input type="text" placeholder="大会名で検索" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>

        <div className="adtour-filter-row">
          <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
            すべて
          </button>
          <button
            type="button"
            className={filter === "recruiting" ? "active" : ""}
            onClick={() => setFilter("recruiting")}
          >
            募集中
          </button>
          <button type="button" className={filter === "live" ? "active" : ""} onClick={() => setFilter("live")}>
            開催中
          </button>
          <button
            type="button"
            className={filter === "finished" ? "active" : ""}
            onClick={() => setFilter("finished")}
          >
            終了
          </button>
        </div>
      </header>

      <main className="adtour-main">
        {loading ? <p className="adtour-empty">読み込み中...</p> : null}
        {!loading && filteredCards.length === 0 ? <p className="adtour-empty">表示できる大会がありません。</p> : null}
        {filteredCards.map((card) => (
          <article
            key={card.id}
            className={`adtour-card ${card.kind}`}
            role="button"
            tabIndex={0}
            onClick={() => openTournamentDetail(card.id)}
            onKeyDown={(event) => onCardKeyDown(event, card.id)}
          >
            {card.kind !== "finished" ? (
              <div className={`adtour-hero ${card.kind === "live" ? "is-live" : ""}`}>
                {card.image ? <img src={card.image} alt="" /> : <div className="adtour-solid-bg" />}
                <div className="adtour-hero-overlay" />
                <div className="adtour-badge-wrap">
                  <span className={`adtour-badge ${card.badgeClass || ""}`}>{card.badge}</span>
                </div>
                <div className="adtour-hero-copy">
                  <p>{card.date}</p>
                  <h3>{card.title}</h3>
                </div>
              </div>
            ) : null}

            {card.kind === "finished" ? (
              <div className="adtour-finished-body">
                <div className="adtour-finished-top">
                  <div>
                    <div className="adtour-finished-meta">
                      <span className="adtour-finished-chip">{card.badge}</span>
                      <span>{card.date}</span>
                    </div>
                    <h3>{card.title}</h3>
                  </div>
                  <div className="adtour-finished-revenue">
                    <p>{card.revenueLabel}</p>
                    <strong>{card.revenue}</strong>
                  </div>
                </div>
                <div className="adtour-finished-foot">
                  <span>{card.winner}</span>
                  <button type="button" onClick={() => openTournamentDetail(card.id)} onClickCapture={stopPropagation}>
                    結果詳細
                    <span className="material-symbols-outlined">chevron_right</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="adtour-card-body">
                {card.kind === "live" ? (
                  <div className="adtour-live-grid">
                    <div>
                      <p>参加チーム</p>
                      <strong>{card.teamsText}</strong>
                    </div>
                    <div>
                      <p>進行状況</p>
                      <strong className="is-live-text">{card.phaseText}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="adtour-progress-box">
                    <div className="adtour-progress-top">
                      <span>登録状況</span>
                      <div>
                        <b>{card.current}</b>
                        <small>/ {card.total} チーム</small>
                      </div>
                    </div>
                    <div className="adtour-track">
                      <div className="adtour-fill" style={{ width: `${card.progress}%`, background: card.progressColor }} />
                    </div>
                  </div>
                )}

                <div className="adtour-card-foot">
                  <div>
                    <p>{card.revenueLabel}</p>
                    <strong>{card.revenue}</strong>
                  </div>
                  <div>
                    {card.kind === "live" ? (
                      <button
                        type="button"
                        className="adtour-live-cta"
                        onClick={() => openTournamentDetail(card.id)}
                        onClickCapture={stopPropagation}
                      >
                        運営画面へ
                      </button>
                    ) : (
                      <button
                        type="button"
                        className="adtour-link-btn"
                        onClick={() => openTournamentDetail(card.id)}
                        onClickCapture={stopPropagation}
                      >
                        詳細を見る
                        <span className="material-symbols-outlined">arrow_forward</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </article>
        ))}
      </main>

      <AdminBottomNav />
    </div>
  );
}
