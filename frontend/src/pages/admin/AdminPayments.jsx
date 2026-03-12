import { useEffect, useMemo, useState } from "react";
import AdminBottomNav from "../../components/admin/AdminBottomNav";
import { api } from "../../lib/api";

function formatYen(amount) {
  return `¥${Number(amount || 0).toLocaleString("ja-JP")}`;
}

function formatDate(value) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

function statusLabel(status) {
  switch (status) {
    case "paid":
      return "完了";
    case "pending":
      return "未決済";
    case "refunded":
      return "返金済み";
    case "failed":
      return "失敗";
    default:
      return status;
  }
}

function statusClass(status) {
  switch (status) {
    case "paid":
      return "done";
    case "pending":
      return "pending";
    case "refunded":
      return "refund";
    case "failed":
      return "failed";
    default:
      return "pending";
  }
}

function methodMeta(method) {
  if (method === "card") return { icon: "credit_card", label: "カード決済" };
  return { icon: "storefront", label: "現地決済" };
}

export default function AdminPayments() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [payments, setPayments] = useState([]);

  const loadPayments = async (nextFilter = filter, nextSearch = search) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (nextFilter && nextFilter !== "all") params.set("status", nextFilter);
      if (nextSearch?.trim()) params.set("q", nextSearch.trim());
      const query = params.toString();
      const data = await api.get(`/admin/payments${query ? `?${query}` : ""}`);
      setSummary(data?.summary || null);
      setAlerts(data?.alerts || []);
      setPayments(data?.payments || []);
    } catch {
      setError("決済データの取得に失敗しました。");
      setSummary(null);
      setAlerts([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visiblePayments = useMemo(() => payments, [payments]);

  const onApplyFilter = (nextFilter) => {
    setFilter(nextFilter);
    loadPayments(nextFilter, search);
  };

  const onSearchSubmit = (event) => {
    event.preventDefault();
    loadPayments(filter, search);
  };

  const onRefund = async (item) => {
    if (!window.confirm(`${item.team_name || "このチーム"}の決済を返金します。よろしいですか？`)) return;

    try {
      await api.post(`/payments/${item.id}/refund`, {});
      await loadPayments(filter, search);
    } catch (err) {
      const message = err?.data?.error?.message || "返金処理に失敗しました。";
      setError(message);
    }
  };

  return (
    <div className="adpay-root">
      <header className="adpay-header">
        <div className="adpay-header-row">
          <h1>決済管理</h1>
          <button type="button" className="adpay-filter-btn" aria-label="filter">
            <span className="material-symbols-outlined">filter_list</span>
          </button>
        </div>

        <form className="adpay-search-wrap" onSubmit={onSearchSubmit}>
          <span className="material-symbols-outlined">search</span>
          <input
            type="text"
            placeholder="チーム名・大会名で検索"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </form>

        <div className="adpay-filter-row">
          <button type="button" className={filter === "all" ? "active" : ""} onClick={() => onApplyFilter("all")}>
            すべて
          </button>
          <button type="button" className={filter === "done" ? "active" : ""} onClick={() => onApplyFilter("done")}>
            完了
          </button>
          <button
            type="button"
            className={filter === "pending" ? "active" : ""}
            onClick={() => onApplyFilter("pending")}
          >
            未完了
          </button>
          <button
            type="button"
            className={filter === "refund" ? "active" : ""}
            onClick={() => onApplyFilter("refund")}
          >
            返金済み
          </button>
          <button
            type="button"
            className={filter === "failed" ? "active" : ""}
            onClick={() => onApplyFilter("failed")}
          >
            失敗
          </button>
        </div>
      </header>

      <main className="adpay-main">
        {error ? <p className="adpay-error">{error}</p> : null}

        <section className="adpay-summary">
          <div className="bg-icon">
            <span className="material-symbols-outlined">payments</span>
          </div>
          <p>{`${new Date().getFullYear()}年${new Date().getMonth() + 1}月 月間総売上`}</p>
          <h2>{formatYen(summary?.monthly_revenue || 0)}</h2>
          <div className="adpay-summary-grid">
            <div>
              <small>
                <i className="dot amber" />
                未決済件数
              </small>
              <strong>
                {summary?.pending_count || 0} <span>件</span>
              </strong>
            </div>
            <div>
              <small>
                <i className="dot red" />
                返金件数
              </small>
              <strong>
                {summary?.refunded_count || 0} <span>件</span>
              </strong>
            </div>
          </div>
        </section>

        {alerts.length > 0 ? (
          <section className="adpay-alerts">
            {alerts.map((alert) => (
              <article key={alert.code} className={`adpay-alert adpay-alert--${alert.level}`}>
                <span className="material-symbols-outlined">warning</span>
                <div>
                  <p>{alert.message}</p>
                  <small>{alert.count}件</small>
                </div>
              </article>
            ))}
          </section>
        ) : null}

        <section className="adpay-list-wrap">
          <div className="adpay-list-head">
            <h3>最近の取引</h3>
            <button type="button" onClick={() => loadPayments(filter, search)}>
              更新
            </button>
          </div>

          <div className="adpay-list">
            {loading ? <p className="adpay-empty">読み込み中...</p> : null}
            {!loading && visiblePayments.length === 0 ? <p className="adpay-empty">取引データがありません</p> : null}

            {visiblePayments.map((item) => {
              const status = statusClass(item.status);
              const method = methodMeta(item.method);
              return (
                <article key={item.id} className={`adpay-item ${status}`}>
                  <div className="adpay-item-main">
                    <div>
                      <div className="adpay-meta">
                        <span className={`adpay-status ${status}`}>{statusLabel(item.status)}</span>
                        <span className="adpay-date">{formatDate(item.paid_at || item.refunded_at || item.created_at)}</span>
                      </div>
                      <h4>{item.team_name || "チーム不明"}</h4>
                      <p>{item.tournament_name || "大会不明"}</p>
                    </div>
                    <div className="adpay-amount">
                      <strong>{formatYen(item.status === "refunded" ? -(item.refund_amount || item.amount || 0) : item.amount)}</strong>
                      <div>
                        <span className="material-symbols-outlined">{method.icon}</span>
                        <span>{method.label}</span>
                      </div>
                    </div>
                  </div>

                  {item.refundable ? (
                    <div className="adpay-item-foot">
                      <button type="button" className="danger" onClick={() => onRefund(item)}>
                        返金処理を実行
                      </button>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        </section>
      </main>

      <AdminBottomNav />
    </div>
  );
}
