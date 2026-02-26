import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import LoadingScreen from "../../components/LoadingScreen";

function formatReceiptNumber(entryId) {
  const numeric = Number(entryId || 0);
  if (!Number.isFinite(numeric) || numeric <= 0) return "#00000000";
  return `#${String(numeric).padStart(8, "0")}`;
}

function formatDateWithWeekday(value) {
  if (!value) return "-";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  });
}

function formatCurrency(value) {
  const numeric = Number(value || 0);
  return `¥${numeric.toLocaleString("ja-JP")}`;
}

function paymentLabelFromStatus(status) {
  if (status === "approved") return { label: "決済完了", className: "ok" };
  if (status === "pending") return { label: "審査中", className: "pending" };
  return { label: "未決済", className: "pending" };
}

export default function TournamentEntryReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const teamQuery = searchParams.get("team_id") || "";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tournament, setTournament] = useState(null);
  const [entry, setEntry] = useState(null);
  const [team, setTeam] = useState(null);
  const [resolvedTeamId, setResolvedTeamId] = useState(null);
  const [rosterSubmitted, setRosterSubmitted] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setLoading(true);
      setError("");

      try {
        const [tournamentRes, entryRes, teamsRes] = await Promise.all([
          api.get(`/tournaments/${id}`),
          api.get(`/tournaments/${id}/entries/me`).catch(() => ({ entry: null })),
          api.get("/teams").catch(() => ({ teams: [] })),
        ]);
        if (!active) return;

        const memberTeams = (teamsRes?.teams || []).filter((item) => item?.is_member);
        const memberTeamIds = new Set(memberTeams.map((item) => Number(item.id)).filter((v) => Number.isFinite(v)));

        const requestedTeamId = Number(teamQuery || 0) || null;
        const entryTeamId = Number(entryRes?.entry?.team_id || 0) || null;
        const activeTeamId =
          typeof window !== "undefined"
            ? Number(window.sessionStorage.getItem("active_team_id") || 0) || null
            : null;

        const teamId =
          requestedTeamId && memberTeamIds.has(requestedTeamId)
            ? requestedTeamId
            : entryTeamId && memberTeamIds.has(entryTeamId)
              ? entryTeamId
              : activeTeamId && memberTeamIds.has(activeTeamId)
                ? activeTeamId
                : memberTeams[0]?.id || entryTeamId || null;

        setTournament(tournamentRes?.tournament || null);
        setEntry(entryRes?.entry || null);
        setResolvedTeamId(teamId ? Number(teamId) : null);

        if (teamId) {
          const teamRes = await api.get(`/teams/${teamId}`).catch(() => ({ team: null }));
          if (!active) return;
          setTeam(teamRes?.team || null);

          const rosterPath = `/tournaments/${id}/entry_roster?team_id=${teamId}`;
          const rosterRes = await api.get(rosterPath).catch((e) => {
            if (e?.status === 404) return { roster: null };
            throw e;
          });
          if (!active) return;
          setRosterSubmitted(Boolean(rosterRes?.roster?.players?.length));
        } else {
          setTeam(null);
          setRosterSubmitted(false);
        }
      } catch {
        if (!active) return;
        setError("エントリー内容の取得に失敗しました");
        setRosterSubmitted(false);
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, [id, teamQuery]);

  const receiptNumber = useMemo(() => formatReceiptNumber(entry?.id), [entry?.id]);
  const payment = useMemo(() => paymentLabelFromStatus(entry?.status), [entry?.status]);
  const entryFee = useMemo(() => formatCurrency(tournament?.entry_fee_amount || 0), [tournament?.entry_fee_amount]);
  const rosterLink = useMemo(() => {
    if (!resolvedTeamId) return `/tournaments/${id}/entry/review/roster`;
    return `/tournaments/${id}/entry/review/roster?team_id=${resolvedTeamId}`;
  }, [id, resolvedTeamId]);

  if (loading) return <LoadingScreen />;

  if (error) {
    return (
      <div className="entry-review-root">
        <main className="entry-review-empty">
          <h1>エラーが発生しました</h1>
          <p>{error}</p>
          <button type="button" onClick={() => navigate(-1)}>
            戻る
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="entry-review-root">
      <header className="entry-review-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h1>エントリー内容の確認</h1>
      </header>

      <main className="entry-review-main">
        <section className="entry-review-receipt">
          <p>受付番号</p>
          <strong>{receiptNumber}</strong>
        </section>

        <section className="entry-review-block">
          <div className="entry-review-head">
            <span className="material-symbols-outlined">event_available</span>
            <h2>大会情報</h2>
          </div>
          <div className="entry-review-body">
            <p className="title">{tournament?.name || "大会名未設定"}</p>
            <div className="inline-grid">
              <div>
                <label>開催日</label>
                <span>{formatDateWithWeekday(tournament?.event_date)}</span>
              </div>
              <div>
                <label>会場</label>
                <span>{tournament?.venue || "未設定"}</span>
              </div>
            </div>
          </div>
        </section>

        <hr />

        <section className="entry-review-block">
          <div className="entry-review-head">
            <span className="material-symbols-outlined">groups</span>
            <h2>エントリーチーム</h2>
          </div>
          <div className="entry-review-body">
            <div className="entry-review-team-row">
              <div>
                <label>チーム名</label>
                <span>{team?.name || "未設定"}</span>
              </div>
              <em>エントリー中</em>
            </div>
          </div>
        </section>

        <hr />

        <section className="entry-review-block">
          <div className="entry-review-head">
            <span className="material-symbols-outlined">person</span>
            <h2>代表者情報</h2>
          </div>
          <div className="entry-review-body stack">
            <div>
              <label>氏名</label>
              <span>{user?.name || "未設定"}</span>
            </div>
            <div>
              <label>連絡先</label>
              <span>{user?.phone || "未設定"}</span>
            </div>
          </div>
        </section>

        <hr />

        <section className="entry-review-block">
          <div className="entry-review-head">
            <span className="material-symbols-outlined">payments</span>
            <h2>お支払い情報</h2>
          </div>

          <div className="entry-review-payment-card">
            <div>
              <label>支払い方法</label>
              <span>クレジットカード</span>
            </div>
            <div>
              <label>ステータス</label>
              <span className={`status ${payment.className}`}>
                <span className="material-symbols-outlined">check_circle</span>
                {payment.label}
              </span>
            </div>
            <div className="total-row">
              <label>合計金額</label>
              <strong>{entryFee}</strong>
            </div>
          </div>
        </section>
      </main>

      <footer className="entry-review-footer sticky-footer">
        <div className="roster-row">
          <div className="left">
            <span className="material-symbols-outlined">badge</span>
            <span>参加選手名簿</span>
          </div>
          <span className={`badge ${rosterSubmitted ? "ok" : "ng"}`}>{rosterSubmitted ? "提出済み" : "未提出"}</span>
        </div>

        <Link to={rosterLink} className="submit-btn">
          <span className="material-symbols-outlined">edit_note</span>
          <span>名簿を提出・編集する</span>
        </Link>
      </footer>
    </div>
  );
}
