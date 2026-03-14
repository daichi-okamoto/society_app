import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";

function formatRequestedAt(value) {
  if (!value) return "日時不明";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "日時不明";

  return new Intl.DateTimeFormat("ja-JP", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function TeamRequests() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [updatingId, setUpdatingId] = useState(null);

  const load = () => {
    setLoading(true);
    setError(null);
    api
      .get(`/teams/${id}/join-requests`)
      .then((data) => setRequests(data?.join_requests || []))
      .catch(() => setError("申請一覧の取得に失敗しました"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, [id]);

  const decide = async (requestId, status) => {
    setUpdatingId(requestId);
    setError(null);
    setMessage("");

    try {
      await api.patch(`/team-join-requests/${requestId}`, { status });
      setMessage(status === "approved" ? "参加申請を承認しました。" : "参加申請を拒否しました。");
      load();
    } catch {
      setError("更新に失敗しました");
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <LoadingScreen />;
  if (error) return <section>{error}</section>;

  return (
    <div className="tr-root">
      <header className="tr-header">
        <div className="tr-header-row">
          <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1>参加申請</h1>
        </div>
        <p>申請者を確認して承認または拒否できます。</p>
      </header>

      <main className="tr-main">
        {message ? <p className="tr-message success">{message}</p> : null}
        {requests.length === 0 ? (
          <section className="tr-empty">現在、承認待ちの申請はありません。</section>
        ) : (
          <div className="tr-list">
            {requests.map((request) => (
              <article key={request.id} className="tr-card">
                <div className="tr-card-head">
                  <div className="tr-avatar" aria-hidden="true">
                    {(request.user_name || "?").slice(0, 1)}
                  </div>
                  <div>
                    <h2>{request.user_name || `ユーザーID: ${request.user_id}`}</h2>
                    <p>{formatRequestedAt(request.requested_at)} に申請</p>
                  </div>
                </div>

                <dl className="tr-meta">
                  <div>
                    <dt>メール</dt>
                    <dd>{request.user_email || "未登録"}</dd>
                  </div>
                  <div>
                    <dt>電話番号</dt>
                    <dd>{request.user_phone || "未登録"}</dd>
                  </div>
                </dl>

                <div className="tr-actions">
                  <button
                    type="button"
                    className="approve"
                    disabled={updatingId === request.id}
                    onClick={() => decide(request.id, "approved")}
                  >
                    承認
                  </button>
                  <button
                    type="button"
                    className="reject"
                    disabled={updatingId === request.id}
                    onClick={() => decide(request.id, "rejected")}
                  >
                    拒否
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>

      <nav className="tm-nav">
        <div className="tm-nav-row">
          <Link to="/app/home" className="tm-nav-item">
            <span className="material-symbols-outlined">home</span>
            <span>ホーム</span>
          </Link>
          <Link to="/tournaments" className="tm-nav-item">
            <span className="material-symbols-outlined">search</span>
            <span>さがす</span>
          </Link>
          <div className="tm-nav-center">
            <button type="button" aria-label="ブランドロゴ">
              <span className="material-symbols-outlined">sports_soccer</span>
            </button>
          </div>
          <Link to="/teams" className="tm-nav-item active">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/me" className="tm-nav-item">
            <span className="material-symbols-outlined">person</span>
            <span>マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
