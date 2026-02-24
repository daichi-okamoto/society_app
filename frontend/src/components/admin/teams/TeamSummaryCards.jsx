export default function TeamSummaryCards({ totalCount, pendingCount, onPendingClick }) {
  return (
    <section className="adteam-summary-grid">
      <article className="adteam-summary-card">
        <span>
          <span className="material-symbols-outlined">groups</span>
          総チーム数
        </span>
        <div>
          <strong>{totalCount}</strong>
          <small>団体</small>
        </div>
      </article>

      <button type="button" className="adteam-summary-card adteam-pending-card" onClick={onPendingClick}>
        <span className="material-symbols-outlined adteam-bg-icon">notification_important</span>
        <span>
          <span className="material-symbols-outlined">pending_actions</span>
          承認待ち
        </span>
        <div>
          <div className="adteam-pending-main">
            <strong>{pendingCount}</strong>
            <small>件</small>
          </div>
          <span className="material-symbols-outlined">arrow_forward_ios</span>
        </div>
      </button>
    </section>
  );
}
