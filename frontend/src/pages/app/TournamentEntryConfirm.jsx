import { useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";

const CATEGORY_LABELS = {
  enjoy: { code: "ENJOY", label: "エンジョイ" },
  open: { code: "OPEN", label: "オープン" },
  beginner: { code: "BEGINNER", label: "ビギナー" },
};

function loadDraftFromStorage(id) {
  const raw = window.sessionStorage.getItem(`entry-draft:${id}`);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function buildReceiptNumber(entryId) {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const seq = String(entryId || 1).padStart(3, "0");
  return `#${y}${m}${d}-${seq}`;
}

export default function TournamentEntryConfirm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const draft = useMemo(() => {
    return location.state?.draft || loadDraftFromStorage(id);
  }, [id, location.state]);

  const categoryMeta = CATEGORY_LABELS[draft?.category] || CATEGORY_LABELS.enjoy;
  const paymentLabel = draft?.payment_method === "cash" ? "当日払い" : "クレジットカード";
  const paymentIcon = draft?.payment_method === "cash" ? "payments" : "credit_card";
  const amountText = `¥${Number(draft?.amount || 15000).toLocaleString("ja-JP")}`;

  const onSubmit = async () => {
    if (!draft?.team_id) {
      setError("入力情報が見つかりません。最初からやり直してください。");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const data = await api.post(`/tournaments/${id}/entries`, {
        team_id: Number(draft.team_id),
        category: draft.category,
        payment_method: draft.payment_method,
      });
      const result = {
        receiptNumber: buildReceiptNumber(data?.entry?.id),
        tournamentName: draft.tournament_name || "",
        team_id: Number(draft.team_id),
        team_name: draft.team_name,
        category: draft.category,
        representative_name: draft.representative_name,
        representative_phone: draft.representative_phone,
        payment_method: draft.payment_method,
      };
      window.sessionStorage.setItem(`entry-result:${id}`, JSON.stringify(result));
      window.sessionStorage.removeItem(`entry-draft:${id}`);
      navigate(`/tournaments/${id}/entry/complete`, {
        state: {
          ...result,
          flash: { type: "success", message: "大会エントリーが完了しました。" },
        },
      });
    } catch {
      setError("申し込みに失敗しました。時間をおいて再度お試しください。");
    } finally {
      setSubmitting(false);
    }
  };

  if (!draft) {
    return (
      <div className="entry-confirm-root">
        <main className="entry-confirm-empty">
          <h1>入力情報が見つかりません</h1>
          <p>大会エントリー画面に戻って入力し直してください。</p>
          <button type="button" onClick={() => navigate(`/tournaments/${id}/entry`)}>
            入力画面に戻る
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="entry-confirm-root">
      <header className="entry-confirm-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1>内容確認</h1>
        <span className="entry-confirm-header-spacer" />
      </header>

      <section className="entry-confirm-progress" aria-label="エントリー手順">
        <div className="entry-confirm-progress-track">
          <div />
        </div>
        <div className="entry-confirm-progress-item done">
          <span className="entry-confirm-progress-badge">
            <span className="material-symbols-outlined">check</span>
          </span>
          <p>情報入力</p>
        </div>
        <div className="entry-confirm-progress-item active">
          <span className="entry-confirm-progress-badge">2</span>
          <p>内容確認</p>
        </div>
        <div className="entry-confirm-progress-item">
          <span className="entry-confirm-progress-badge">3</span>
          <p>完了</p>
        </div>
      </section>

      <main className="entry-confirm-main">
        <div className="entry-confirm-title">
          <h2>入力内容の確認</h2>
          <p>申し込み内容に間違いがないかご確認ください。</p>
        </div>

        <section className="entry-confirm-card">
          <div className="entry-confirm-card-body">
            <div className="entry-confirm-row">
              <label>エントリーチーム</label>
              <p>{draft.team_name}</p>
            </div>
            <hr />
            <div className="entry-confirm-row">
              <label>参加カテゴリー</label>
              <div className="entry-confirm-inline">
                <span>{categoryMeta.code}</span>
                <p>{categoryMeta.label}</p>
              </div>
            </div>
            <hr />
            <div className="entry-confirm-row-group">
              <div className="entry-confirm-row">
                <label>代表者氏名</label>
                <p>{draft.representative_name}</p>
              </div>
              <div className="entry-confirm-row">
                <label>電話番号</label>
                <p>{draft.representative_phone}</p>
              </div>
            </div>
            <hr />
            <div className="entry-confirm-row">
              <label>お支払い方法</label>
              <div className="entry-confirm-payment">
                <span className="material-symbols-outlined">{paymentIcon}</span>
                <p>{paymentLabel}</p>
              </div>
            </div>
          </div>

          <div className="entry-confirm-total">
            <span>合計金額（税込）</span>
            <strong>{amountText}</strong>
          </div>
        </section>

        <div className="entry-confirm-note">
          <span className="material-symbols-outlined">info</span>
          <p>
            お申し込み後のキャンセルについては、大会規約に基づきキャンセル料が発生する場合がございます。内容を十分にご確認の上、お申し込みください。
          </p>
        </div>

        {error ? <p className="entry-confirm-error">{error}</p> : null}
      </main>

      <div className="entry-confirm-footer sticky-footer">
        <div className="entry-confirm-footer-actions">
          <button type="button" onClick={onSubmit} disabled={submitting}>
            <span>{submitting ? "送信中..." : "この内容で申し込む"}</span>
            <span className="material-symbols-outlined">check_circle</span>
          </button>
          <button type="button" className="secondary" onClick={() => navigate(-1)}>
            修正する
          </button>
        </div>
      </div>
    </div>
  );
}
