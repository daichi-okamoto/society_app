import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../../lib/api";

export default function TeamRequests() {
  const { id } = useParams();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = () => {
    setLoading(true);
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
    try {
      await api.patch(`/team-join-requests/${requestId}`, { status });
      load();
    } catch {
      setError("更新に失敗しました");
    }
  };

  if (loading) return <section>読み込み中...</section>;
  if (error) return <section>{error}</section>;

  return (
    <section>
      <h1>参加申請管理</h1>
      {requests.length === 0 ? (
        <p>申請はありません。</p>
      ) : (
        <ul>
          {requests.map((r) => (
            <li key={r.id}>
              {r.user_id} / {r.status}
              <button onClick={() => decide(r.id, "approved")}>承認</button>
              <button onClick={() => decide(r.id, "rejected")}>却下</button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
