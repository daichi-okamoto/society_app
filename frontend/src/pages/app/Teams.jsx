import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api";
import LoadingScreen from "../../components/LoadingScreen";

const MEMBER_DEMO = [
  {
    id: 1,
    name: "田中 健太",
    position: "MF / #10",
    isCaptain: true,
    avatar: "https://ui-avatars.com/api/?name=%E7%94%B0%E4%B8%AD+%E5%81%A5%E5%A4%AA&background=fef3c7&color=b45309"
  },
  {
    id: 2,
    name: "佐藤 大輔",
    position: "FW / #9",
    avatar: "https://ui-avatars.com/api/?name=%E4%BD%90%E8%97%A4+%E5%A4%A7%E8%BC%94&background=e2e8f0&color=334155"
  },
  {
    id: 3,
    name: "鈴木 翔太",
    position: "GK / #1",
    avatar: "https://ui-avatars.com/api/?name=%E9%88%B4%E6%9C%A8+%E7%BF%94%E5%A4%AA&background=e2e8f0&color=334155"
  }
];

function formatDate(date) {
  const d = new Date(`${date}T00:00:00`);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function Teams() {
  const navigate = useNavigate();
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinCode, setJoinCode] = useState("");
  const [joinMessage, setJoinMessage] = useState(null);
  const [joinError, setJoinError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [copied, setCopied] = useState(false);

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

  const nextTournament = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return tournaments
      .map((t) => ({ ...t, d: new Date(`${t.event_date}T00:00:00`) }))
      .filter((t) => t.d >= today)
      .sort((a, b) => a.d.getTime() - b.d.getTime())[0];
  }, [tournaments]);

  const inviteCode = currentTeam?.join_code || "TK7-2024";

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
                  placeholder="チーム加入コード (例: TK7-2024)"
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
              <button type="button">
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
    <div className="tm-root">
      <header className="tm-header">
        <div className="left">
          <button type="button" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1>チーム管理</h1>
        </div>
        <button type="button" className="settings">
          <span className="material-symbols-outlined">settings</span>
        </button>
      </header>

      <main className="tm-main">
        <section className="tm-team-hero">
          <div className="bg-shape" />
          <div className="content">
            <div className="logo-wrap">
              <div className="logo-ring">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentTeam?.name || "FC 東京セブン")}&background=fef3c7&color=b45309&size=256`}
                  alt="Team Logo"
                />
              </div>
              <button type="button" className="edit-btn">
                <span className="material-symbols-outlined">edit</span>
              </button>
            </div>

            <h2>{currentTeam?.name || "FC 東京セブン"}</h2>
            <div className="sub-row">
              <span>@tokyo_seven_fc</span>
              <span className="verified">認証済み</span>
            </div>

            <div className="stats-row">
              <div>
                <strong>{currentTeam ? 12 : 0}</strong>
                <small>メンバー</small>
              </div>
              <div>
                <strong>{nextTournament ? 8 : 0}</strong>
                <small>大会参加</small>
              </div>
              <div>
                <strong>3</strong>
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

        <section>
          <div className="tm-title-row">
            <h3>メンバー一覧</h3>
            <button type="button" onClick={() => navigate(`/teams/${currentTeam.id}/members`)}>
              すべて見る
            </button>
          </div>

          <div className="tm-members">
            {MEMBER_DEMO.map((member) => (
              <div key={member.id} className="tm-member-card">
                <div className="left">
                  <div className="avatar-wrap">
                    <img src={member.avatar} alt={member.name} />
                    {member.isCaptain ? <span className="cp">CP</span> : null}
                  </div>
                  <div>
                    <div className="name">{member.name}</div>
                    <div className="role">{member.position}</div>
                  </div>
                </div>
                <button type="button">
                  <span className="material-symbols-outlined">more_horiz</span>
                </button>
              </div>
            ))}
          </div>

          <button type="button" className="tm-add-member">
            <span className="material-symbols-outlined">person_add</span>
            <span>メンバーを手動で追加</span>
          </button>
        </section>

        <section>
          <div className="tm-title-row only-title">
            <h3>次回の試合</h3>
          </div>

          <div className="tm-next-card">
            <div className="meta-row">
              <div className="left">
                <span className="entry">エントリー済み</span>
                <span className="venue">@渋谷フットサル</span>
              </div>
            </div>

            <h4>{nextTournament?.name || "J7 渋谷カップ Vol.12"}</h4>
            <p>
              <span className="material-symbols-outlined">schedule</span>
              {nextTournament ? `${formatDate(nextTournament.event_date)} 10:00 - 14:00` : "2026.02.14 10:00 - 14:00"}
            </p>

            <div className="actions">
              <Link to={`/tournaments/${nextTournament?.id || 1}`}>詳細確認</Link>
              <button type="button">
                <span className="material-symbols-outlined">chat</span>
              </button>
            </div>
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
            <button type="button">
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
