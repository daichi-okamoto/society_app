import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import AdminBottomNav from "../../components/admin/AdminBottomNav";

function roleLabel(member) {
  return member?.role === "captain" ? "代表者" : "メンバー";
}

export default function AdminMessages() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [teamDetail, setTeamDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    teamId: "",
    memberId: "",
    subject: "",
    body: "",
  });

  useEffect(() => {
    let active = true;
    setLoading(true);
    api
      .get("/teams?limit=100")
      .then((data) => {
        if (!active) return;
        setTeams(data?.teams || []);
      })
      .catch(() => {
        if (!active) return;
        setError("チーム一覧の取得に失敗しました。");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!form.teamId) {
      setTeamDetail(null);
      setForm((prev) => ({ ...prev, memberId: "" }));
      return;
    }

    let active = true;
    setLoadingMembers(true);
    setError("");
    api
      .get(`/teams/${form.teamId}`)
      .then((data) => {
        if (!active) return;
        const detail = data?.team || null;
        setTeamDetail(detail);
        const captain = (detail?.members || []).find((member) => member.role === "captain");
        setForm((prev) => ({
          ...prev,
          memberId: captain ? String(captain.user_id) : String(detail?.members?.[0]?.user_id || ""),
        }));
      })
      .catch(() => {
        if (!active) return;
        setTeamDetail(null);
        setError("チームメンバーを取得できませんでした。");
      })
      .finally(() => {
        if (!active) return;
        setLoadingMembers(false);
      });

    return () => {
      active = false;
    };
  }, [form.teamId]);

  const members = useMemo(() => teamDetail?.members || [], [teamDetail]);
  const selectedMember = useMemo(
    () => members.find((member) => String(member.user_id) === String(form.memberId)) || null,
    [form.memberId, members]
  );

  const canSubmit = form.teamId && form.memberId && form.subject.trim() && form.body.trim();

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit || submitting) return;

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/messages", {
        to_user_id: Number(form.memberId),
        subject: form.subject.trim(),
        body: form.body.trim(),
      });
      setSuccess("メッセージを送信しました。");
      setForm((prev) => ({ ...prev, subject: "", body: "" }));
    } catch {
      setError("メッセージの送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admsg-root">
      <header className="admsg-header">
        <div className="admsg-header-row">
          <button type="button" className="admsg-icon-btn" onClick={() => navigate(-1)} aria-label="back">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1>個別連絡</h1>
          <div className="admsg-header-spacer" aria-hidden="true" />
        </div>
      </header>

      <main className="admsg-main">
        <form className="admsg-form" onSubmit={handleSubmit}>
          <section className="admsg-card">
            <div className="admsg-card-head">
              <span className="material-symbols-outlined">groups</span>
              <h2>送信先</h2>
            </div>

            <label className="admsg-label" htmlFor="admin-message-team">チーム</label>
            <div className="admsg-select-wrap">
              <select
                id="admin-message-team"
                value={form.teamId}
                onChange={(event) => updateForm({ teamId: event.target.value })}
                disabled={loading}
              >
                <option value="">チームを選択してください</option>
                {teams.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined">expand_more</span>
            </div>

            <label className="admsg-label" htmlFor="admin-message-member">宛先メンバー</label>
            <div className="admsg-select-wrap">
              <select
                id="admin-message-member"
                value={form.memberId}
                onChange={(event) => updateForm({ memberId: event.target.value })}
                disabled={!form.teamId || loadingMembers}
              >
                <option value="">{loadingMembers ? "読み込み中..." : "メンバーを選択してください"}</option>
                {members.map((member) => (
                  <option key={member.id} value={member.user_id}>
                    {member.name} / {roleLabel(member)}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined">expand_more</span>
            </div>

            {selectedMember ? (
              <div className="admsg-recipient">
                <strong>{selectedMember.name}</strong>
                <span>{roleLabel(selectedMember)}</span>
                <small>{selectedMember.email || "メール未設定"}</small>
              </div>
            ) : null}
          </section>

          <section className="admsg-card">
            <div className="admsg-card-head">
              <span className="material-symbols-outlined">mail</span>
              <h2>メッセージ内容</h2>
            </div>

            <label className="admsg-label" htmlFor="admin-message-subject">件名</label>
            <input
              id="admin-message-subject"
              type="text"
              maxLength={100}
              value={form.subject}
              onChange={(event) => updateForm({ subject: event.target.value })}
              placeholder="例: 提出書類の確認をお願いします"
            />

            <label className="admsg-label" htmlFor="admin-message-body">本文</label>
            <textarea
              id="admin-message-body"
              rows={8}
              maxLength={1000}
              value={form.body}
              onChange={(event) => updateForm({ body: event.target.value })}
              placeholder="連絡事項を入力してください"
            />
            <div className="admsg-counter">{form.body.length} / 1000文字</div>
          </section>

          {error ? <p className="admsg-feedback is-error">{error}</p> : null}
          {success ? <p className="admsg-feedback is-success">{success}</p> : null}

          <button type="submit" className="admsg-submit" disabled={!canSubmit || submitting}>
            <span className="material-symbols-outlined">send</span>
            {submitting ? "送信中..." : "メッセージを送信"}
          </button>
        </form>
      </main>

      <AdminBottomNav />
    </div>
  );
}
