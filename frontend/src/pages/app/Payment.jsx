import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";

export default function Payment() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect");
  const [methods, setMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadMethods = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get("/payments/methods");
      setMethods(data?.methods || []);
    } catch {
      setError("支払い情報の取得に失敗しました。");
      setMethods([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMethods();
  }, []);

  const defaultMethod = useMemo(() => methods.find((m) => m.is_default) || methods[0] || null, [methods]);
  const hasPaymentMethod = Boolean(defaultMethod);

  const toAddCardPage = () =>
    navigate(
      redirectPath
        ? `/payments/new-card?redirect=${encodeURIComponent(redirectPath)}`
        : "/payments/new-card"
    );

  const removeMethod = async (methodId) => {
    try {
      await api.del(`/payments/methods/${methodId}`);
      await loadMethods();
    } catch {
      setError("カード削除に失敗しました。");
    }
  };

  const setDefault = async (methodId) => {
    try {
      await api.post(`/payments/methods/${methodId}/default`, {});
      await loadMethods();
    } catch {
      setError("デフォルトカードの更新に失敗しました。");
    }
  };

  return (
    <div className="pay-root">
      <header className="pay-header">
        <button type="button" onClick={() => window.history.back()} aria-label="お支払い情報を戻る">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1>お支払い情報</h1>
        <span className="pay-header-spacer" />
      </header>

      <main className="pay-main">
        {redirectPath ? (
          <div className="pay-entry-notice">
            <span className="material-symbols-outlined">info</span>
            <p>大会エントリーにはカード登録が必要です。登録完了後に申し込みへ戻ってください。</p>
          </div>
        ) : null}

        {error ? <p className="pay-error">{error}</p> : null}

        {loading ? (
          <p className="pay-loading">読み込み中...</p>
        ) : hasPaymentMethod ? (
          <section className="pay-has-card">
            <div className="pay-section-title">
              <p>登録済みのお支払い方法</p>
            </div>

            <div className="pay-card">
              <div className="pay-card-glow" />
              <div className="pay-card-top">
                <span className="pay-card-chip-wrap">
                  <span className="pay-card-chip" />
                </span>
                <strong>{String(defaultMethod.brand || "CARD").toUpperCase()}</strong>
              </div>

              <div className="pay-card-number">
                <p>カード番号</p>
                <div>
                  <span>••••</span>
                  <span>••••</span>
                  <span>••••</span>
                  <span>{defaultMethod.last4 || "----"}</span>
                </div>
              </div>

              <div className="pay-card-bottom">
                <div>
                  <p>有効期限</p>
                  <p>{defaultMethod.exp_month}/{String(defaultMethod.exp_year || "").slice(-2)}</p>
                </div>
                <span className="pay-default-tag">デフォルト</span>
              </div>
            </div>

            <div className="pay-method-list">
              {methods.map((method) => (
                <article className="pay-method-item" key={method.id}>
                  <div>
                    <strong>{String(method.brand || "CARD").toUpperCase()} •••• {method.last4}</strong>
                    <p>{method.exp_month}/{String(method.exp_year || "").slice(-2)}</p>
                  </div>
                  <div className="pay-method-actions">
                    {!method.is_default ? (
                      <button type="button" onClick={() => setDefault(method.id)}>既定にする</button>
                    ) : (
                      <span>既定</span>
                    )}
                    <button type="button" className="danger" onClick={() => removeMethod(method.id)}>削除</button>
                  </div>
                </article>
              ))}
            </div>

            <button type="button" className="pay-add-btn" onClick={toAddCardPage}>
              <span className="material-symbols-outlined">add_card</span>
              <span>新しいカードを追加</span>
            </button>
          </section>
        ) : (
          <section className="pay-empty">
            <div className="pay-empty-icon">
              <span className="material-symbols-outlined">credit_card</span>
              <span className="pay-empty-plus material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                add_circle
              </span>
            </div>

            <h2>お支払い方法が登録されていません</h2>
            <p>
              大会への参加申し込みをスムーズに行うために、
              <br />
              クレジットカード等の登録をお勧めします。
            </p>

            <button type="button" className="pay-primary-btn" onClick={toAddCardPage}>
              <span className="material-symbols-outlined">add</span>
              <span>お支払い方法を追加する</span>
            </button>
          </section>
        )}
      </main>

      <nav className="pay-nav">
        <div className="pay-nav-row">
          <Link to="/app/home" className="pay-nav-item">
            <span className="material-symbols-outlined">home</span>
            <span>ホーム</span>
          </Link>
          <Link to="/tournaments" className="pay-nav-item">
            <span className="material-symbols-outlined">search</span>
            <span>さがす</span>
          </Link>
          <div className="pay-nav-center">
            <button type="button" aria-label="ホーム">
              <span className="material-symbols-outlined">sports_soccer</span>
            </button>
          </div>
          <Link to="/teams" className="pay-nav-item">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/me" className="pay-nav-item active">
            <span className="material-symbols-outlined">person</span>
            <span>マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
