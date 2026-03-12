import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { api } from "../../lib/api";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "");

function TournamentPaymentForm({ tournamentId, onError, onSubmitting, onSuccess }) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!stripe || !elements || submitting) return;

    setSubmitting(true);
    onSubmitting(true);
    onError(null);

    const result = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
      confirmParams: {
        return_url: `${window.location.origin}/tournaments/${tournamentId}/entry/complete?payment=success`,
      },
    });

    if (result.error) {
      setSubmitting(false);
      onSubmitting(false);
      onError(result.error.message || "決済に失敗しました。カード情報をご確認ください。");
      return;
    }

    const status = result?.paymentIntent?.status;
    if (status === "succeeded" || status === "processing" || status === "requires_capture") {
      onSuccess();
      return;
    }

    setSubmitting(false);
    onSubmitting(false);
    onError("決済処理を完了できませんでした。時間をおいて再度お試しください。");
  };

  return (
    <form className="tpay-form" onSubmit={onSubmit}>
      <PaymentElement />
      <button type="submit" className="tpay-submit" disabled={!stripe || submitting}>
        {submitting ? "決済中..." : "この内容で決済する"}
      </button>
    </form>
  );
}

export default function TournamentPaymentCheckout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [clientSecret, setClientSecret] = useState(null);
  const [requiresCardSetup, setRequiresCardSetup] = useState(false);

  const entryId = useMemo(() => {
    const fromQuery = Number(searchParams.get("entry_id") || 0);
    if (fromQuery > 0) return fromQuery;

    const fromState = Number(location.state?.result?.entry_id || 0);
    if (fromState > 0) return fromState;

    try {
      const raw = window.sessionStorage.getItem(`entry-result:${id}`);
      const result = raw ? JSON.parse(raw) : null;
      const fromStorage = Number(result?.entry_id || 0);
      return fromStorage > 0 ? fromStorage : 0;
    } catch {
      return 0;
    }
  }, [id, location.state, searchParams]);

  const useSavedCard = searchParams.get("saved_card") === "1";

  useEffect(() => {
    if (!entryId) {
      setLoading(false);
      setError("決済対象のエントリー情報が見つかりません。");
      return;
    }

    if (!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) {
      setLoading(false);
      setError("Stripe公開キーが未設定です。VITE_STRIPE_PUBLISHABLE_KEY を設定してください。");
      return;
    }

    let active = true;

    const prepare = async () => {
      setLoading(true);
      setError(null);

      try {
        if (useSavedCard) {
          const directResult = await api.post("/payments/stripe/checkout", {
            tournament_entry_id: entryId,
            use_saved_card: true,
          });

          if (directResult?.direct_paid || directResult?.already_paid) {
            navigate(`/tournaments/${id}/entry/complete?payment=success`, { replace: true });
            return;
          }
        }

        const data = await api.post("/payments/intent", {
          tournament_entry_id: entryId,
        });

        if (!active) return;

        if (data?.already_paid) {
          navigate(`/tournaments/${id}/entry/complete`, {
            replace: true,
            state: {
              ...(location.state?.result || {}),
              flash: { type: "success", message: "このエントリーの決済は既に完了しています。" },
            },
          });
          return;
        }

        if (!data?.client_secret) {
          throw new Error("payment_intent_client_secret_missing");
        }

        setClientSecret(data.client_secret);
      } catch (err) {
        if (!active) return;

        const code = err?.data?.error?.code;
        if (code === "no_saved_payment_method") {
          setRequiresCardSetup(true);
          setError("登録カードが見つかりません。先にお支払い情報でカード登録を行ってください。");
          return;
        }

        if (code === "direct_charge_failed") {
          setError("登録カードでの決済に失敗しました。カード情報をご確認ください。");
          return;
        }

        setError("決済画面の表示に失敗しました。時間をおいて再度お試しください。");
      } finally {
        if (active) setLoading(false);
      }
    };

    prepare();

    return () => {
      active = false;
    };
  }, [entryId, id, location.state, navigate, useSavedCard]);

  return (
    <div className="tpay-root">
      <header className="tpay-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1>お支払い</h1>
        <span className="tpay-header-spacer" />
      </header>

      <main className="tpay-main">
        <section className="tpay-card">
          <div className="tpay-info">
            <span className="material-symbols-outlined">lock</span>
            <p>カード情報はStripeにより安全に処理されます。</p>
          </div>

          {loading ? <p className="tpay-status">決済画面を準備しています...</p> : null}
          {error ? <p className="tpay-error">{error}</p> : null}
          {requiresCardSetup ? (
            <button type="button" className="tpay-link-btn" onClick={() => navigate("/payments")}>
              お支払い情報へ
            </button>
          ) : null}

          {!loading && clientSecret ? (
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <TournamentPaymentForm
                tournamentId={id}
                onError={setError}
                onSubmitting={setSubmitting}
                onSuccess={() => navigate(`/tournaments/${id}/entry/complete?payment=success`, { replace: true })}
              />
            </Elements>
          ) : null}

          {submitting ? <p className="tpay-status">決済処理中です。しばらくお待ちください...</p> : null}
        </section>
      </main>
    </div>
  );
}
