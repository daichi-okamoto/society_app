import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";

function normalizeInvitedMember(member) {
  const missingAddress = !String(member?.address || "").trim();
  return {
    id: `team_member-${member.id}`,
    sourceKind: "team_member",
    team_member_id: member.id,
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

function normalizeTeamManualMember(member) {
  const address = `${member?.prefecture || ""}${member?.city_block || ""}${member?.building || ""}`.trim();
  const missingAddress = !address;
  return {
    id: `team_manual-${member.id}`,
    sourceKind: "guest",
    team_member_id: null,
    name: member?.name || "未設定",
    kana: member?.name_kana || "",
    phone: member?.phone || "",
    email: "",
    address,
    status: missingAddress ? "missing_address" : "ready",
    avatar:
      member?.avatar_data_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(member?.name || "Member")}&background=fef3c7&color=b45309&size=128`,
  };
}

function createGuestState(player) {
  return {
    id: player?.id || `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    name: player?.name || "",
    kana: player?.name_kana || "",
    phone: player?.phone || "",
    email: player?.email || "",
    address: player?.address || "",
  };
}

function normalizeGuestFromState(player) {
  return {
    id: `manual-${player.id}`,
    sourceKind: "guest",
    team_member_id: null,
    name: player.name || "未設定",
    kana: player.kana || "",
    phone: player.phone || "",
    email: player.email || "",
    address: player.address || "",
    status: "ready",
    avatar:
      `https://ui-avatars.com/api/?name=${encodeURIComponent(player.name || "Guest")}&background=fef3c7&color=b45309&size=128`,
  };
}

function normalizeRosterPlayer(player) {
  return {
    id: player.id,
    source: player.source,
    team_member_id: player.team_member_id,
    name: player.name || "未設定",
    name_kana: player.name_kana || "",
    phone: player.phone || "",
    email: player.email || "",
    address: player.address || "",
    position: player.position || "",
    jersey_number: player.jersey_number || null,
  };
}

export default function TournamentEntryRoster() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const teamQuery = searchParams.get("team_id") || "";

  const [tournament, setTournament] = useState(null);
  const [teamMembers, setTeamMembers] = useState([]);
  const [manualPlayers, setManualPlayers] = useState([]);
  const [rosterData, setRosterData] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [showAll, setShowAll] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resolvedTeamId, setResolvedTeamId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    kana: "",
    phone: "",
    email: "",
    address: "",
  });
  const isEditMode = searchParams.get("edit") === "1";

  useEffect(() => {
    let active = true;

    async function fetchData() {
      setLoading(true);
      setError("");

      try {
        const tournamentRes = await api.get(`/tournaments/${id}`);
        if (!active) return;
        setTournament(tournamentRes?.tournament || null);

        const teamsRes = await api.get("/teams").catch(() => ({ teams: [] }));
        if (!active) return;

        const memberTeams = (teamsRes?.teams || []).filter((team) => team.is_member);
        const memberTeamIds = new Set(
          memberTeams.map((team) => Number(team.id)).filter((value) => Number.isFinite(value))
        );

        const entryRes = await api.get(`/tournaments/${id}/entries/me`).catch(() => ({ entry: null }));
        if (!active) return;

        const requestedTeamId = Number(teamQuery || 0) || null;
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

        setResolvedTeamId(teamId ? Number(teamId) : null);

        if (!teamId) {
          setTeamMembers([]);
          setRosterData(null);
          setManualPlayers([]);
          setError("この大会のエントリーチーム情報が見つかりませんでした");
          return;
        }

        const [teamRes, rosterRes] = await Promise.all([
          api.get(`/teams/${teamId}`),
          api.get(`/tournaments/${id}/entry_roster?team_id=${teamId}`).catch((e) => {
            if (e?.status === 404) return { roster: null };
            throw e;
          }),
        ]);
        if (!active) return;

        const invitedMembers = Array.isArray(teamRes?.team?.members)
          ? teamRes.team.members.map(normalizeInvitedMember)
          : [];
        const manualTeamMembers = Array.isArray(teamRes?.team?.manual_members)
          ? teamRes.team.manual_members.map(normalizeTeamManualMember)
          : [];

        setTeamMembers([...invitedMembers, ...manualTeamMembers]);

        const nextRoster = rosterRes?.roster
          ? {
              ...rosterRes.roster,
              players: Array.isArray(rosterRes.roster.players)
                ? rosterRes.roster.players.map(normalizeRosterPlayer)
                : [],
            }
          : null;

        setRosterData(nextRoster);

        if (isEditMode && Array.isArray(nextRoster?.players) && nextRoster.players.length > 0) {
          const guests = nextRoster.players.filter((player) => player.source === "guest").map(createGuestState);
          setManualPlayers(guests);

          const invitedIdSet = new Set(invitedMembers.map((member) => member.id));
          const restoredSelection = [];
          nextRoster.players.forEach((player) => {
            if (player.source === "team_member" && player.team_member_id) {
              const memberKey = `team_member-${player.team_member_id}`;
              if (invitedIdSet.has(memberKey)) restoredSelection.push(memberKey);
            } else if (player.source === "guest") {
              const guestKey = `manual-${player.id}`;
              restoredSelection.push(guestKey);
            }
          });
          setSelectedIds(Array.from(new Set(restoredSelection)));
        } else {
          setManualPlayers([]);
          setSelectedIds([]);
        }
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
  }, [id, teamQuery, isEditMode]);

  const rosterManualMembers = useMemo(
    () => manualPlayers.map((player) => normalizeGuestFromState(player)),
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
    if (!Array.isArray(rosterData?.players)) return ids;
    rosterData.players.forEach((player) => {
      if (player?.source === "team_member" && player?.team_member_id) {
        ids.add(`team_member-${player.team_member_id}`);
      }
    });
    return ids;
  }, [rosterData]);

  const submittedPlayers = useMemo(() => {
    if (!Array.isArray(rosterData?.players)) return [];
    return rosterData.players;
  }, [rosterData]);

  const submittedAtLabel = useMemo(() => {
    const at = rosterData?.submitted_at;
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
  }, [rosterData?.submitted_at]);

  const previewSubmitted = submittedPlayers.slice(0, 2);
  const remainSubmittedCount = Math.max(0, submittedPlayers.length - previewSubmitted.length);
  const showSubmittedView = Boolean(rosterData && !isEditMode);

  const canSubmit = selectedMembers.length > 0 && !submitting;

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
      setError("ゲスト追加は名前・ふりがな・電話番号・住所の入力が必要です");
      return;
    }

    const newPlayer = {
      id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
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

  async function submitRoster() {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      const payload = {
        players: selectedMembers.map((member) => {
          if (member.sourceKind === "team_member") {
            return {
              source: "team_member",
              team_member_id: member.team_member_id,
              name: member.name,
              name_kana: member.kana,
              phone: member.phone,
              email: member.email,
              address: member.address,
            };
          }

          return {
            source: "guest",
            name: member.name,
            name_kana: member.kana,
            phone: member.phone,
            email: member.email,
            address: member.address,
          };
        }),
      };

      const query = resolvedTeamId ? `?team_id=${resolvedTeamId}` : "";
      const result = await api.post(`/tournaments/${id}/entry_roster${query}`, payload);
      setRosterData(result?.roster || null);

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
                      player.source === "team_member"
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
                        <p>{player?.name_kana || "ふりがな未設定"}</p>
                      </div>
                    </div>
                    <span className={`chip ${player?.source === "team_member" ? "member" : "guest"}`}>
                      {player?.source === "team_member" ? "チームメンバー" : "ゲスト"}
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
              <h3>ゲスト選手を追加</h3>
              <small>(この大会のみ)</small>
            </div>
          </div>

          <p className="roster-submit-help">ここで追加した選手は、この大会の名簿のみに保存されます。チームメンバー一覧には追加されません。</p>

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
              <span>ゲスト選手を追加する</span>
            </button>
          </div>

          {rosterManualMembers.length > 0 ? (
            <div className="roster-submit-manual-added">
              <p className="label">大会限定ゲスト ({rosterManualMembers.length}名)</p>
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
