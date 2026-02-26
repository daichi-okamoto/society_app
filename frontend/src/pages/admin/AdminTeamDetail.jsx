import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import AdminTeamsBottomNav from "../../components/admin/teams/AdminTeamsBottomNav";

function formatTeamDate(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("ja-JP", { year: "numeric", month: "long", day: "numeric" });
}

function statusLabel(status) {
  if (status === "pending") return "承認待ち";
  if (status === "suspended") return "利用停止中";
  return "承認済み";
}

export default function AdminTeamDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get(`/teams/${id}`)
      .then((res) => {
        if (!active) return;
        setTeam(res?.team || null);
      })
      .catch(() => {
        if (!active) return;
        setTeam(null);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const members = useMemo(() => team?.members || [], [team]);
  const captain = team?.captain || members.find((m) => m.role === "captain") || null;

  const onModerate = async (decision) => {
    if (!team || working) return;
    setWorking(true);
    try {
      await api.patch(`/teams/${team.id}/moderate`, { decision });
      const message = decision === "approve" ? "チームを承認しました。" : "チームを利用停止にしました。";
      navigate("/admin/teams", {
        replace: true,
        state: { flash: { type: "success", message } },
      });
    } catch {
      // noop
    } finally {
      setWorking(false);
    }
  };

  const isPending = team?.status === "pending";
  const canApprove = isPending;
  const canSuspend = team?.status !== "suspended";

  return (
    <div className="adpdetail-root">
      <header className="adpdetail-header">
        <div className="adpdetail-header-row">
          <Link to="/admin/teams" className="adpdetail-back" aria-label="back">
            <span className="material-symbols-outlined">chevron_left</span>
          </Link>
          <h1>チーム詳細</h1>
          <button type="button" className="adpdetail-edit">
            編集
          </button>
        </div>
      </header>

      <main className="adpdetail-main">
        {loading ? <p className="adpdetail-empty">読み込み中...</p> : null}
        {!loading && !team ? <p className="adpdetail-empty">チーム情報を表示できません。</p> : null}

        {team ? (
          <>
            <section className="adpdetail-hero">
              <div className="adpdetail-avatar">
                <span className="material-symbols-outlined">sports_soccer</span>
              </div>
              <div className="adpdetail-chip">{statusLabel(team.status)}</div>
              <h2>{team.name}</h2>
              <p>ID: TM-{String(team.id).padStart(5, "0")}</p>
            </section>

            {(canApprove || canSuspend) ? (
              <section className="adpdetail-actions">
                {canApprove ? (
                  <button type="button" className="approve" disabled={working} onClick={() => onModerate("approve")}>
                    承認する
                  </button>
                ) : (
                  <div />
                )}
                {canSuspend ? (
                  <button type="button" className="suspend" disabled={working} onClick={() => onModerate("suspend")}>
                    利用停止
                  </button>
                ) : (
                  <div />
                )}
              </section>
            ) : null}

            <section className="adpdetail-card">
              <div className="adpdetail-card-head">
                <h3>
                  <span className="material-symbols-outlined">person</span>
                  代表者情報
                </h3>
              </div>
              <div className="adpdetail-card-body">
                <div>
                  <span>氏名</span>
                  <strong>{captain?.name || "未設定"}</strong>
                </div>
                <div>
                  <span>電話番号</span>
                  <strong>{captain?.phone || "未設定"}</strong>
                </div>
                <div>
                  <span>メールアドレス</span>
                  <strong>{captain?.email || "未設定"}</strong>
                </div>
              </div>
            </section>

            <section className="adpdetail-card adpdetail-meta">
              <div>
                <span className="material-symbols-outlined">location_on</span>
                <b>活動拠点</b>
                <strong>{captain?.address || "未設定"}</strong>
              </div>
              <div>
                <span className="material-symbols-outlined">calendar_today</span>
                <b>登録日</b>
                <strong>{formatTeamDate(team.created_at)}</strong>
              </div>
            </section>

            <section className="adpdetail-members">
              <div className="adpdetail-members-head">
                <h3>
                  所属メンバー
                  <small>{members.length}名</small>
                </h3>
              </div>
              <div className="adpdetail-member-list">
                {members.slice(0, 3).map((member) => (
                  <div key={member.id} className="adpdetail-member-item">
                    <div className="left">
                      <div className="icon">
                        <span className="material-symbols-outlined">person</span>
                      </div>
                      <div>
                        <p>{member.name || "未設定"}</p>
                        <span>{member.email || "メール未設定"}</span>
                      </div>
                    </div>
                    <span className={`tag ${member.role === "captain" ? "captain" : ""}`}>
                      {member.role === "captain" ? "代表者・主将" : "一般"}
                    </span>
                  </div>
                ))}
                {members.length > 3 ? <button type="button">全メンバーを表示</button> : null}
              </div>
            </section>
          </>
        ) : null}
      </main>

      <AdminTeamsBottomNav />
    </div>
  );
}
