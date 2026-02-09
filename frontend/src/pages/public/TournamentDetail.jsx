import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";

export default function TournamentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [entryStatus, setEntryStatus] = useState(null);
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    api
      .get(`/tournaments/${id}`)
      .then((data) => {
        if (!active) return;
        setTournament(data?.tournament || null);
      })
      .catch(() => {
        if (!active) return;
        setError("大会情報の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user) {
      setEntryStatus(null);
      return;
    }
    let active = true;
    api
      .get(`/tournaments/${id}/entries/me`)
      .then((data) => {
        if (!active) return;
        setEntryStatus(data?.entry?.status || null);
      })
      .catch(() => {
        if (!active) return;
        setEntryStatus(null);
      });
    return () => {
      active = false;
    };
  }, [id, user]);

  if (loading) return <section>読み込み中...</section>;
  if (error) return <section>{error}</section>;
  if (!tournament) return <section>大会が見つかりません。</section>;

  return (
    <section>
      <h1>大会詳細</h1>
      <div className="detail-grid">
        <div className="detail-card">
          <div className="detail-item">
            <span className="detail-label">大会名</span>
            <span>{tournament.name}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">開催日</span>
            <span>{tournament.event_date}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">会場</span>
            <span>{tournament.venue}</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">試合時間</span>
            <span>{tournament.match_half_minutes}分ハーフ</span>
          </div>
          <div className="detail-item">
            <span className="detail-label">参加費</span>
            <span>
              {tournament.entry_fee_amount} {tournament.entry_fee_currency}
            </span>
          </div>
          <div className="detail-item">
            <span className="detail-label">キャンセル期限</span>
            <span>{tournament.cancel_deadline_date}</span>
          </div>
        </div>
        <div className="detail-card">
          <div className="detail-actions">
            <Link to={`/tournaments/${tournament.id}/results`}>試合結果を見る</Link>
            <Link to={`/tournaments/${tournament.id}/images`}>画像を見る</Link>
            {user ? (
              <Link to={`/tournaments/${tournament.id}/entry`}>参加申込へ</Link>
            ) : (
              <Link to="/login">ログインして申込</Link>
            )}
          </div>
      {user && (
        <p>
          申込状況:{" "}
          {entryStatus === "approved"
            ? "参加確定"
            : entryStatus === "rejected"
              ? "却下"
              : entryStatus === "cancelled"
                ? "キャンセル済み"
                : entryStatus === "pending"
                  ? "申込済み(承認待ち)"
                  : "未申込"}
        </p>
      )}
        </div>
      </div>
    </section>
  );
}
