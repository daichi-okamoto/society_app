import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  CardCvcElement,
  CardExpiryElement,
  CardNumberElement,
  Elements,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { api } from "../../lib/api";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

const ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#1e293b",
      fontSize: "14px",
      fontFamily: "Noto Sans JP, sans-serif",
      "::placeholder": {
        color: "#cbd5e1",
      },
    },
    invalid: {
      color: "#dc2626",
    },
  },
};

function AddCardForm({ clientSecret, cardholderName, setCardholderName, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [saving, setSaving] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || saving) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) {
      onError("カード情報の入力欄を初期化できませんでした。");
      return;
    }

    setSaving(true);
    onError(null);

    const result = await stripe.confirmCardSetup(clientSecret, {
      payment_method: {
        card: cardNumber,
        billing_details: {
          name: cardholderName || undefined,
        },
      },
    });

    if (result.error) {
      setSaving(false);
      onError(result.error.message || "カード登録に失敗しました。");
      return;
    }

    const paymentMethodId = result?.setupIntent?.payment_method;
    if (paymentMethodId) {
      try {
        await api.post(`/payments/methods/${paymentMethodId}/default`, {});
      } catch {
        // 登録自体は成功しているため処理継続
      }
    }

    onSuccess();
  };

  return (
    <form className="payadd-form" onSubmit={submit}>
      <section className="payadd-preview-wrap">
        <div className="payadd-preview-card">
          <div className="payadd-preview-glow" />
          <div className="payadd-preview-top">
            <div className="payadd-chip-wrap">
              <div className="payadd-chip-inner" />
            </div>
            <span className="material-symbols-outlined">contactless</span>
          </div>
          <div className="payadd-preview-number">
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
            <span>••••</span>
          </div>
          <div className="payadd-preview-bottom">
            <div>
              <p>CARD HOLDER</p>
              <strong>{(cardholderName || "Your Name").slice(0, 24)}</strong>
            </div>
            <div>
              <p>EXPIRES</p>
              <strong>MM/YY</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="payadd-fields">
        <div className="payadd-field">
          <label>カード名義人</label>
          <input
            type="text"
            placeholder="TARO TANAKA"
            value={cardholderName}
            onChange={(e) => setCardholderName(e.target.value)}
          />
        </div>

        <div className="payadd-field">
          <label>カード番号</label>
          <div className="payadd-stripe-row">
            <CardNumberElement options={ELEMENT_OPTIONS} />
            <span className="material-symbols-outlined">credit_card</span>
          </div>
        </div>

        <div className="payadd-grid">
          <div className="payadd-field">
            <label>有効期限 (MM/YY)</label>
            <div className="payadd-stripe-row centered">
              <CardExpiryElement options={ELEMENT_OPTIONS} />
            </div>
          </div>

          <div className="payadd-field">
            <label>セキュリティコード</label>
            <div className="payadd-stripe-row centered">
              <CardCvcElement options={ELEMENT_OPTIONS} />
              <span className="material-symbols-outlined">help_outline</span>
            </div>
          </div>
        </div>

        <div className="payadd-lock-note">
          <span className="material-symbols-outlined">lock</span>
          <p>お客様のカード情報は安全に暗号化されます</p>
        </div>

        <button type="submit" className="payadd-submit" disabled={!stripe || saving}>
          {saving ? "登録中..." : "カードを登録する"}
        </button>
      </section>
    </form>
  );
}

export default function PaymentAddCard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectPath = searchParams.get("redirect");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [cardholderName, setCardholderName] = useState("");

  useEffect(() => {
    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      setError("Stripe公開キーが未設定です。VITE_STRIPE_PUBLISHABLE_KEY を設定してください。");
      setLoading(false);
      return;
    }

    let active = true;

    const prepare = async () => {
      setLoading(true);
      setError(null);

      try {
        const data = await api.post("/payments/setup_intent", {});
        if (!active) return;
        if (!data?.client_secret) throw new Error("missing_client_secret");
        setClientSecret(data.client_secret);
      } catch {
        if (!active) return;
        setError("カード登録の準備に失敗しました。時間をおいて再度お試しください。");
      } finally {
        if (active) setLoading(false);
      }
    };

    prepare();

    return () => {
      active = false;
    };
  }, []);

  const onSuccess = useCallback(() => {
    if (redirectPath) {
      navigate(redirectPath, { replace: true });
      return;
    }
    navigate("/payments", { replace: true });
  }, [navigate, redirectPath]);

  return (
    <div className="payadd-root">
      <header className="payadd-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </button>
        <h1>新しいカードの登録</h1>
        <div className="payadd-header-spacer" />
      </header>

      <main className="payadd-main">
        {loading ? <p className="payadd-status">読み込み中...</p> : null}
        {error ? <p className="payadd-error">{error}</p> : null}

        {!loading && clientSecret ? (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <AddCardForm
              clientSecret={clientSecret}
              cardholderName={cardholderName}
              setCardholderName={setCardholderName}
              onSuccess={onSuccess}
              onError={setError}
            />
          </Elements>
        ) : null}
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
