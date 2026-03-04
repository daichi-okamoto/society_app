import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";
import AdminBottomNav from "../../components/admin/AdminBottomNav";

const COURT_OPTIONS = ["Aコート", "Bコート", "Cコート"];

function normalizeGroupLabel(raw) {
  const text = String(raw || "").trim();
  if (!text) return "";
  if (text === "決勝T" || text.toLowerCase() === "knockout") return "決勝T";
  const g1 = text.match(/グループ\s*([A-Za-z0-9]+)/i);
  if (g1?.[1]) return `グループ${g1[1].toUpperCase()}`;
  const g2 = text.match(/^([A-Za-z0-9]+)\s*グループ$/i);
  if (g2?.[1]) return `グループ${g2[1].toUpperCase()}`;
  return text;
}

function parseGroupsFromDescription(description) {
  return String(description || "")
    .split("\n")
    .map((line) => line.trim())
    .map((line) => line.match(/^-\s*(.+?)\s*:/)?.[1] || "")
    .map((name) => normalizeGroupLabel(name))
    .filter((name) => name && name !== "決勝T");
}

function inferGroup(field = "", round = "") {
  const source = `${field} ${round}`;
  if (/(決勝|準決勝|準々決勝|トーナメント|knockout|final)/i.test(source)) return "決勝T";
  const normalized = normalizeGroupLabel(source);
  if (normalized.startsWith("グループ")) return normalized;
  return "グループA";
}

function extractCourt(field = "", group = "") {
  let text = String(field || "").trim();
  if (!text) return COURT_OPTIONS[0];
  if (group) {
    text = text.replace(group, "").trim();
    text = text.replace(/^[-:/|]+/, "").trim();
  }
  return text || COURT_OPTIONS[0];
}

function toTimeString(kickoffAt, fallback = "10:00") {
  if (!kickoffAt) return fallback;
  const dt = new Date(kickoffAt);
  if (Number.isNaN(dt.getTime())) return fallback;
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function kickoffOptions(startTime = "10:00", endTime = "16:00") {
  const [sh, sm] = String(startTime).split(":").map((v) => Number(v || 0));
  const [eh, em] = String(endTime).split(":").map((v) => Number(v || 0));
  const start = sh * 60 + sm;
  const end = eh * 60 + em;
  const result = [];
  for (let m = start; m <= end; m += 30) {
    const hh = String(Math.floor(m / 60)).padStart(2, "0");
    const mm = String(m % 60).padStart(2, "0");
    result.push(`${hh}:${mm}`);
  }
  return result.length > 0 ? result : ["10:00", "10:30", "11:00"];
}

function dateTimeFromEventDate(eventDate, time) {
  if (!eventDate || !time) return "";
  return `${eventDate}T${time}:00`;
}

function nextTemporaryId() {
  return `tmp-${Math.random().toString(36).slice(2, 9)}`;
}

export default function AdminMatches() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedTournamentId = searchParams.get("tournamentId") || "";

  const [tournament, setTournament] = useState(null);
  const [entries, setEntries] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeGroup, setActiveGroup] = useState("all");
  const [sourceMatches, setSourceMatches] = useState([]);
  const [draftMatches, setDraftMatches] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  const [hasReordered, setHasReordered] = useState(false);

  useEffect(() => {
    if (!selectedTournamentId) {
      setError("大会IDが指定されていません");
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    Promise.all([api.get(`/tournaments/${selectedTournamentId}`), api.get("/teams"), api.get("/tournament_entries")])
      .then(([tRes, teamRes, entryRes]) => {
        if (!active) return;
        setTournament(tRes?.tournament || null);
        setTeams(teamRes?.teams || []);
        setEntries(entryRes?.entries || []);
      })
      .catch(() => {
        if (!active) return;
        setError("初期データの取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [selectedTournamentId]);

  useEffect(() => {
    if (!selectedTournamentId) return;
    let active = true;
    setError("");
    setSuccess("");
    api
      .get(`/tournaments/${selectedTournamentId}/matches`)
      .then((data) => {
        if (!active) return;
        const normalized = (data?.matches || []).map((match) => {
          const group = inferGroup(match.field, match.round);
          return {
            id: String(match.id),
            persistedId: Number(match.id),
            group,
            kickoffTime: toTimeString(match.kickoff_at),
            court: extractCourt(match.field, group),
            homeTeamId: String(match.home_team_id || ""),
            awayTeamId: String(match.away_team_id || ""),
            status: match.status || "scheduled",
          };
        });
        setSourceMatches(normalized);
        setDraftMatches(normalized);
        setHasReordered(false);
      })
      .catch(() => {
        if (!active) return;
        setError("試合一覧の取得に失敗しました");
      });
    return () => {
      active = false;
    };
  }, [selectedTournamentId]);

  const selectedTournament = tournament;

  const groupLabels = useMemo(() => {
    const list = [];
    parseGroupsFromDescription(selectedTournament?.description).forEach((group) => {
      if (!list.includes(group)) list.push(group);
    });
    draftMatches.forEach((match) => {
      if (match.group === "決勝T") return;
      if (!list.includes(match.group)) list.push(match.group);
    });
    return list;
  }, [draftMatches, selectedTournament?.description]);

  const hasKnockout = useMemo(() => draftMatches.some((match) => match.group === "決勝T"), [draftMatches]);

  const tabs = useMemo(() => {
    const result = [{ key: "all", label: "全体" }, ...groupLabels.map((group) => ({ key: group, label: group }))];
    if (hasKnockout) result.push({ key: "決勝T", label: "決勝T" });
    return result;
  }, [groupLabels, hasKnockout]);

  useEffect(() => {
    if (!tabs.some((tab) => tab.key === activeGroup)) {
      setActiveGroup("all");
    }
  }, [tabs, activeGroup]);

  const participantTeams = useMemo(() => {
    const filtered = entries.filter((entry) => String(entry.tournament_id) === String(selectedTournamentId));
    const approved = filtered.filter((entry) => entry.status === "approved");
    const source = approved.length > 0 ? approved : filtered;
    const ids = new Set(source.map((entry) => Number(entry.team_id)));
    return teams.filter((team) => ids.has(Number(team.id)));
  }, [entries, teams, selectedTournamentId]);

  const groupTeamIdMap = useMemo(() => {
    const map = new Map();
    groupLabels.forEach((group) => map.set(group, new Set()));

    draftMatches.forEach((match) => {
      if (!map.has(match.group)) return;
      map.get(match.group).add(Number(match.homeTeamId));
      map.get(match.group).add(Number(match.awayTeamId));
    });

    if (groupLabels.length > 0) {
      participantTeams.forEach((team, idx) => {
        const assigned = groupLabels.some((group) => map.get(group)?.has(Number(team.id)));
        if (assigned) return;
        const group = groupLabels[idx % groupLabels.length];
        map.get(group)?.add(Number(team.id));
      });
    }
    return map;
  }, [draftMatches, groupLabels, participantTeams]);

  const teamsForActiveGroup = useMemo(() => {
    if (activeGroup === "all") return participantTeams;
    if (activeGroup === "決勝T") {
      const ids = new Set(
        draftMatches
          .filter((match) => match.group === "決勝T")
          .flatMap((match) => [Number(match.homeTeamId), Number(match.awayTeamId)])
      );
      return participantTeams.filter((team) => ids.has(Number(team.id)));
    }
    const ids = groupTeamIdMap.get(activeGroup) || new Set();
    return participantTeams.filter((team) => ids.has(Number(team.id)));
  }, [activeGroup, draftMatches, groupTeamIdMap, participantTeams]);

  const visibleDraftMatches = useMemo(() => {
    if (activeGroup === "all") return draftMatches;
    return draftMatches.filter((match) => match.group === activeGroup);
  }, [activeGroup, draftMatches]);

  const timeOptions = useMemo(
    () => kickoffOptions(toTimeString(selectedTournament?.start_time, "10:00"), toTimeString(selectedTournament?.end_time, "16:00")),
    [selectedTournament?.end_time, selectedTournament?.start_time]
  );

  const hasDraft = draftMatches.length > 0;

  const sourceKey = useMemo(() => JSON.stringify(sourceMatches), [sourceMatches]);
  const draftKey = useMemo(() => JSON.stringify(draftMatches), [draftMatches]);
  const isDirty = hasReordered || sourceKey !== draftKey;

  const onChangeDraft = (id, key, value) => {
    setDraftMatches((prev) => prev.map((match) => (match.id === id ? { ...match, [key]: value } : match)));
  };

  const addMatch = () => {
    const fallbackGroup = activeGroup === "all" ? groupLabels[0] || "グループA" : activeGroup;
    const defaultTime = visibleDraftMatches[visibleDraftMatches.length - 1]?.kickoffTime || timeOptions[0] || "10:00";
    setDraftMatches((prev) => [
      ...prev,
      {
        id: nextTemporaryId(),
        persistedId: null,
        group: fallbackGroup,
        kickoffTime: defaultTime,
        court: COURT_OPTIONS[0],
        homeTeamId: String(teamsForActiveGroup[0]?.id || ""),
        awayTeamId: String(teamsForActiveGroup[1]?.id || teamsForActiveGroup[0]?.id || ""),
        status: "scheduled",
      },
    ]);
  };

  const removeMatch = (id) => {
    setDraftMatches((prev) => prev.filter((match) => match.id !== id));
  };

  const removeAllVisible = () => {
    if (visibleDraftMatches.length === 0) return;
    if (!window.confirm("表示中の試合をすべて削除しますか？")) return;
    const visibleIds = new Set(visibleDraftMatches.map((match) => match.id));
    setDraftMatches((prev) => prev.filter((match) => !visibleIds.has(match.id)));
  };

  const onDragStart = (id) => () => {
    setDraggingId(id);
  };

  const onDrop = (targetId) => (event) => {
    event.preventDefault();
    if (!draggingId || draggingId === targetId) return;
    const localIds = visibleDraftMatches.map((match) => match.id);
    const from = localIds.indexOf(draggingId);
    const to = localIds.indexOf(targetId);
    if (from < 0 || to < 0) return;
    const reordered = [...localIds];
    const [item] = reordered.splice(from, 1);
    reordered.splice(to, 0, item);

    setDraftMatches((prev) => {
      const map = new Map(prev.map((item) => [item.id, item]));
      const others = prev.filter((item) => !localIds.includes(item.id));
      const reorderedItems = reordered.map((id) => map.get(id)).filter(Boolean);
      return activeGroup === "all" ? reorderedItems : [...others, ...reorderedItems];
    });
    setHasReordered(true);
    setDraggingId(null);
  };

  const onSave = async () => {
    if (!selectedTournamentId || saving || !isDirty) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const originalById = new Map(sourceMatches.filter((match) => match.persistedId).map((match) => [match.persistedId, match]));
      const draftPersistedIds = new Set(draftMatches.filter((match) => match.persistedId).map((match) => match.persistedId));
      const deletedIds = [...originalById.keys()].filter((id) => !draftPersistedIds.has(id));

      await Promise.all(deletedIds.map((id) => api.del(`/matches/${id}`)));

      for (const match of draftMatches) {
        const payload = {
          tournament_id: Number(selectedTournamentId),
          home_team_id: Number(match.homeTeamId),
          away_team_id: Number(match.awayTeamId),
          kickoff_at: dateTimeFromEventDate(selectedTournament?.event_date, match.kickoffTime),
          field: `${match.group} ${match.court}`.trim(),
          status: match.status,
        };

        if (!payload.home_team_id || !payload.away_team_id || !payload.kickoff_at) continue;

        if (match.persistedId) {
          const original = originalById.get(match.persistedId);
          const changed =
            !original ||
            original.group !== match.group ||
            original.kickoffTime !== match.kickoffTime ||
            original.court !== match.court ||
            original.homeTeamId !== match.homeTeamId ||
            original.awayTeamId !== match.awayTeamId;
          if (changed) {
            await api.patch(`/matches/${match.persistedId}`, payload);
          }
        } else {
          await api.post(`/tournaments/${selectedTournamentId}/matches`, payload);
        }
      }

      const refreshed = await api.get(`/tournaments/${selectedTournamentId}/matches`);
      const normalized = (refreshed?.matches || []).map((match) => {
        const group = inferGroup(match.field, match.round);
        return {
          id: String(match.id),
          persistedId: Number(match.id),
          group,
          kickoffTime: toTimeString(match.kickoff_at),
          court: extractCourt(match.field, group),
          homeTeamId: String(match.home_team_id || ""),
          awayTeamId: String(match.away_team_id || ""),
          status: match.status || "scheduled",
        };
      });
      setSourceMatches(normalized);
      setDraftMatches(normalized);
      setHasReordered(false);
      setSuccess("変更を保存しました");
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <div className="admch-root">
      <header className="admch-header">
        <div className="admch-header-row">
          <div className="admch-header-left">
            <button type="button" className="admch-back-btn" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined">arrow_back_ios_new</span>
            </button>
            <h1>{hasDraft ? "対戦スケジュールの編集" : "対戦スケジュールの作成"}</h1>
          </div>
          {hasDraft ? (
            <button type="button" className="admch-bulk-delete" onClick={removeAllVisible}>
              一括削除
            </button>
          ) : null}
        </div>
      </header>

      <main className="admch-main">
        <div className="admch-info">
          <span className="material-symbols-outlined">info</span>
          <p>各グループのチームを選択し、試合順とコートを割り当ててください。</p>
        </div>

        <section className="admch-panel">
          <div className="admch-tabs">
            {tabs.map((tab) => (
              <button key={tab.key} type="button" className={activeGroup === tab.key ? "active" : ""} onClick={() => setActiveGroup(tab.key)}>
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {!hasDraft ? (
          <section className="admch-empty-card">
            <div className="admch-empty-icon">
              <span className="material-symbols-outlined">calendar_month</span>
            </div>
            <h3>試合が登録されていません</h3>
            <p>
              対戦カードを作成して、
              <br />
              スムーズな大会進行の準備をしましょう。
            </p>
            <button type="button" className="admch-add-btn" onClick={addMatch}>
              <div className="plus-circle">
                <span className="material-symbols-outlined">add</span>
              </div>
              <span>試合を追加する</span>
            </button>
          </section>
        ) : (
          <section className="admch-cards">
            {visibleDraftMatches.map((match, index) => (
              <article
                key={match.id}
                className="admch-card"
                draggable
                onDragStart={onDragStart(match.id)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={onDrop(match.id)}
              >
                <div className="drag-handle">
                  <span className="material-symbols-outlined">drag_indicator</span>
                </div>
                <div className="content">
                  <div className="head">
                    <span>試合 #{index + 1}</span>
                    <button type="button" onClick={() => removeMatch(match.id)}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>

                  <div className="time-court">
                    <label>
                      キックオフ
                      <select value={match.kickoffTime} onChange={(e) => onChangeDraft(match.id, "kickoffTime", e.target.value)}>
                        {timeOptions.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      コート
                      <select value={match.court} onChange={(e) => onChangeDraft(match.id, "court", e.target.value)}>
                        {COURT_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <div className="teams">
                    <select aria-label="ホーム" value={match.homeTeamId} onChange={(e) => onChangeDraft(match.id, "homeTeamId", e.target.value)}>
                      <option value="">チーム選択</option>
                      {teamsForActiveGroup.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                    <span>vs</span>
                    <select aria-label="アウェイ" value={match.awayTeamId} onChange={(e) => onChangeDraft(match.id, "awayTeamId", e.target.value)}>
                      <option value="">チーム選択</option>
                      {teamsForActiveGroup.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </article>
            ))}

            <button type="button" className="admch-add-dashed" onClick={addMatch}>
              <span className="material-symbols-outlined">add_circle</span>
              <span>試合を追加する</span>
            </button>
          </section>
        )}

        {error ? <p className="admch-error">{error}</p> : null}
        {success ? <p className="admch-success">{success}</p> : null}
      </main>

      <div className="admch-fixed-save">
        <div className="inner">
          <button type="button" disabled={!hasDraft || !isDirty || saving} onClick={onSave}>
            {saving ? "保存中..." : "変更を保存して反映"}
          </button>
        </div>
      </div>

      <AdminBottomNav />
    </div>
  );
}
