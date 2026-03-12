import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import AdminBottomNav from "../../components/admin/AdminBottomNav";
import { getTournamentCoverUrl } from "../../lib/tournamentImages";

const teamLogoColors = ["blue", "red", "gray", "indigo", "emerald"];
const DEFAULT_RULE_OPTIONS = ["オフサイドなし", "審判1名制"];
const DEFAULT_CAUTION_OPTIONS = ["雨天決行（荒天中止）", "スパイク禁止（トレシュー推奨）", "開始20分前までに受付"];

function getLevelLabel(stars) {
  if (stars <= 2) return "ビギナー（初心者中心）";
  if (stars === 3) return "エンジョイ（楽しむ重視）";
  if (stars === 4) return "スタンダード（経験者歓迎）";
  return "コンペティティブ（競技志向）";
}

function parseDescriptionAndGroups(rawDescription) {
  const lines = String(rawDescription || "")
    .split("\n")
    .map((line) => line.trimEnd());

  const sectionIndex = lines.findIndex((line) => line.trim() === "グループ設定:");
  if (sectionIndex < 0) {
    return {
      mainDescription: String(rawDescription || "").trim(),
      groups: [],
    };
  }

  const mainDescription = lines
    .slice(0, sectionIndex)
    .join("\n")
    .trim();

  const groupLines = lines
    .slice(sectionIndex + 1)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"));

  const groups = groupLines.map((line, index) => {
    const match = line.match(/^-+\s*(.+?)\s*:\s*(★{1,5})/);
    if (match) {
      return {
        id: `${Date.now()}-${index}`,
        name: match[1].trim(),
        stars: Math.max(1, Math.min(5, match[2].length)),
      };
    }
    const nameOnly = line.replace(/^-+\s*/, "").replace(/:.*$/, "").trim() || `グループ${String.fromCharCode(65 + index)}`;
    return { id: `${Date.now()}-${index}`, name: nameOnly, stars: 3 };
  });

  return { mainDescription, groups };
}

function formatDateWithTime(eventDate, startTime, endTime) {
  if (!eventDate) return "日付未設定";
  const dt = new Date(`${eventDate}T00:00:00`);
  if (Number.isNaN(dt.getTime())) return "日付未設定";
  const w = ["日", "月", "火", "水", "木", "金", "土"][dt.getDay()];
  const dateLabel = `${dt.getMonth() + 1}/${dt.getDate()} (${w})`;
  const start = startTime || "10:00";
  const end = endTime || "16:00";
  const timeLabel = `${start} - ${end}`;
  return `${dateLabel} ${timeLabel}`;
}

function formatDateWithWave(eventDate, startTime, endTime) {
  return formatDateWithTime(eventDate, startTime, endTime).replace(" - ", " 〜 ");
}

function formatTime(raw) {
  if (!raw) return "";
  const text = String(raw);
  const m = text.match(/(?:T|^)(\d{2}):(\d{2})/);
  if (!m) return "";
  return `${Number(m[1])}:${m[2]}`;
}

function statusByDate(eventDate) {
  if (!eventDate) return "募集中";
  const dt = new Date(`${eventDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (dt.getTime() < today.getTime()) return "終了";
  if (dt.getTime() === today.getTime()) return "開催中";
  return "募集中";
}

function entryStatusMeta(status) {
  if (status === "approved") return { label: "承認済み", className: "approved" };
  if (status === "rejected") return { label: "却下", className: "rejected" };
  if (status === "cancelled") return { label: "キャンセル", className: "cancelled" };
  return { label: "承認待ち", className: "pending" };
}

function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "TM";
  return s.slice(0, 2).toUpperCase();
}

function idText(tournament) {
  const year = tournament?.event_date ? new Date(`${tournament.event_date}T00:00:00`).getFullYear() : new Date().getFullYear();
  return `#TSC-${year}-${String(tournament?.id || 0).padStart(3, "0")}`;
}

function formatKickoffMeta(kickoffAt, field) {
  if (!kickoffAt) return field || "-";
  const dt = new Date(kickoffAt);
  if (Number.isNaN(dt.getTime())) return field || "-";
  const hh = String(dt.getHours()).padStart(2, "0");
  const mm = String(dt.getMinutes()).padStart(2, "0");
  return `${hh}:${mm} • ${field || "-"}`;
}

function scoreText(result, side) {
  if (!result) return null;
  const value = side === "home" ? result.home_score : result.away_score;
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function toStandings(matches) {
  const stats = new Map();

  const pick = (teamId, teamName) => {
    const key = String(teamId);
    if (!stats.has(key)) {
      stats.set(key, {
        teamId: Number(teamId),
        teamName: teamName || `Team ${teamId}`,
        played: 0,
        points: 0,
        gf: 0,
        ga: 0,
        win: 0,
        draw: 0,
        loss: 0,
      });
    }
    return stats.get(key);
  };

  matches
    .filter((match) => match.status === "finished" && match.result)
    .forEach((match) => {
      const home = pick(match.home_team_id, match.home_team_name);
      const away = pick(match.away_team_id, match.away_team_name);
      const hs = Number(match.result?.home_score ?? 0);
      const as = Number(match.result?.away_score ?? 0);

      home.played += 1;
      away.played += 1;
      home.gf += hs;
      home.ga += as;
      away.gf += as;
      away.ga += hs;

      if (hs > as) {
        home.win += 1;
        away.loss += 1;
        home.points += 3;
      } else if (hs < as) {
        away.win += 1;
        home.loss += 1;
        away.points += 3;
      } else {
        home.draw += 1;
        away.draw += 1;
        home.points += 1;
        away.points += 1;
      }
    });

  return Array.from(stats.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const gdA = a.gf - a.ga;
    const gdB = b.gf - b.ga;
    if (gdB !== gdA) return gdB - gdA;
    if (b.gf !== a.gf) return b.gf - a.gf;
    return a.teamName.localeCompare(b.teamName, "ja");
  });
}

function classifyMatchGroup(match) {
  const source = `${match?.field || ""} ${match?.round || ""}`.toLowerCase();

  if (/(決勝|準決勝|準々決勝|トーナメント|knockout|final)/i.test(source)) {
    return { key: "knockout", label: "決勝T" };
  }

  const jpGroup = String(match?.field || "").match(/グループ\s*([A-Za-z0-9]+)/i);
  if (jpGroup?.[1]) {
    const token = jpGroup[1].toUpperCase();
    return { key: `group-${token}`, label: `グループ${token}` };
  }

  const enGroup = String(match?.field || "").match(/group\s*([A-Za-z0-9]+)/i);
  if (enGroup?.[1]) {
    const token = enGroup[1].toUpperCase();
    return { key: `group-${token}`, label: `グループ${token}` };
  }

  return { key: "group-A", label: "グループA" };
}

function parseBulletItems(rawText) {
  return String(rawText || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-・✅\s]+/, "").trim())
    .filter((line) => line && !line.endsWith(":"));
}

export default function AdminTournamentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("teams");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [tournament, setTournament] = useState(null);
  const [images, setImages] = useState([]);
  const [entries, setEntries] = useState([]);
  const [teamsById, setTeamsById] = useState(new Map());
  const [matches, setMatches] = useState([]);
  const [thumbnailUploading, setThumbnailUploading] = useState(false);
  const thumbnailInputRef = useRef(null);
  const [toast, setToast] = useState(null);
  const [toastHiding, setToastHiding] = useState(false);
  const toastTimerRef = useRef(null);
  const toastRemoveRef = useRef(null);
  const [matchGroup, setMatchGroup] = useState("");
  const [form, setForm] = useState({
    name: "",
    event_date: "",
    start_time: "",
    end_time: "",
    venue: "",
    max_teams: "",
    entry_fee_amount: "",
    description: "",
  });
  const [selectedRuleOptions, setSelectedRuleOptions] = useState([]);
  const [customRules, setCustomRules] = useState([]);
  const [customRuleInput, setCustomRuleInput] = useState("");
  const [selectedCautionOptions, setSelectedCautionOptions] = useState([]);
  const [customCautions, setCustomCautions] = useState([]);
  const [customCautionInput, setCustomCautionInput] = useState("");
  const [groups, setGroups] = useState([]);

  const showToast = (type, message) => {
    if (!message) return;
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    if (toastRemoveRef.current) window.clearTimeout(toastRemoveRef.current);
    setToast({ type, message });
    setToastHiding(false);
    toastTimerRef.current = window.setTimeout(() => {
      setToastHiding(true);
      toastRemoveRef.current = window.setTimeout(() => {
        setToast(null);
        setToastHiding(false);
        toastRemoveRef.current = null;
      }, 260);
    }, 3000);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);

    Promise.all([
      api.get(`/tournaments/${id}`),
      api.get("/tournament_entries"),
      api.get("/teams"),
      api.get(`/tournaments/${id}/matches`).catch(() => ({ matches: [] })),
      api.get(`/tournaments/${id}/images`).catch(() => ({ images: [] })),
    ])
      .then(([tournamentRes, entriesRes, teamsRes, matchesRes, imagesRes]) => {
        if (!active) return;
        const t = tournamentRes?.tournament || null;
        const allEntries = Array.isArray(entriesRes?.entries) ? entriesRes.entries : [];
        const teamList = Array.isArray(teamsRes?.teams) ? teamsRes.teams : [];
        const matchList = Array.isArray(matchesRes?.matches) ? matchesRes.matches : [];
        const imageList = Array.isArray(imagesRes?.images) ? imagesRes.images : [];

        setTournament(t);
        setImages(imageList);
        setEntries(allEntries.filter((entry) => String(entry.tournament_id) === String(id)));
        setTeamsById(new Map(teamList.map((team) => [Number(team.id), team])));
        setMatches(matchList);

        const parsedDescription = parseDescriptionAndGroups(t?.description);

        setForm({
          name: t?.name || "",
          event_date: t?.event_date || "",
          start_time: formatTime(t?.start_time),
          end_time: formatTime(t?.end_time),
          venue: t?.venue || "",
          max_teams: String(t?.max_teams || ""),
          entry_fee_amount: String(t?.entry_fee_amount || 0),
          description: parsedDescription.mainDescription || "",
        });
        setGroups(parsedDescription.groups);

        const parsedRules = parseBulletItems(t?.rules);
        setSelectedRuleOptions(DEFAULT_RULE_OPTIONS.filter((rule) => parsedRules.includes(rule)));
        setCustomRules(parsedRules.filter((rule) => !DEFAULT_RULE_OPTIONS.includes(rule)));

        const parsedCautions = parseBulletItems(t?.cautions);
        setSelectedCautionOptions(DEFAULT_CAUTION_OPTIONS.filter((item) => parsedCautions.includes(item)));
        setCustomCautions(parsedCautions.filter((item) => !DEFAULT_CAUTION_OPTIONS.includes(item)));
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
    if (!error) return;
    showToast("error", error);
    setError("");
  }, [error]);

  useEffect(() => {
    if (!success) return;
    showToast("success", success);
    setSuccess("");
  }, [success]);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
      if (toastRemoveRef.current) window.clearTimeout(toastRemoveRef.current);
    };
  }, []);

  const teamRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .map((entry, index) => {
        const team = teamsById.get(Number(entry.team_id));
        if (!team) return null;
        const meta = entryStatusMeta(entry.status);
        const captain = team.captain_name || "未設定";
        const members = Number(team.member_count || 0);
        return {
          entryId: entry.id,
          teamId: Number(team.id),
          teamName: team.name,
          logoText: initials(team.name),
          logoClass: teamLogoColors[index % teamLogoColors.length],
          statusLabel: meta.label,
          statusClass: meta.className,
          subText: `代表: ${captain} • メンバー: ${members}名`,
        };
      })
      .filter(Boolean)
      .filter((row) => (!q ? true : row.teamName.toLowerCase().includes(q)));
  }, [entries, search, teamsById]);

  const activeEntryCount = Number(tournament?.active_entry_teams_count || 0);
  const maxTeams = Number(tournament?.max_teams || 0);
  const combinedRules = [...selectedRuleOptions, ...customRules];
  const combinedCautions = [...selectedCautionOptions, ...customCautions];
  const coverUrl = useMemo(() => {
    const latest = images[0]?.download_url || images[0]?.file_url;
    if (latest) return latest;
    return getTournamentCoverUrl(tournament);
  }, [images, tournament]);
  const sortedMatches = useMemo(() => {
    return [...matches].sort((a, b) => {
      const ta = new Date(a.kickoff_at || 0).getTime();
      const tb = new Date(b.kickoff_at || 0).getTime();
      return ta - tb;
    });
  }, [matches]);
  const matchGroups = useMemo(() => {
    const order = [];
    const seen = new Set();
    sortedMatches.forEach((match) => {
      const group = classifyMatchGroup(match);
      if (seen.has(group.key)) return;
      seen.add(group.key);
      order.push(group);
    });
    return order;
  }, [sortedMatches]);
  useEffect(() => {
    if (!matchGroups.length) {
      if (matchGroup !== "") setMatchGroup("");
      return;
    }
    if (!matchGroups.some((group) => group.key === matchGroup)) {
      setMatchGroup(matchGroups[0].key);
    }
  }, [matchGroups, matchGroup]);
  const displayedMatches = useMemo(() => {
    if (!matchGroup) return [];
    return sortedMatches.filter((match) => classifyMatchGroup(match).key === matchGroup);
  }, [matchGroup, sortedMatches]);
  const standings = useMemo(() => toStandings(displayedMatches), [displayedMatches]);
  const liveMatchId = useMemo(() => {
    const now = Date.now();
    const candidate = displayedMatches.find((match) => {
      if (match.status === "finished" || !match.kickoff_at) return false;
      const start = new Date(match.kickoff_at).getTime();
      if (Number.isNaN(start)) return false;
      return now >= start && now < start + 90 * 60 * 1000;
    });
    return candidate?.id || null;
  }, [displayedMatches]);

  const canSave =
    form.name.trim() &&
    form.event_date &&
    form.start_time &&
    form.end_time &&
    form.venue &&
    Number(form.max_teams) > 0 &&
    Number(form.entry_fee_amount) >= 0;

  const addGroup = () => {
    setGroups((prev) => [
      ...prev,
      { id: `${Date.now()}`, name: `グループ${String.fromCharCode(65 + prev.length)}`, stars: 3 },
    ]);
  };

  const removeGroup = (groupId) => {
    setGroups((prev) => prev.filter((group) => group.id !== groupId));
  };

  const setGroupName = (groupId, value) => {
    setGroups((prev) => prev.map((group) => (group.id === groupId ? { ...group, name: value } : group)));
  };

  const setGroupStars = (groupId, stars) => {
    setGroups((prev) => prev.map((group) => (group.id === groupId ? { ...group, stars } : group)));
  };

  const buildDescription = () => {
    const lines = [];
    if (form.description.trim()) lines.push(form.description.trim());
    if (groups.length > 0) {
      lines.push("グループ設定:");
      groups.forEach((group) => {
        const safeName = (group.name || "").trim() || "未命名";
        lines.push(`- ${safeName}: ${"★".repeat(group.stars)} (${getLevelLabel(group.stars)})`);
      });
    }
    return lines.join("\n");
  };

  const onFormChange = (key) => (event) => {
    setForm((prev) => ({ ...prev, [key]: event.target.value }));
  };

  const onSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await api.patch(`/tournaments/${id}`, {
        name: form.name.trim(),
        event_date: form.event_date,
        start_time: form.start_time,
        end_time: form.end_time,
        venue: form.venue,
        max_teams: Number(form.max_teams),
        entry_fee_amount: Number(form.entry_fee_amount),
        entry_fee_currency: "JPY",
        cancel_deadline_date: form.event_date,
        description: buildDescription(),
        rules: combinedRules.map((rule) => `- ${rule}`).join("\n"),
        cautions: combinedCautions.map((item) => `- ${item}`).join("\n"),
      });
      setTournament((prev) => ({
        ...(prev || {}),
        ...form,
        description: buildDescription(),
        rules: combinedRules.map((rule) => `- ${rule}`).join("\n"),
        cautions: combinedCautions.map((item) => `- ${item}`).join("\n"),
        id: prev?.id,
        active_entry_teams_count: prev?.active_entry_teams_count,
      }));
      setSuccess("大会情報を更新しました");
    } catch (e) {
      if (e?.status === 422) setError("入力内容を確認してください");
      else setError("更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  const toggleDefaultRule = (rule) => {
    setSelectedRuleOptions((prev) => (prev.includes(rule) ? prev.filter((item) => item !== rule) : [...prev, rule]));
  };

  const addCustomRule = () => {
    const next = customRuleInput.trim();
    if (!next) return;
    if (combinedRules.includes(next)) {
      setCustomRuleInput("");
      return;
    }
    setCustomRules((prev) => [...prev, next]);
    setCustomRuleInput("");
  };

  const removeCustomRule = (rule) => {
    setCustomRules((prev) => prev.filter((item) => item !== rule));
  };

  const toggleDefaultCaution = (item) => {
    setSelectedCautionOptions((prev) => (prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]));
  };

  const addCustomCaution = () => {
    const next = customCautionInput.trim();
    if (!next) return;
    if (combinedCautions.includes(next)) {
      setCustomCautionInput("");
      return;
    }
    setCustomCautions((prev) => [...prev, next]);
    setCustomCautionInput("");
  };

  const removeCustomCaution = (item) => {
    setCustomCautions((prev) => prev.filter((v) => v !== item));
  };

  const onDelete = async () => {
    if (!window.confirm("この大会を削除します。よろしいですか？")) return;
    try {
      await api.delete(`/tournaments/${id}`);
      navigate("/admin/tournaments");
    } catch {
      setError("削除に失敗しました");
    }
  };

  const onPickThumbnail = () => {
    thumbnailInputRef.current?.click();
  };

  const onThumbnailChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file || thumbnailUploading) return;
    if (!file.type.startsWith("image/")) {
      setError("画像ファイルを選択してください");
      return;
    }

    setThumbnailUploading(true);
    setError("");
    setSuccess("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      const uploaded = await api.postForm("/uploads/direct", formData);

      await api.post(`/tournaments/${id}/images`, {
        file_url: uploaded.public_url,
        file_name: uploaded.file_name || file.name,
        content_type: uploaded.content_type || file.type || "application/octet-stream",
        size_bytes: Number(uploaded.size_bytes || file.size),
      });

      const refreshed = await api.get(`/tournaments/${id}/images`);
      setImages(Array.isArray(refreshed?.images) ? refreshed.images : []);
      setSuccess("サムネイル画像を更新しました");
    } catch (e) {
      const code = e?.data?.error?.code;
      if (code === "r2_not_configured") {
        setError("R2の設定が未完了です。環境変数を確認してください");
      } else if (code === "r2_upload_failed") {
        setError("R2へのアップロードに失敗しました");
      } else {
        setError("サムネイル画像の更新に失敗しました");
      }
    } finally {
      event.target.value = "";
      setThumbnailUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="atd-root">
        <main className="atd-main">
          <p className="atd-empty">読み込み中...</p>
        </main>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="atd-root">
        <main className="atd-main">
          <p className="atd-empty">大会が見つかりません。</p>
        </main>
      </div>
    );
  }

  return (
    <div className="atd-root">
      {toast ? (
        <div className={`flash-message flash-${toast.type} ${toastHiding ? "is-hiding" : ""}`} role="status" aria-live="polite">
          <span className="flash-icon-wrap">
            <span className="material-symbols-outlined">{toast.type === "error" ? "error" : "check"}</span>
          </span>
          <p className="flash-message-text">{toast.message}</p>
        </div>
      ) : null}

      <header className="atd-header">
        <div className="atd-header-row">
          <div className="atd-header-left">
            <button type="button" className="atd-icon-btn" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1>大会詳細</h1>
          </div>
          <div className="atd-header-actions">
            <button type="button" className="atd-icon-btn" onClick={() => setActiveTab("settings")}>
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button type="button" className="atd-icon-btn is-danger" onClick={onDelete}>
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </header>

      <main className="atd-main">
        <section className="atd-summary-card">
          <div className="atd-hero">
            <img src={coverUrl} alt="Tournament cover image" />
            <div className="atd-hero-overlay" />
            <div className="atd-status-chip">{statusByDate(tournament.event_date)}</div>
            <div className="atd-hero-copy">
              <h2>{tournament.name}</h2>
              <p>ID: {idText(tournament)}</p>
            </div>
            <button
              type="button"
              className="atd-hero-image-edit"
              onClick={onPickThumbnail}
              disabled={thumbnailUploading}
              aria-label="サムネイル画像を変更"
            >
              <span className="material-symbols-outlined">{thumbnailUploading ? "hourglass_top" : "photo_camera"}</span>
            </button>
            <input
              ref={thumbnailInputRef}
              type="file"
              accept="image/*"
              className="atd-file-input"
              onChange={onThumbnailChange}
            />
          </div>

          <div className="atd-summary-list">
            <div className="atd-summary-row">
              <div className="atd-summary-icon">
                <span className="material-symbols-outlined">calendar_month</span>
              </div>
              <div className="atd-summary-copy">
                <small>開催日時</small>
                <strong>{formatDateWithWave(tournament.event_date, formatTime(tournament.start_time), formatTime(tournament.end_time))}</strong>
              </div>
            </div>
            <div className="atd-summary-row">
              <div className="atd-summary-icon">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div className="atd-summary-copy">
                <small>会場</small>
                <strong>{tournament.venue}</strong>
              </div>
            </div>
            <div className="atd-summary-row">
              <div className="atd-summary-icon">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <div className="atd-summary-copy">
                <small>募集状況</small>
                <strong>{activeEntryCount} / {maxTeams} チーム</strong>
              </div>
            </div>
            <div className="atd-summary-row">
              <div className="atd-summary-icon">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div className="atd-summary-copy">
                <small>参加費</small>
                <strong>¥{Number(tournament.entry_fee_amount || 0).toLocaleString("ja-JP")} / チーム</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="atd-tabs-section">
          <div className="atd-tabs">
            <button type="button" className={activeTab === "teams" ? "active" : ""} onClick={() => setActiveTab("teams")}>
              参加チーム <span>{entries.length}</span>
            </button>
            <button type="button" className={activeTab === "matches" ? "active" : ""} onClick={() => setActiveTab("matches")}>
              対戦表・結果
            </button>
            <button type="button" className={activeTab === "settings" ? "active" : ""} onClick={() => setActiveTab("settings")}>
              詳細設定
            </button>
          </div>
        </section>

        <section className="atd-panel-section">
          <div className="atd-panel-body">
            {activeTab === "teams" ? (
              <>
                <div className="atd-team-search">
                  <span className="material-symbols-outlined">search</span>
                  <input type="text" placeholder="チーム名で検索" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>

                <div className="atd-team-list">
                  {teamRows.map((team) => (
                    <button
                      type="button"
                      key={team.entryId}
                      className={`atd-team-row ${team.statusClass === "pending" ? "pending" : ""}`}
                      onClick={() => navigate(`/admin/teams/${team.teamId}`)}
                    >
                      <div className={`atd-team-logo ${team.logoClass}`}>{team.logoText}</div>
                      <div className="atd-team-main">
                        <div className="atd-team-top">
                          <h4>{team.teamName}</h4>
                          <span className={`atd-tag ${team.statusClass}`}>{team.statusLabel}</span>
                        </div>
                        <p>{team.subText}</p>
                      </div>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </button>
                  ))}
                  {teamRows.length === 0 ? <p className="atd-empty">参加チームがありません。</p> : null}
                </div>
              </>
            ) : null}

            {activeTab === "matches" ? (
              <div className="atd-matches-wrap">
                {matchGroups.length > 0 ? (
                  <div className="atd-group-tabs">
                    {matchGroups.map((group) => (
                      <button
                        key={group.key}
                        type="button"
                        className={matchGroup === group.key ? "active" : ""}
                        onClick={() => setMatchGroup(group.key)}
                      >
                        {group.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                {sortedMatches.length === 0 ? (
                  <div className="atd-no-matches">
                    <p>対戦表情報がありません。</p>
                    <button type="button" onClick={() => navigate(`/admin/matches?tournamentId=${id}`)}>
                      対戦表を作成する
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="atd-standing-card">
                      <div className="atd-sub-head">
                        <h3>
                          <span className="material-symbols-outlined">leaderboard</span>
                          リーグ順位表
                        </h3>
                        <small>自動更新</small>
                      </div>
                      <div className="atd-table-wrap">
                        <table>
                          <thead>
                            <tr>
                              <th>順位</th>
                              <th>チーム名</th>
                              <th>試合</th>
                              <th>勝点</th>
                              <th>得失</th>
                              <th>勝-分-負</th>
                            </tr>
                          </thead>
                          <tbody>
                            {standings.slice(0, 8).map((row, index) => (
                              <tr key={row.teamId}>
                                <td className={index === 0 ? "first" : ""}>{index + 1}</td>
                                <td className="name">{row.teamName}</td>
                                <td>{row.played}</td>
                                <td className="point">{row.points}</td>
                                <td>{row.gf - row.ga > 0 ? `+${row.gf - row.ga}` : row.gf - row.ga}</td>
                                <td>{`${row.win}-${row.draw}-${row.loss}`}</td>
                              </tr>
                            ))}
                            {standings.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="atd-empty-row">順位データがありません</td>
                              </tr>
                            ) : null}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="atd-match-list-card">
                      <h3 className="atd-sub-head only-title">
                        <span className="material-symbols-outlined">schedule</span>
                        試合スケジュール・結果
                      </h3>
                      <div className="atd-match-list">
                        {displayedMatches.map((match) => {
                          const homeScore = scoreText(match.result, "home");
                          const awayScore = scoreText(match.result, "away");
                          const isFinished = match.status === "finished";
                          const isLive = !isFinished && liveMatchId === match.id;
                          const stateLabel = isFinished ? "終了" : isLive ? "進行中" : "予定";
                          return (
                            <article key={match.id} className={`atd-match-item ${isLive ? "live" : ""}`}>
                              <div className="atd-match-top">
                                <div className="left">
                                  <span className={`chip ${isFinished ? "done" : isLive ? "live" : "plan"}`}>{stateLabel}</span>
                                  <span className="meta">{formatKickoffMeta(match.kickoff_at, match.field)}</span>
                                </div>
                                <button type="button" onClick={() => navigate(`/admin/matches?tournamentId=${id}`)}>
                                  <span className="material-symbols-outlined">edit</span>
                                  編集
                                </button>
                              </div>
                              <div className="atd-match-score">
                                <div className="team">{match.home_team_name || "-"}</div>
                                <div className="score">
                                  {homeScore !== null && awayScore !== null ? (
                                    <>
                                      <b>{homeScore}</b>
                                      <span>-</span>
                                      <b>{awayScore}</b>
                                    </>
                                  ) : (
                                    <em>vs</em>
                                  )}
                                </div>
                                <div className="team">{match.away_team_name || "-"}</div>
                              </div>
                            </article>
                          );
                        })}
                        {displayedMatches.length === 0 ? <p className="atd-empty">このグループの試合がありません。</p> : null}
                      </div>
                    </div>

                    <div className="atd-floating-cta-wrap">
                      <button type="button" className="atd-floating-cta" onClick={() => navigate(`/admin/matches?tournamentId=${id}`)}>
                        <span className="material-symbols-outlined">edit_calendar</span>
                        対戦スケジュールを編集
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : null}

            {activeTab === "settings" ? (
              <div className="atd-settings-form">
                <label>
                  大会名
                  <input value={form.name} onChange={onFormChange("name")} />
                </label>
                <label>
                  開催日
                  <input type="date" value={form.event_date} onChange={onFormChange("event_date")} />
                </label>
                <div className="atd-settings-grid">
                  <label>
                    開始時間
                    <input type="time" value={form.start_time} onChange={onFormChange("start_time")} />
                  </label>
                  <label>
                    終了時間
                    <input type="time" value={form.end_time} onChange={onFormChange("end_time")} />
                  </label>
                </div>
                <label>
                  会場
                  <input value={form.venue} onChange={onFormChange("venue")} />
                </label>
                <div className="atd-settings-grid">
                  <label>
                    募集チーム数
                    <input type="number" min="1" value={form.max_teams} onChange={onFormChange("max_teams")} />
                  </label>
                  <label>
                    参加費
                    <input type="number" min="0" value={form.entry_fee_amount} onChange={onFormChange("entry_fee_amount")} />
                  </label>
                </div>

                <div className="atd-group-head">
                  <label>グループ設定</label>
                  <button type="button" onClick={addGroup}>
                    <span className="material-symbols-outlined">add</span>グループを追加
                  </button>
                </div>

                <div className="atd-groups">
                  {groups.map((group) => (
                    <div key={group.id} className="atd-group-card">
                      <button type="button" className="close-btn" onClick={() => removeGroup(group.id)} aria-label="グループを削除">
                        <span className="material-symbols-outlined">close</span>
                      </button>
                      <label>
                        グループ名
                        <input value={group.name} onChange={(e) => setGroupName(group.id, e.target.value)} />
                      </label>
                      <div className="atd-stars">
                        <div className="atd-stars-head">
                          <label>強度・レベル</label>
                          <span>{getLevelLabel(group.stars)}</span>
                        </div>
                        <div className="star-row">
                          {[1, 2, 3, 4, 5].map((value) => (
                            <button type="button" key={value} onClick={() => setGroupStars(group.id, value)}>
                              <span className={`material-symbols-outlined ${value <= group.stars ? "filled" : ""}`}>star</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                  {groups.length === 0 ? <p className="atd-group-empty">グループは未設定です。</p> : null}
                </div>

                <label>
                  大会概要
                  <textarea rows={4} value={form.description} onChange={onFormChange("description")} />
                </label>
                <div className="atd-rules-editor">
                  <p>ルール</p>
                  <div className="atd-rule-presets">
                    {DEFAULT_RULE_OPTIONS.map((rule) => {
                      const selected = selectedRuleOptions.includes(rule);
                      return (
                        <button
                          key={rule}
                          type="button"
                          className={`atd-rule-preset ${selected ? "is-selected" : ""}`}
                          onClick={() => toggleDefaultRule(rule)}
                        >
                          <span className="material-symbols-outlined">{selected ? "check_circle" : "add_circle"}</span>
                          <span>{rule}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="atd-rule-add">
                    <input
                      type="text"
                      value={customRuleInput}
                      onChange={(e) => setCustomRuleInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomRule();
                        }
                      }}
                      placeholder="追加ルールを入力して追加"
                    />
                    <button type="button" onClick={addCustomRule}>
                      追加
                    </button>
                  </div>

                  <ul className="atd-rule-list">
                    {combinedRules.map((rule) => (
                      <li key={rule}>
                        <span className="material-symbols-outlined">check</span>
                        <span>{rule}</span>
                        {customRules.includes(rule) ? (
                          <button type="button" onClick={() => removeCustomRule(rule)} aria-label={`${rule}を削除`}>
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        ) : null}
                      </li>
                    ))}
                    {combinedRules.length === 0 ? <li className="atd-rule-empty">ルールが未設定です。</li> : null}
                  </ul>
                </div>

                <div className="atd-rules-editor">
                  <p>注意事項</p>
                  <div className="atd-rule-presets">
                    {DEFAULT_CAUTION_OPTIONS.map((item) => {
                      const selected = selectedCautionOptions.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          className={`atd-rule-preset ${selected ? "is-selected" : ""}`}
                          onClick={() => toggleDefaultCaution(item)}
                        >
                          <span className="material-symbols-outlined">{selected ? "check_circle" : "add_circle"}</span>
                          <span>{item}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="atd-rule-add">
                    <input
                      type="text"
                      value={customCautionInput}
                      onChange={(e) => setCustomCautionInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addCustomCaution();
                        }
                      }}
                      placeholder="追加注意事項を入力して追加"
                    />
                    <button type="button" onClick={addCustomCaution}>
                      追加
                    </button>
                  </div>

                  <ul className="atd-rule-list">
                    {combinedCautions.map((item) => (
                      <li key={item}>
                        <span className="material-symbols-outlined">check</span>
                        <span>{item}</span>
                        {customCautions.includes(item) ? (
                          <button type="button" onClick={() => removeCustomCaution(item)} aria-label={`${item}を削除`}>
                            <span className="material-symbols-outlined">close</span>
                          </button>
                        ) : null}
                      </li>
                    ))}
                    {combinedCautions.length === 0 ? <li className="atd-rule-empty">注意事項が未設定です。</li> : null}
                  </ul>
                </div>
                <button type="button" className="atd-save-btn" disabled={!canSave || saving} onClick={onSave}>
                  {saving ? "保存中..." : "保存する"}
                </button>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <AdminBottomNav />
    </div>
  );
}
