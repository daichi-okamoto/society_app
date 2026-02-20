import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";
import { useAuth } from "../../context/AuthContext";
import { normalizeTeamHandle, readTeamProfileDraft } from "../../lib/teamProfileDraft";
import {
  applyOverridesToMember,
  loadManualMembersForList,
  loadMemberOverrides,
  removeManualMemberRecord,
} from "../../lib/teamMembersStorage";

const ACTIVE_ENTRY_STATUSES = new Set(["approved", "pending"]);

function parseDate(value) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatDate(date) {
  const d = parseDate(date);
  if (!d) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function hasScoreResult(match) {
  if (!match?.result) return false;
  const { home_score: homeScore, away_score: awayScore } = match.result;
  return homeScore !== null && homeScore !== undefined && awayScore !== null && awayScore !== undefined;
}

function parseScore(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function summarizeMatches(matches, teamId) {
  let wins = 0;
  let losses = 0;
  let draws = 0;
  let goalsFor = 0;
  let goalsAgainst = 0;

  matches
    .filter((match) => hasScoreResult(match))
    .filter((match) => match.home_team_id === teamId || match.away_team_id === teamId)
    .forEach((match) => {
      const homeScore = parseScore(match.result?.home_score);
      const awayScore = parseScore(match.result?.away_score);
      if (homeScore === null || awayScore === null) return;

      const isHome = match.home_team_id === teamId;
      const myScore = isHome ? homeScore : awayScore;
      const oppScore = isHome ? awayScore : homeScore;

      goalsFor += myScore;
      goalsAgainst += oppScore;

      if (myScore > oppScore) wins += 1;
      else if (myScore < oppScore) losses += 1;
      else draws += 1;
    });

  return { wins, losses, draws, goalsFor, goalsAgainst };
}

function buildStandings(matches) {
  const table = new Map();

  const ensureRow = (teamId, name) => {
    const key = `${teamId || "none"}:${name || "unknown"}`;
    if (!table.has(key)) {
      table.set(key, {
        teamId: teamId || null,
        teamName: name,
        played: 0,
        win: 0,
        draw: 0,
        loss: 0,
        goalsFor: 0,
        goalsAgainst: 0,
        points: 0,
      });
    }
    return table.get(key);
  };

  matches.forEach((match) => {
    if (!hasScoreResult(match)) return;
    const homeScore = parseScore(match.result?.home_score);
    const awayScore = parseScore(match.result?.away_score);
    if (homeScore === null || awayScore === null) return;

    const home = ensureRow(match.home_team_id, match.home_team_name || "HOME");
    const away = ensureRow(match.away_team_id, match.away_team_name || "AWAY");

    home.played += 1;
    away.played += 1;
    home.goalsFor += homeScore;
    home.goalsAgainst += awayScore;
    away.goalsFor += awayScore;
    away.goalsAgainst += homeScore;

    if (homeScore > awayScore) {
      home.win += 1;
      away.loss += 1;
      home.points += 3;
    } else if (homeScore < awayScore) {
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

  return Array.from(table.values())
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      const aDiff = a.goalsFor - a.goalsAgainst;
      const bDiff = b.goalsFor - b.goalsAgainst;
      if (bDiff !== aDiff) return bDiff - aDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.teamName.localeCompare(b.teamName, "ja");
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function toMemberListItem(member, overrides = {}) {
  const patched = applyOverridesToMember(
    {
      id: member.id,
      name: member.name,
      pos: "",
      number: 0,
    },
    overrides
  );

  const hasPos = Boolean(patched.pos);
  const hasNum = Number(patched.number) > 0;
  let positionLabel = "ポジション未設定";
  if (hasPos && hasNum) positionLabel = `${patched.pos} / #${patched.number}`;
  else if (hasPos) positionLabel = patched.pos;
  else if (member.role === "captain") positionLabel = "CAPTAIN";

  return {
    key: `member-${member.id}`,
    id: member.id,
    team_member_id: member.id,
    user_id: member.user_id,
    name: member.name,
    pos: patched.pos || "",
    number: Number(patched.number) || 0,
    positionLabel,
    role: member.role,
    isCaptain: member.role === "captain",
    source: "invited",
    avatar:
      member.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name || "Member")}&background=e2e8f0&color=334155&size=128`,
  };
}

export default function Teams() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [teamDetail, setTeamDetail] = useState(null);
  const [entryStatusByTournament, setEntryStatusByTournament] = useState({});
  const [pastMetricsByTournament, setPastMetricsByTournament] = useState({});
  const [manualRevision, setManualRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinMessage, setJoinMessage] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [activePermissionId, setActivePermissionId] = useState(null);
  const [actionMessage, setActionMessage] = useState("");
  const [busyAction, setBusyAction] = useState(false);
  const menuRootRef = useRef(null);

  useEffect(() => {
    let active = true;
    Promise.all([api.get("/teams"), api.get("/tournaments")])
      .then(([teamsData, tournamentsData]) => {
        if (!active) return;
        setTeams(teamsData?.teams || []);
        setTournaments(tournamentsData?.tournaments || []);
      })
      .catch(() => {
        if (!active) return;
        setError("チーム一覧の取得に失敗しました");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const memberTeams = useMemo(() => teams.filter((t) => t.is_member), [teams]);
  const currentTeam = memberTeams[0] || null;

  useEffect(() => {
    if (!currentTeam?.id || typeof window === "undefined") return;
    try {
      window.sessionStorage.setItem("active_team_id", String(currentTeam.id));
    } catch {
      // ignore storage errors
    }
  }, [currentTeam?.id]);

  const refreshTeamDetail = async (teamId) => {
    const data = await api.get(`/teams/${teamId}`);
    setTeamDetail(data?.team || null);
  };

  useEffect(() => {
    if (!currentTeam?.id) {
      setTeamDetail(null);
      return;
    }

    let active = true;
    api
      .get(`/teams/${currentTeam.id}`)
      .then((data) => {
        if (!active) return;
        setTeamDetail(data?.team || null);
      })
      .catch(() => {
        if (!active) return;
        setTeamDetail(null);
      });

    return () => {
      active = false;
    };
  }, [currentTeam?.id]);

  useEffect(() => {
    if (!currentTeam?.id || tournaments.length === 0) {
      setEntryStatusByTournament({});
      return;
    }

    let active = true;
    Promise.allSettled(tournaments.map((tournament) => api.get(`/tournaments/${tournament.id}/entries/me`)))
      .then((results) => {
        if (!active) return;
        const next = {};

        results.forEach((result, index) => {
          if (result.status !== "fulfilled") return;
          const entry = result.value?.entry;
          if (!entry) return;
          if (Number(entry.team_id) !== Number(currentTeam.id)) return;
          next[tournaments[index].id] = entry.status;
        });

        setEntryStatusByTournament(next);
      })
      .catch(() => {
        if (!active) return;
        setEntryStatusByTournament({});
      });

    return () => {
      active = false;
    };
  }, [currentTeam?.id, tournaments]);

  const teamDraft = useMemo(() => readTeamProfileDraft(currentTeam?.id), [currentTeam?.id]);
  const overrides = useMemo(() => loadMemberOverrides(currentTeam?.id), [currentTeam?.id, manualRevision]);
  const manualMembers = useMemo(() => loadManualMembersForList(currentTeam?.id), [currentTeam?.id, manualRevision]);

  const apiMembers = useMemo(() => {
    const raw = Array.isArray(teamDetail?.members) ? teamDetail.members : [];
    return raw.map((member) => toMemberListItem(member, overrides));
  }, [teamDetail?.members, overrides]);

  const mergedMembers = useMemo(() => {
    const manual = manualMembers.map((member) => ({
      ...member,
      key: `manual-${member.id}`,
      pos: member.pos || "MF",
      number: Number(member.number) || 0,
      positionLabel: `${member.pos || "MF"} / #${Number(member.number) > 0 ? member.number : "-"}`,
      isCaptain: false,
      role: "member",
      team_member_id: null,
      user_id: null,
    }));

    return [...apiMembers, ...manual];
  }, [apiMembers, manualMembers]);

  const participatingTournaments = useMemo(() => {
    return tournaments
      .filter((tournament) => ACTIVE_ENTRY_STATUSES.has(entryStatusByTournament[tournament.id]))
      .map((tournament) => ({ ...tournament, entryStatus: entryStatusByTournament[tournament.id] }));
  }, [tournaments, entryStatusByTournament]);

  const { nextTournament, pastParticipatedTournaments } = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const upcoming = [];
    const past = [];

    participatingTournaments.forEach((tournament) => {
      const eventDate = parseDate(tournament.event_date);
      if (!eventDate) return;
      if (eventDate >= today) upcoming.push(tournament);
      else past.push(tournament);
    });

    upcoming.sort((a, b) => a.event_date.localeCompare(b.event_date));
    past.sort((a, b) => b.event_date.localeCompare(a.event_date));

    return {
      nextTournament: upcoming[0] || null,
      pastParticipatedTournaments: past,
    };
  }, [participatingTournaments]);

  useEffect(() => {
    if (!currentTeam?.id || pastParticipatedTournaments.length === 0) {
      setPastMetricsByTournament({});
      return;
    }

    let active = true;
    Promise.allSettled(
      pastParticipatedTournaments.map((tournament) => api.get(`/tournaments/${tournament.id}/matches`))
    )
      .then((results) => {
        if (!active) return;

        const next = {};
        results.forEach((result, index) => {
          if (result.status !== "fulfilled") return;
          const tournament = pastParticipatedTournaments[index];
          const matches = result.value?.matches || [];
          const summary = summarizeMatches(matches, Number(currentTeam.id));
          const standings = buildStandings(matches);
          const focusStanding = standings.find((row) => Number(row.teamId) === Number(currentTeam.id));

          next[tournament.id] = {
            ...summary,
            rank: focusStanding?.rank || null,
            teamCount: standings.length,
          };
        });

        setPastMetricsByTournament(next);
      })
      .catch(() => {
        if (!active) return;
        setPastMetricsByTournament({});
      });

    return () => {
      active = false;
    };
  }, [pastParticipatedTournaments, currentTeam?.id]);

  useEffect(() => {
    function onPointerDown(event) {
      if (!menuRootRef.current) return;
      if (!menuRootRef.current.contains(event.target)) {
        setActiveMenuId(null);
        setActivePermissionId(null);
      }
    }

    window.addEventListener("pointerdown", onPointerDown);
    return () => window.removeEventListener("pointerdown", onPointerDown);
  }, []);

  const inviteCode = currentTeam?.join_code || "TS-000000";
  const teamHandle = normalizeTeamHandle(
    teamDraft?.teamHandle || (currentTeam?.slug ? `@${currentTeam.slug}` : ""),
    currentTeam?.name || ""
  );
  const teamLocation =
    teamDraft?.locationLabel ||
    currentTeam?.activity_area ||
    currentTeam?.area ||
    currentTeam?.location ||
    "東京都渋谷区";
  const teamDescription =
    teamDraft?.introduction ||
    currentTeam?.description ||
    currentTeam?.introduction ||
    "社会人を中心とした、エンジョイ志向のチームです。週末の朝を中心に活動しています。未経験者も大歓迎！";

  const memberCount = mergedMembers.length;
  const tournamentCount = participatingTournaments.length;
  const championCount = useMemo(
    () => Object.values(pastMetricsByTournament).filter((metric) => Number(metric?.rank) === 1).length,
    [pastMetricsByTournament]
  );

  const visibleMembers = mergedMembers.slice(0, 6);
  const canManageMembers = user?.role === "admin" || Number(teamDetail?.captain_user_id) === Number(user?.id);

  async function handleJoin() {
    if (!joinCode.trim() || joining) return;
    setJoining(true);
    setJoinMessage(null);
    setJoinError(null);

    try {
      const data = await api.post("/teams/join-by-code", { join_code: joinCode.trim().toUpperCase() });
      setJoinMessage(`「${data?.team?.name || "チーム"}」へ参加申請を送信しました。`);
      setJoinCode("");
    } catch (e) {
      if (e?.status === 404) setJoinError("チーム加入コードが見つかりません。");
      else if (e?.status === 409) setJoinError("すでに参加済み、または申請中です。");
      else setJoinError("参加申請に失敗しました。");
    } finally {
      setJoining(false);
    }
  }

  async function handleCopyInviteCode() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(inviteCode);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = inviteCode;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  function openMemberMenu(memberKey) {
    setActionMessage("");
    setActivePermissionId(null);
    setActiveMenuId((prev) => (prev === memberKey ? null : memberKey));
  }

  function openMemberEdit(member) {
    if (!currentTeam) return;
    navigate(`/teams/${currentTeam.id}/members/${member.id}/edit`, {
      state: {
        member: {
          id: member.id,
          name: member.name,
          pos: member.pos || "MF",
          number: Number(member.number) || 0,
          source: member.source,
          avatar: member.avatar,
          role: member.role,
        },
      },
    });
  }

  async function deleteMember(member) {
    if (!currentTeam || busyAction) return;
    if (!canManageMembers) {
      setActionMessage("メンバーを削除できるのは代表者のみです。");
      return;
    }

    setBusyAction(true);
    setActionMessage("");

    try {
      if (member.source === "manual") {
        removeManualMemberRecord(currentTeam.id, member.id);
        setManualRevision((prev) => prev + 1);
      } else if (member.team_member_id) {
        await api.del(`/team_members/${member.team_member_id}`);
        await refreshTeamDetail(currentTeam.id);
      }

      setActionMessage("メンバーを削除しました。");
      setActiveMenuId(null);
      setActivePermissionId(null);
    } catch {
      setActionMessage("メンバーの削除に失敗しました。");
    } finally {
      setBusyAction(false);
    }
  }

  async function transferCaptain(member) {
    if (!currentTeam || busyAction) return;
    if (!canManageMembers) {
      setActionMessage("権限変更ができるのは代表者のみです。");
      return;
    }
    if (!member.user_id) {
      setActionMessage("手動追加メンバーには代表権限を付与できません。");
      return;
    }

    setBusyAction(true);
    setActionMessage("");

    try {
      await api.post(`/teams/${currentTeam.id}/transfer_captain`, {
        new_captain_user_id: member.user_id,
      });
      await refreshTeamDetail(currentTeam.id);
      setActionMessage("代表権限を更新しました。");
      setActivePermissionId(null);
      setActiveMenuId(null);
    } catch {
      setActionMessage("権限の更新に失敗しました。");
    } finally {
      setBusyAction(false);
    }
  }

  if (loading) return <LoadingScreen />;
  if (error) return <section>{error}</section>;

  if (!currentTeam) {
    return (
      <div className="tn-root">
        <header className="tn-header">
          <h1>チーム</h1>
          <button type="button">
            <span className="material-symbols-outlined">notifications</span>
          </button>
        </header>

        <main className="tn-main">
          <section className="tn-hero">
            <div className="icon-wrap">
              <span className="material-symbols-outlined">diversity_3</span>
            </div>
            <h2>
              チームに参加して
              <br />
              大会に出場しよう！
            </h2>
            <p>
              仲間と一緒にサッカーを楽しもう。
              <br />
              まずはチームへの所属が必要です。
            </p>
          </section>

          <section className="tn-card">
            <div className="head">
              <div className="icon login">
                <span className="material-symbols-outlined">login</span>
              </div>
              <div>
                <h3>チームに参加する</h3>
                <p>招待コードをお持ちの方</p>
              </div>
            </div>

            <div className="form-wrap">
              <div className="input-wrap">
                <span className="material-symbols-outlined">vpn_key</span>
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  placeholder="チーム加入コード (例: TS-123456)"
                />
              </div>

              {joinMessage ? <p className="msg success">{joinMessage}</p> : null}
              {joinError ? <p className="msg error">{joinError}</p> : null}

              <button type="button" className="join-btn" onClick={handleJoin} disabled={joining}>
                <span>{joining ? "送信中..." : "参加する"}</span>
              </button>
            </div>
          </section>

          <section className="tn-card">
            <div className="head">
              <div className="icon create">
                <span className="material-symbols-outlined">add</span>
              </div>
              <div>
                <h3>新しくチームを作る</h3>
                <p>ゼロからチームを立ち上げる</p>
              </div>
            </div>

            <button type="button" className="create-btn" onClick={() => navigate("/teams/new") }>
              <span className="material-symbols-outlined">add_circle</span>
              <span>チーム作成</span>
            </button>
          </section>
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

  return (
    <div className="tm-root" ref={menuRootRef}>
      <header className="tm-header">
        <div className="left">
          <button type="button" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1>チーム管理</h1>
        </div>
        <button type="button" className="settings" aria-label="設定">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <main className="tm-main">
        <section className="tm-team-hero">
          <div className="bg-shape" />
          <button
            type="button"
            className="hero-edit"
            onClick={() => currentTeam && navigate(`/teams/${currentTeam.id}/edit`)}
          >
            <span className="material-symbols-outlined">edit</span>
            <span>編集</span>
          </button>

          <div className="content">
            <div className="logo-ring">
              <img
                src={
                  teamDraft?.logoDataUrl ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(currentTeam?.name || "FC 東京セブン")}&background=fef3c7&color=b45309&size=256`
                }
                alt="Team Logo"
              />
            </div>

            <h2>{currentTeam?.name || "FC 東京セブン"}</h2>
            <div className="sub-row">
              <span>{teamHandle}</span>
              <span className="verified">認証済み</span>
            </div>

            <div className="meta-card">
              <div className="meta-item">
                <span className="material-symbols-outlined">location_on</span>
                <div>
                  <small>活動拠点</small>
                  <p>{teamLocation}</p>
                </div>
              </div>
              <div className="meta-item">
                <span className="material-symbols-outlined">description</span>
                <div>
                  <small>チーム紹介</small>
                  <p>{teamDescription}</p>
                </div>
              </div>
            </div>

            <div className="stats-row">
              <div>
                <strong>{memberCount}</strong>
                <small>メンバー</small>
              </div>
              <div>
                <strong>{tournamentCount}</strong>
                <small>大会参加</small>
              </div>
              <div>
                <strong>{championCount}</strong>
                <small>優勝</small>
              </div>
            </div>
          </div>
        </section>

        <section className="tm-invite">
          <div className="row">
            <div>
              <h3>メンバー招待</h3>
              <p>招待コードを共有してメンバーを追加しよう</p>
              <div className="code-pill">
                <span>{inviteCode}</span>
                <button type="button" onClick={handleCopyInviteCode} aria-label="招待コードをコピー">
                  <span className="tm-copy-icon" aria-hidden="true">{copied ? "✓" : "⧉"}</span>
                </button>
              </div>
            </div>
            <div className="qr">
              <span className="material-symbols-outlined">qr_code_2</span>
            </div>
          </div>
        </section>

        {canManageMembers && Number(currentTeam?.pending_join_requests_count || 0) > 0 ? (
          <section className="tm-request-card">
            <div>
              <h3>参加申請</h3>
              <p>承認待ち {currentTeam.pending_join_requests_count} 件</p>
            </div>
            <button type="button" onClick={() => navigate(`/teams/${currentTeam.id}/requests`)}>
              承認/拒否へ
            </button>
          </section>
        ) : null}

        <section>
          <div className="tm-title-row">
            <h3>メンバー一覧</h3>
            <button
              type="button"
              onClick={() => currentTeam && navigate(`/teams/${currentTeam.id}/members`)}
              disabled={!currentTeam}
            >
              すべて見る
            </button>
          </div>

          {actionMessage ? <p className="tm-inline-message">{actionMessage}</p> : null}

          <div className="tm-members">
            {visibleMembers.length === 0 ? (
              <p className="tm-empty">メンバーがまだ登録されていません。</p>
            ) : (
              visibleMembers.map((member) => (
                <div key={member.key} className="tm-member-card">
                  <div className="left">
                    <div className="avatar-wrap">
                      <img src={member.avatar} alt={member.name} />
                      {member.isCaptain ? <span className="cp">CP</span> : null}
                    </div>
                    <div>
                      <div className="name">{member.name}</div>
                      <div className="role">{member.positionLabel}</div>
                    </div>
                  </div>

                  <div className="tm-member-actions">
                    <button type="button" aria-label="メンバー操作" onClick={() => openMemberMenu(member.key)}>
                      <span className="material-symbols-outlined">more_horiz</span>
                    </button>

                    {activeMenuId === member.key ? (
                      <div className="tm-member-menu" role="menu" aria-label="メンバー操作メニュー">
                        <button type="button" onClick={() => openMemberEdit(member)}>
                          編集
                        </button>
                        <button type="button" onClick={() => deleteMember(member)} disabled={busyAction}>
                          削除
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setActivePermissionId((prev) => (prev === member.key ? null : member.key))
                          }
                        >
                          権限
                        </button>
                      </div>
                    ) : null}

                    {activePermissionId === member.key ? (
                      <div className="tm-permission-menu" role="menu" aria-label="権限メニュー">
                        <button
                          type="button"
                          onClick={() => transferCaptain(member)}
                          disabled={busyAction || member.isCaptain}
                        >
                          キャプテンにする
                        </button>
                        <button type="button" disabled>
                          現在: {member.isCaptain ? "キャプテン" : "メンバー"}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          <button
            type="button"
            className="tm-add-member"
            onClick={() => currentTeam && navigate(`/teams/${currentTeam.id}/members/manual-add`)}
            disabled={!currentTeam}
          >
            <span className="material-symbols-outlined">person_add</span>
            <span>メンバーを手動で追加</span>
          </button>
        </section>

        <section>
          <div className="tm-title-row only-title">
            <h3>次の試合</h3>
          </div>

          {nextTournament ? (
            <div className="tm-next-card">
              <div className="meta-row">
                <div className="left">
                  <span className="entry">エントリー済み</span>
                  <span className="venue">@{nextTournament.venue || "会場未定"}</span>
                </div>
              </div>

              <h4>{nextTournament.name}</h4>
              <p>
                <span className="material-symbols-outlined">schedule</span>
                {`${formatDate(nextTournament.event_date)} 10:00 - 14:00`}
              </p>

              <div className="actions">
                <Link to={`/tournaments/${nextTournament.id}`}>詳細確認</Link>
                <button type="button" aria-label="チャット">
                  <span className="material-symbols-outlined">chat</span>
                </button>
              </div>
            </div>
          ) : (
            <p className="tm-empty">申し込み済みの開催予定大会はありません。</p>
          )}
        </section>

        <section>
          <div className="tm-title-row only-title">
            <h3>過去の大会</h3>
          </div>

          <div className="tm-past-list">
            {pastParticipatedTournaments.length === 0 ? (
              <p className="tm-empty">参加済みの過去大会はありません。</p>
            ) : (
              pastParticipatedTournaments.slice(0, 6).map((tournament) => {
                const metrics = pastMetricsByTournament[tournament.id];
                return (
                  <Link key={tournament.id} to={`/tournaments/${tournament.id}/results`} className="tm-past-card">
                    <div className="tm-past-head">
                      <span className="tm-past-date">{formatDate(tournament.event_date)}</span>
                      <span className="material-symbols-outlined">chevron_right</span>
                    </div>
                    <h4>{tournament.name}</h4>
                    <div className="tm-past-meta">
                      <span>
                        {metrics?.rank ? `${metrics.rank}位` : "順位未確定"}
                      </span>
                      <span>
                        {metrics
                          ? `${metrics.wins}勝${metrics.losses}敗${metrics.draws}分`
                          : "試合結果集計中"}
                      </span>
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </section>
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
