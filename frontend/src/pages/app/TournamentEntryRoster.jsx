import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";

const MANUAL_KEY_PREFIX = "roster-manual:";
const SUBMIT_KEY_PREFIX = "roster-submit:";

function manualKey(tournamentId) {
  return `${MANUAL_KEY_PREFIX}${tournamentId}`;
}

function submitKey(tournamentId) {
  return `${SUBMIT_KEY_PREFIX}${tournamentId}`;
}

function loadManualPlayers(tournamentId) {
  if (!tournamentId || typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(manualKey(tournamentId));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveManualPlayers(tournamentId, players) {
  if (!tournamentId || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(manualKey(tournamentId), JSON.stringify(players));
  } catch {
    // ignore
  }
}

function normalizeApiMember(member) {
  const missingAddress = !String(member?.address || "").trim();
  return {
    id: `api-${member.id}`,
    source: "api",
    rawId: member.id,
    name: member?.name || "未設定",
    kana: member?.name_kana || "",
    phone: member?.phone || "",
    email: member?.email || "",
    address: member?.address || "",
    status: missingAddress ? "missing_address" : "ready",
    avatar:
      member?.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(member?.name || "Member")}&background=e2e8f0&color=334155&size=128`,
  };
}

function normalizeManualPlayer(player, index) {
  return {
    id: `manual-${player.id || index}`,
    source: "manual",
    rawId: player.id || index,
    name: player.name || "未設定",
    kana: player.kana || "",
    phone: player.phone || "",
    email: player.email || "",
    address: player.address || "",
    status: "ready",
    avatar:
      player.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name || "Guest")}&background=fef3c7&color=b45309&size=128`,
  };
}

export default function TournamentEntryRoster() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tournament, setTournament] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [manualPlayers, setManualPlayers] = useState(() => loadManualPlayers(id));
  const [submittedPayload, setSubmittedPayload] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    kana: "",
    phone: "",
    email: "",
    address: "",
  });
  const isEditMode = searchParams.get("edit") === "1";

  useEffect(() => {
    saveManualPlayers(id, manualPlayers);
  }, [id, manualPlayers]);

  useEffect(() => {
    if (!id || typeof window === "undefined") {
      setSubmittedPayload(null);
      return;
    }
    try {
      const raw = window.sessionStorage.getItem(submitKey(id));
      const parsed = raw ? JSON.parse(raw) : null;
      setSubmittedPayload(parsed && Array.isArray(parsed.players) ? parsed : null);
    } catch {
      setSubmittedPayload(null);
    }
  }, [id]);

  useEffect(() => {
    let active = true;

    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const tournamentRes = await api.get(`/tournaments/${id}`);
        if (!active) return;
        const currentTournament = tournamentRes?.tournament || null;
        setTournament(currentTournament);

        const teamsRes = await api.get("/teams").catch(() => ({ teams: [] }));
        if (!active) return;
        const memberTeamIds = new Set(
          (teamsRes?.teams || [])
            .filter((team) => team.is_member)
            .map((team) => Number(team.id))
            .filter((value) => Number.isFinite(value))
        );

        const entryRes = await api.get(`/tournaments/${id}/entries/me`).catch(() => ({ entry: null }));
        if (!active) return;

        const requestedTeamId = Number(searchParams.get("team_id") || 0) || null;
        const entryTeamId = Number(entryRes?.entry?.team_id || 0) || null;
        const activeTeamId =
          typeof window !== "undefined"
            ? Number(window.sessionStorage.getItem("active_team_id") || 0) || null
            : null;
        const teamId =
          activeTeamId && memberTeamIds.has(activeTeamId)
            ? activeTeamId
            : requestedTeamId && memberTeamIds.has(requestedTeamId)
              ? requestedTeamId
            : entryTeamId && memberTeamIds.has(entryTeamId)
              ? entryTeamId
              : null;

        if (!teamId) {
          setTeamMembers([]);
          setError("この大会のエントリーチーム情報が見つかりませんでした");
          return;
        }

        const teamRes = await api.get(`/teams/${teamId}`);
        if (!active) return;
        const apiMembers = (teamRes?.team?.members || []).map(normalizeApiMember);
        setTeamMembers(apiMembers);
      } catch {
        if (!active) return;
        setError("名簿情報の取得に失敗しました");
      } finally {
        if (!active) return;
        setLoading(false);
      }
    }

    fetchData();

    return () => {
      active = false;
    };
  }, [id, searchParams]);

  const rosterManualMembers = useMemo(
    () => manualPlayers.map((player, index) => normalizeManualPlayer(player, index)),
    [manualPlayers]
  );

  const selectableMembers = useMemo(
    () => [...teamMembers, ...rosterManualMembers],
    [teamMembers, rosterManualMembers]
  );

  useEffect(() => {
    if (selectableMembers.length === 0) {
      setSelectedIds([]);
      return;
    }
    setSelectedIds((prev) =>
      prev.filter((idValue) => selectableMembers.some((member) => member.id === idValue))
    );
  }, [selectableMembers]);

  const visibleMembers = useMemo(() => {
    if (showAll) return teamMembers;
    return teamMembers.slice(0, 3);
  }, [teamMembers, showAll]);

  const selectedMembers = useMemo(
    () => selectableMembers.filter((member) => selectedIds.includes(member.id)),
    [selectableMembers, selectedIds]
  );
  const submittedIdSet = useMemo(() => {
    const ids = new Set();
    if (!Array.isArray(submittedPayload?.players)) return ids;
    submittedPayload.players.forEach((player) => {
      if (player?.id) ids.add(String(player.id));
    });
    return ids;
  }, [submittedPayload]);
  const submittedPlayers = useMemo(() => {
    if (!Array.isArray(submittedPayload?.players)) return [];
    return submittedPayload.players;
  }, [submittedPayload]);
  const submittedAtLabel = useMemo(() => {
    const at = submittedPayload?.submitted_at;
    if (!at) return "提出日時不明";
    const dt = new Date(at);
    if (Number.isNaN(dt.getTime())) return "提出日時不明";
    return dt.toLocaleString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  }, [submittedPayload?.submitted_at]);
  const previewSubmitted = submittedPlayers.slice(0, 2);
  const remainSubmittedCount = Math.max(0, submittedPlayers.length - previewSubmitted.length);
  const showSubmittedView = Boolean(submittedPayload && !isEditMode);

  const canSubmit = selectedMembers.length > 0 && !submitting;

  useEffect(() => {
    if (!isEditMode) return;
    if (!Array.isArray(submittedPayload?.players) || submittedPayload.players.length === 0) return;
    if (selectableMembers.length === 0) return;

    const existingIds = new Set(selectableMembers.map((member) => String(member.id)));
    const restored = submittedPayload.players
      .map((player) => String(player?.id || ""))
      .filter((idValue) => idValue && existingIds.has(idValue));

    if (restored.length === 0) return;
    setSelectedIds((prev) => {
      if (prev.length > 0) return prev;
      return Array.from(new Set(restored));
    });
  }, [isEditMode, selectableMembers, submittedPayload]);

  function toggleSelected(memberId) {
    setSelectedIds((prev) =>
      prev.includes(memberId) ? prev.filter((idValue) => idValue !== memberId) : [...prev, memberId]
    );
  }

  function removeSelected(memberId) {
    setSelectedIds((prev) => prev.filter((idValue) => idValue !== memberId));
  }

  function removeManualAddedPlayer(memberId) {
    const rawId = String(memberId).replace(/^manual-/, "");
    setManualPlayers((prev) => prev.filter((player) => String(player.id) !== rawId));
    setSelectedIds((prev) => prev.filter((idValue) => idValue !== memberId));
  }

  function updateForm(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function addManualPlayer() {
    const name = form.name.trim();
    const kana = form.kana.trim();
    const phone = form.phone.trim();
    const email = form.email.trim();
    const address = form.address.trim();

    if (!name || !kana || !phone || !address) {
      setError("手動追加は名前・ふりがな・電話番号・住所の入力が必要です");
      return;
    }

    const newPlayer = {
      id: Date.now(),
      name,
      kana,
      phone,
      email,
      address,
    };

    setError("");
    setManualPlayers((prev) => [...prev, newPlayer]);
    setSelectedIds((prev) => [...prev, `manual-${newPlayer.id}`]);
    setForm({ name: "", kana: "", phone: "", email: "", address: "" });
    setShowAll(true);
  }

  function submitRoster() {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      if (typeof window !== "undefined") {
        const payload = {
          tournament_id: Number(id),
          submitted_at: new Date().toISOString(),
          players: selectedMembers.map((member) => ({
            id: member.id,
            source: member.source,
            name: member.name,
            kana: member.kana,
            phone: member.phone,
            email: member.email,
            address: member.address,
          })),
        };
        window.sessionStorage.setItem(submitKey(id), JSON.stringify(payload));
        setSubmittedPayload(payload);
      }

      const teamQuery = searchParams.get("team_id");
      navigate(`/tournaments/${id}/entry/review/roster${teamQuery ? `?team_id=${teamQuery}` : ""}`, {
        state: { flash: { type: "success", message: "選手名簿の提出が完了しました" } },
      });
    } catch {
      setError("名簿提出に失敗しました。時間をおいて再度お試しください。");
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingScreen />;

  if (showSubmittedView) {
    const teamQuery = searchParams.get("team_id");
    const editLink = `/tournaments/${id}/entry/review/roster?edit=1${teamQuery ? `&team_id=${teamQuery}` : ""}`;

    return (
      <div className="roster-submit-root">
        <header className="roster-submit-header">
          <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
            <span className="material-symbols-outlined">chevron_left</span>
          </button>
          <h1>提出済み名簿の確認</h1>
        </header>

        <main className="roster-submit-main submitted">
          <section className="roster-submitted-summary">
            <div className="top">
              <div>
                <p>対象大会</p>
                <h2>{tournament?.name || "大会名未設定"}</h2>
              </div>
              <div className="status">
                <span>提出済み</span>
                <small>{submittedAtLabel}</small>
              </div>
            </div>
            <div className="submitted-count">
              <div className="avatars">
                {previewSubmitted.map((player, idx) => (
                  <img
                    key={`${player.id || player.name || idx}`}
                    src={
                      player.source === "api"
                        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name || "Member")}&background=e2e8f0&color=334155&size=64`
                        : `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name || "Guest")}&background=fef3c7&color=b45309&size=64`
                    }
                    alt={player.name || "選手"}
                  />
                ))}
                {remainSubmittedCount > 0 ? <em>+{remainSubmittedCount}</em> : null}
              </div>
              <p>合計 {submittedPlayers.length}名 の選手を提出しました</p>
            </div>
          </section>

          <section className="roster-submit-section">
            <div className="roster-submit-section-head solo">
              <div className="left">
                <span className="bar" />
                <h3>提出選手一覧</h3>
              </div>
            </div>
            <div className="roster-submitted-list">
              {submittedPlayers.map((player, idx) => (
                <article key={`${player.id || player.name || idx}-${idx}`} className="roster-submitted-card">
                  <div className="head">
                    <div className="left">
                      <div className="avatar">
                        <span>{String(player?.name || "選手").slice(0, 2)}</span>
                      </div>
                      <div>
                        <h4>{player?.name || "未設定"}</h4>
                        <p>{player?.kana || "ふりがな未設定"}</p>
                      </div>
                    </div>
                    <span className={`chip ${player?.source === "api" ? "member" : "guest"}`}>
                      {player?.source === "api" ? "チームメンバー" : "ゲスト"}
                    </span>
                  </div>
                  <div className="meta">
                    <div><small>電話番号</small><span>{player?.phone || "-"}</span></div>
                    <div><small>メール</small><span>{player?.email || "-"}</span></div>
                    <div><small>住所</small><span>{player?.address || "-"}</span></div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </main>

        <div className="roster-submit-footer">
          <Link to={editLink} className="resubmit-link">
            <span className="material-symbols-outlined">edit_note</span>
            <span>名簿を再提出する</span>
          </Link>
          <p className="deadline-note">提出期限まで修正可能です</p>
        </div>
      </div>
    );
  }

  return (
    <div className="roster-submit-root">
      <header className="roster-submit-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">chevron_left</span>
        </button>
        <h1>参加選手名簿の提出</h1>
      </header>

      <main className="roster-submit-main">
        <section className="roster-submit-tournament">
          <p>対象大会</p>
          <h2>{tournament?.name || "大会名未設定"}</h2>
        </section>

        <section className="roster-submit-section">
          <div className="roster-submit-section-head">
            <div className="left">
              <span className="bar" />
              <h3>チームメンバーから選択</h3>
            </div>
            <span className="count">全{teamMembers.length}名</span>
          </div>

          <div className="roster-submit-member-list">
            {visibleMembers.map((member) => {
              const checked = selectedIds.includes(member.id);
              return (
                <label key={member.id} className="roster-submit-member-card">
                  <div className="left">
                    <div className="avatar-wrap">
                      <img src={member.avatar} alt={member.name} />
                      <span className={`status-dot ${member.status === "ready" ? "ok" : "warn"}`} />
                    </div>
                    <div>
                      <h4>
                        <span>{member.name}</span>
                        {submittedIdSet.has(String(member.id)) ? <em className="submitted-chip">申請済み</em> : null}
                      </h4>
                      {member.status === "ready" ? (
                        <p>{member.kana ? `${member.kana} • ` : ""}情報入力済み</p>
                      ) : (
                        <p className="warn-text">
                          <span className="material-symbols-outlined">error</span>
                          住所未登録
                        </p>
                      )}
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleSelected(member.id)}
                    aria-label={`${member.name}を選択`}
                  />
                </label>
              );
            })}
          </div>

          {teamMembers.length > 3 ? (
            <button type="button" className="roster-submit-show-more" onClick={() => setShowAll((prev) => !prev)}>
              <span>{showAll ? "表示をたたむ" : "他のチームメンバーを表示"}</span>
              <span className="material-symbols-outlined">{showAll ? "keyboard_arrow_up" : "keyboard_arrow_down"}</span>
            </button>
          ) : null}
        </section>

        <section className="roster-submit-section">
          <div className="roster-submit-section-head solo">
            <div className="left">
              <span className="bar" />
              <h3>手動で選手を追加</h3>
              <small>(ゲスト選手など)</small>
            </div>
          </div>

          <div className="roster-submit-manual-form">
            <div className="grid-two">
              <div>
                <label>名前</label>
                <input type="text" value={form.name} onChange={(e) => updateForm("name", e.target.value)} placeholder="山田 太郎" />
              </div>
              <div>
                <label>ふりがな</label>
                <input type="text" value={form.kana} onChange={(e) => updateForm("kana", e.target.value)} placeholder="やまだ たろう" />
              </div>
            </div>

            <div>
              <label>電話番号</label>
              <input type="tel" value={form.phone} onChange={(e) => updateForm("phone", e.target.value)} placeholder="090-0000-0000" />
            </div>

            <div>
              <label>メールアドレス</label>
              <input type="email" value={form.email} onChange={(e) => updateForm("email", e.target.value)} placeholder="example@mail.com" />
            </div>

            <div>
              <label>住所</label>
              <textarea rows={2} value={form.address} onChange={(e) => updateForm("address", e.target.value)} placeholder="東京都渋谷区..." />
            </div>

            <button type="button" className="add-manual-btn" onClick={addManualPlayer}>
              <span className="material-symbols-outlined">add_circle</span>
              <span>選手を追加する</span>
            </button>
          </div>

          {rosterManualMembers.length > 0 ? (
            <div className="roster-submit-manual-added">
              <p className="label">手動追加済み選手 ({rosterManualMembers.length}名)</p>
              <div className="selected-chip-wrap">
                {rosterManualMembers.map((member) => (
                  <div key={`manual-added-${member.id}`} className="selected-chip">
                    <span>{member.name}</span>
                    <div className="selected-chip-actions">
                      <button
                        type="button"
                        onClick={() => toggleSelected(member.id)}
                        aria-label={`${member.name}を${selectedIds.includes(member.id) ? "選択解除" : "選択"}する`}
                        title={selectedIds.includes(member.id) ? "選択解除" : "選択"}
                      >
                        <span className="material-symbols-outlined">
                          {selectedIds.includes(member.id) ? "check" : "add"}
                        </span>
                      </button>
                      <button
                        type="button"
                        className="danger"
                        onClick={() => removeManualAddedPlayer(member.id)}
                        aria-label={`${member.name}を削除`}
                        title="削除"
                      >
                        <span className="material-symbols-outlined">close</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </section>

        <section className="roster-submit-section">
          <div className="roster-submit-section-head solo">
            <div className="left">
              <span className="bar" />
              <h3>選択中の選手 ({selectedMembers.length}名)</h3>
            </div>
          </div>

          <div className="selected-chip-wrap">
            {selectedMembers.length === 0 ? (
              <span className="empty">選手が選択されていません</span>
            ) : (
              selectedMembers.map((member) => (
                <div key={`selected-${member.id}`} className="selected-chip">
                  <span>{member.name}</span>
                  <button type="button" onClick={() => removeSelected(member.id)} aria-label={`${member.name}を選択解除`}>
                    <span className="material-symbols-outlined">close</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </section>

        {error ? <p className="roster-submit-error">{error}</p> : null}
      </main>

      <div className="roster-submit-footer">
        <button type="button" onClick={submitRoster} disabled={!canSubmit}>
          <span>{submitting ? "提出中..." : "名簿を提出する"}</span>
          <span className="material-symbols-outlined">send</span>
        </button>
      </div>
    </div>
  );
}
