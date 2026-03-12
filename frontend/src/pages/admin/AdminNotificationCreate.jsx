import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import AdminBottomNav from "../../components/admin/AdminBottomNav";

const DELIVERY_SCOPE_OPTIONS = [
  { value: "everyone", label: "全ユーザー" },
  { value: "tournament_teams", label: "特定の大会参加チーム" },
  { value: "specific_teams", label: "特定のチーム" },
  { value: "captains", label: "各チーム代表者のみ" },
];

export default function AdminNotificationCreate() {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    deliveryScope: "",
    tournamentId: "",
    teamIds: [],
    title: "",
    body: "",
    viaPush: true,
    viaEmail: false,
    sendNow: true,
    scheduledAt: "",
  });

  useEffect(() => {
    let active = true;
    Promise.allSettled([api.get("/tournaments"), api.get("/teams")])
      .then(([tournamentResult, teamResult]) => {
        if (!active) return;
        setTournaments(tournamentResult.status === "fulfilled" ? tournamentResult.value?.tournaments || [] : []);
        setTeams(teamResult.status === "fulfilled" ? teamResult.value?.teams || [] : []);
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const selectedTeams = useMemo(
    () => teams.filter((team) => form.teamIds.includes(String(team.id))),
    [form.teamIds, teams]
  );

  const helperText = useMemo(() => {
    if (!form.deliveryScope) return "配信対象を選択してください。";
    if (form.deliveryScope === "everyone") return "全ユーザーに通知を送信します。";
    if (form.deliveryScope === "tournament_teams") return "選択した大会に参加しているチームへ通知します。";
    if (form.deliveryScope === "specific_teams") {
      return selectedTeams.length > 0 ? `${selectedTeams.length}チームを選択中です。` : "送信先のチームを選択してください。";
    }
    return "各チームの代表者のみに通知します。";
  }, [form.deliveryScope, selectedTeams.length]);

  const canSubmit =
    form.deliveryScope &&
    form.title.trim() &&
    form.body.trim() &&
    (form.viaPush || form.viaEmail) &&
    (form.sendNow || form.scheduledAt) &&
    (form.deliveryScope !== "tournament_teams" || form.tournamentId) &&
    (form.deliveryScope !== "specific_teams" || form.teamIds.length > 0);

  const updateForm = (patch) => {
    setForm((prev) => ({ ...prev, ...patch }));
  };

  const toggleTeam = (teamId) => {
    updateForm({
      teamIds: form.teamIds.includes(teamId)
        ? form.teamIds.filter((id) => id !== teamId)
        : [...form.teamIds, teamId],
    });
  };

  const submit = async (draft) => {
    if (submitting) return;
    setError("");
    setSubmitting(true);
    try {
      await api.post("/notifications", {
        title: form.title.trim(),
        body: form.body.trim(),
        delivery_scope: form.deliveryScope,
        tournament_id: form.tournamentId || null,
        team_ids: form.teamIds.map((id) => Number(id)),
        deliver_via_push: form.viaPush,
        deliver_via_email: form.viaEmail,
        send_now: draft ? false : form.sendNow,
        scheduled_at: draft ? null : form.sendNow ? null : form.scheduledAt,
        draft,
      });
      navigate("/admin/notifications");
    } catch (e) {
      setError(draft ? "下書き保存に失敗しました。" : "通知の送信に失敗しました。");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="adntfc-root">
      <header className="adntfc-header">
        <button type="button" className="adntfc-icon-btn" onClick={() => navigate(-1)} aria-label="back">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1>通知の作成</h1>
        <button type="button" className="adntfc-icon-btn" aria-label="settings">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <main className="adntfc-main">
        <section className="adntfc-section">
          <div className="adntfc-section-head">
            <span className="material-symbols-outlined">group</span>
            <h2>配信対象</h2>
          </div>
          <div className="adntfc-card">
            <label className="adntfc-label" htmlFor="notification-delivery-scope">配信先を選択</label>
            <div className="adntfc-select-wrap">
              <select
                id="notification-delivery-scope"
                value={form.deliveryScope}
                onChange={(e) => updateForm({ deliveryScope: e.target.value, tournamentId: "", teamIds: [] })}
              >
                <option value="">選択してください</option>
                {DELIVERY_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined">expand_more</span>
            </div>
            <p className="adntfc-help">{helperText}</p>

            {form.deliveryScope === "tournament_teams" ? (
              <div className="adntfc-subfield">
                <label className="adntfc-label" htmlFor="notification-tournament">対象大会</label>
                <div className="adntfc-select-wrap">
                  <select id="notification-tournament" value={form.tournamentId} onChange={(e) => updateForm({ tournamentId: e.target.value })}>
                    <option value="">大会を選択してください</option>
                    {tournaments.map((tournament) => (
                      <option key={tournament.id} value={tournament.id}>
                        {tournament.name}
                      </option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined">expand_more</span>
                </div>
              </div>
            ) : null}

            {form.deliveryScope === "specific_teams" ? (
              <div className="adntfc-subfield">
                <label className="adntfc-label">対象チーム</label>
                <div className="adntfc-team-list">
                  {teams.map((team) => {
                    const checked = form.teamIds.includes(String(team.id));
                    return (
                      <label key={team.id} className={`adntfc-team-option ${checked ? "is-selected" : ""}`}>
                        <input type="checkbox" checked={checked} onChange={() => toggleTeam(String(team.id))} />
                        <span>{team.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        </section>

        <section className="adntfc-section">
          <div className="adntfc-section-head">
            <span className="material-symbols-outlined">edit_note</span>
            <h2>通知内容</h2>
          </div>
          <div className="adntfc-card adntfc-stack">
            <div>
              <label className="adntfc-label" htmlFor="notification-title">
                通知タイトル <span>*必須</span>
              </label>
              <input
                id="notification-title"
                type="text"
                maxLength={100}
                placeholder="例：【重要】決勝トーナメントの日程変更について"
                value={form.title}
                onChange={(e) => updateForm({ title: e.target.value })}
              />
            </div>
            <div>
              <label className="adntfc-label" htmlFor="notification-body">
                通知本文 <span>*必須</span>
              </label>
              <textarea
                id="notification-body"
                rows={6}
                maxLength={500}
                placeholder="詳細な内容を入力してください..."
                value={form.body}
                onChange={(e) => updateForm({ body: e.target.value })}
              />
              <div className="adntfc-counter">{form.body.length} / 500文字</div>
            </div>
          </div>
        </section>

        <section className="adntfc-section">
          <div className="adntfc-section-head">
            <span className="material-symbols-outlined">send</span>
            <h2>配信方法</h2>
          </div>
          <div className="adntfc-card adntfc-stack">
            <label className="adntfc-channel">
              <input
                aria-label="アプリ内プッシュ通知"
                type="checkbox"
                checked={form.viaPush}
                onChange={(e) => updateForm({ viaPush: e.target.checked })}
              />
              <div className="adntfc-channel-copy">
                <strong>アプリ内プッシュ通知</strong>
                <small>アプリを利用しているユーザーへ通知します</small>
              </div>
              <span className="material-symbols-outlined">notifications_active</span>
            </label>
            <label className="adntfc-channel">
              <input
                aria-label="メール配信"
                type="checkbox"
                checked={form.viaEmail}
                onChange={(e) => updateForm({ viaEmail: e.target.checked })}
              />
              <div className="adntfc-channel-copy">
                <strong>メール配信</strong>
                <small>登録メールアドレス宛に送信します</small>
              </div>
              <span className="material-symbols-outlined">mail</span>
            </label>
          </div>
        </section>

        <section className="adntfc-section">
          <div className="adntfc-section-head">
            <span className="material-symbols-outlined">schedule</span>
            <h2>配信予約</h2>
          </div>
          <div className="adntfc-card">
            <div className="adntfc-toggle-row">
              <div>
                <strong>即時送信</strong>
                <small>作成完了後すぐに配信を開始します</small>
              </div>
              <label className="adntfc-switch">
                <input
                  aria-label="即時送信"
                  type="checkbox"
                  checked={form.sendNow}
                  onChange={(e) => updateForm({ sendNow: e.target.checked })}
                />
                <span className="adntfc-slider" />
              </label>
            </div>

            <div className={`adntfc-schedule-block ${form.sendNow ? "is-disabled" : ""}`}>
              <label className="adntfc-label" htmlFor="notification-scheduled-at">予約日時</label>
              <input
                id="notification-scheduled-at"
                type="datetime-local"
                value={form.scheduledAt}
                disabled={form.sendNow}
                onChange={(e) => updateForm({ scheduledAt: e.target.value })}
              />
            </div>
          </div>
        </section>

        {error ? <p className="adntfc-error">{error}</p> : null}

        <div className="adntfc-actions">
          <button type="button" className="adntfc-submit" disabled={!canSubmit || submitting || loading} onClick={() => submit(false)}>
            <span className="material-symbols-outlined">send</span>
            送信する
          </button>
          <button type="button" className="adntfc-draft" disabled={submitting || loading} onClick={() => submit(true)}>
            下書き保存
          </button>
        </div>
      </main>

      <AdminBottomNav />
    </div>
  );
}
