import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

function buildReceiptNumber(entryId) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = String(entryId || 1).padStart(3, "0");
  return `#${y}${m}${d}-${seq}`;
}

export default function TournamentEntryComplete() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [result, setResult] = useState(() => {
    const raw = window.sessionStorage.getItem(`entry-result:${id}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  });
  const [tournamentName, setTournamentName] = useState(location.state?.tournamentName || "渋谷ナイトカップ");

  const receiptNumber = useMemo(() => {
    if (location.state?.receiptNumber) return location.state.receiptNumber;
    if (result?.receiptNumber) return result.receiptNumber;
    return buildReceiptNumber(1);
  }, [location.state, result]);

  useEffect(() => {
    if (location.state) {
      setResult((prev) => ({ ...(prev || {}), ...location.state }));
    }
  }, [location.state]);

  useEffect(() => {
    let active = true;
    api
      .get(`/tournaments/${id}`)
      .then((data) => {
        if (!active) return;
        const name = data?.tournament?.name;
        if (name) setTournamentName(name);
      })
      .catch(() => {});

    return () => {
      active = false;
    };
  }, [id]);

  return (
    <div className="entry-complete-root">
      <header className="entry-complete-header">
        <div className="entry-complete-spacer" />
        <h1>完了</h1>
        <div className="entry-complete-spacer" />
      </header>

      <section className="entry-complete-progress" aria-label="エントリー手順">
        <div className="entry-complete-progress-track">
          <div />
        </div>
        <div className="entry-complete-progress-item done">
          <span className="entry-complete-progress-badge">
            <span className="material-symbols-outlined">check</span>
          </span>
          <p>情報入力</p>
        </div>
        <div className="entry-complete-progress-item done">
          <span className="entry-complete-progress-badge">
            <span className="material-symbols-outlined">check</span>
          </span>
          <p>内容確認</p>
        </div>
        <div className="entry-complete-progress-item active">
          <span className="entry-complete-progress-badge">3</span>
          <p>完了</p>
        </div>
      </section>

      <main className="entry-complete-main">
        <div className="entry-complete-center">
          <div className="entry-complete-icon-wrap">
            <span className="material-symbols-outlined">check</span>
          </div>

          <div className="entry-complete-title">
            <h2>
              大会へのエントリーが
              <br />
              完了しました！
            </h2>
            <p>
              エントリーありがとうございます。
              <br />
              詳細はご登録のメールアドレスへ送信しました。
            </p>
          </div>

          <section className="entry-complete-card">
            <div className="entry-complete-row">
              <label>大会名</label>
              <p>{tournamentName}</p>
            </div>
            <hr />
            <div className="entry-complete-row">
              <label>受付番号</label>
              <div className="entry-complete-receipt">{receiptNumber}</div>
            </div>
          </section>

          <div className="entry-complete-note">
            <p>
              当日のご案内はマイページからもご確認いただけます。
              <br />
              万が一メールが届かない場合は、お問い合わせください。
            </p>
          </div>
        </div>
      </main>

      <div className="entry-complete-footer sticky-footer">
        <div className="entry-complete-footer-actions">
          <Link to="/app/home" className="primary">
            <span>ホームへ戻る</span>
            <span className="material-symbols-outlined">home</span>
          </Link>
          <button type="button" className="secondary" onClick={() => navigate(`/tournaments/${id}/entry/review`)}>
            <span>エントリー内容を確認する</span>
            <span className="material-symbols-outlined">description</span>
          </button>
        </div>
      </div>
    </div>
  );
}
