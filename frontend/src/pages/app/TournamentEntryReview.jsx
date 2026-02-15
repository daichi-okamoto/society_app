import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

const CATEGORY_LABELS = {
  enjoy: "エンジョイ",
  open: "オープン",
  beginner: "ビギナー",
};

function loadResult(id) {
  const raw = window.sessionStorage.getItem(`entry-result:${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function formatDateJP(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

export default function TournamentEntryReview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [result] = useState(() => loadResult(id));

  useEffect(() => {
    let active = true;
    api
      .get(`/tournaments/${id}`)
      .then((data) => {
        if (!active) return;
        setTournament(data?.tournament || null);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [id]);

  const paymentMethod = result?.payment_method === "cash" ? "cash" : "card";
  const paymentLabel = paymentMethod === "cash" ? "当日払い" : "クレジットカード";
  const paymentStatusLabel = paymentMethod === "cash" ? "当日現地にてお支払い" : "決済完了";
  const paymentStatusIcon = paymentMethod === "cash" ? "schedule" : "check_circle";
  const paymentStatusClass = paymentMethod === "cash" ? "onsite" : "paid";
  const categoryLabel = CATEGORY_LABELS[result?.category] || "エンジョイ";
  const receipt = result?.receiptNumber || "#20240501-001";

  const teamMembersPath = useMemo(() => {
    if (result?.team_id) return `/teams/${result.team_id}/members`;
    return "/teams";
  }, [result?.team_id]);

  return (
    <div className="entry-review-root">
      <header className="entry-review-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h1>エントリー内容の確認</h1>
        <div className="entry-review-header-spacer" />
      </header>

      <main className="entry-review-main">
        <div className="entry-review-receipt-box">
          <div>
            <p>受付番号</p>
            <strong>{receipt}</strong>
          </div>
          <span>受付完了</span>
        </div>

        <div className="entry-review-sections">
          <section>
            <h2>
              <span />
              大会情報
            </h2>
            <div className="entry-review-card">
              <div>
                <p>大会名</p>
                <strong>{tournament?.name || result?.tournamentName || "渋谷ナイトカップ"}</strong>
              </div>
              <div className="entry-review-grid">
                <div>
                  <p>開催日</p>
                  <span>{formatDateJP(tournament?.event_date)}</span>
                </div>
                <div>
                  <p>会場</p>
                  <span>{tournament?.venue || "-"}</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2>
              <span />
              エントリーチーム
            </h2>
            <div className="entry-review-card">
              <div>
                <p>チーム名</p>
                <strong>{result?.team_name || "-"}</strong>
              </div>
              <div className="entry-review-divided">
                <p>参加カテゴリー</p>
                <span>{categoryLabel}</span>
              </div>
            </div>
          </section>

          <section>
            <h2>
              <span />
              代表者情報
            </h2>
            <div className="entry-review-card">
              <div className="entry-review-row-split">
                <div>
                  <p>氏名</p>
                  <span>{result?.representative_name || "-"}</span>
                </div>
                <div className="right">
                  <p>電話番号</p>
                  <span>{result?.representative_phone || "-"}</span>
                </div>
              </div>
            </div>
          </section>

          <section>
            <h2>
              <span />
              お支払い情報
            </h2>
            <div className="entry-review-card">
              <div className="entry-review-row-split">
                <div>
                  <p>お支払い方法</p>
                  <span>{paymentLabel}</span>
                </div>
                <div className="right">
                  <p>ステータス</p>
                  <div className={`entry-review-status ${paymentStatusClass}`}>
                    <span className="material-symbols-outlined">{paymentStatusIcon}</span>
                    <span>{paymentStatusLabel}</span>
                  </div>
                </div>
              </div>
            </div>
            {paymentMethod === "cash" ? (
              <p className="entry-review-cash-note">
                ※当日払いは現金のみとなります。お釣りのないようご協力をお願いいたします。
              </p>
            ) : null}
          </section>

          <section className="entry-review-roster">
            <div className="entry-review-card roster">
              <div className="entry-review-roster-left">
                <div className="icon-wrap">
                  <span className="material-symbols-outlined">groups</span>
                </div>
                <div>
                  <strong>参加選手名簿</strong>
                  <p>当日の受付に必要です</p>
                </div>
              </div>
              <div className="entry-review-roster-right">
                <span className="material-symbols-outlined">warning</span>
                <span>未提出</span>
              </div>
            </div>
          </section>
        </div>
      </main>

      <div className="entry-review-footer sticky-footer">
        <button type="button" onClick={() => navigate(teamMembersPath)}>
          <span>参加選手名簿を提出・確認する</span>
          <span className="material-symbols-outlined">arrow_forward_ios</span>
        </button>
      </div>
    </div>
  );
}
