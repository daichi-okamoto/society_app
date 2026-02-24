import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api";
import { useAuth } from "../../context/AuthContext";
import LoadingScreen from "../../components/LoadingScreen";

const ENTRY_CATEGORIES = [
  {
    value: "enjoy",
    label: "エンジョイ",
    description: "初心者中心の楽しく蹴りたいチーム向け",
  },
  {
    value: "open",
    label: "オープン",
    description: "レベルを問わず真剣に勝負したいチーム向け",
  },
  {
    value: "beginner",
    label: "ビギナー",
    description: "大会出場経験が少ないチーム向け",
  },
];

export default function TournamentEntry() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [teamId, setTeamId] = useState("");
  const [category, setCategory] = useState("enjoy");
  const [paymentType, setPaymentType] = useState("card");
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    api
      .get("/teams")
      .then((data) => {
        if (!active) return;
        const all = data?.teams || [];
        const memberTeams = all.filter((team) => team.is_member);

        setTeams(memberTeams);
        setTeamId((memberTeams[0]?.id ?? "").toString());
      })
      .catch(() => {
        if (!active) return;
        setLoadError("エントリーチームを取得できませんでした。");
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const teamOptions = useMemo(() => {
    if (teams.length > 0) return teams;
    if (!user?.team_name) return [];

    return [
      {
        id: "current",
        name: user.team_name,
      },
    ];
  }, [teams, user]);

  const onSubmit = (e) => {
    e.preventDefault();

    if (!teamId) {
      setError("エントリーチームを選択してください。");
      return;
    }

    const selectedTeam = teamOptions.find((team) => String(team.id) === String(teamId));
    if (selectedTeam?.status && selectedTeam.status !== "approved") {
      setError("このチームは未承認のため大会エントリーできません。承認後にお試しください。");
      return;
    }

    setError(null);
    const draft = {
      team_id: Number(teamId),
      team_name: selectedTeam?.name || "",
      category,
      payment_method: paymentType,
      representative_name: user?.name || "田中 健太郎",
      representative_phone: user?.phone_number || user?.phone || "090-1234-5678",
      amount: 15000,
    };
    window.sessionStorage.setItem(`entry-draft:${id}`, JSON.stringify(draft));
    navigate(`/tournaments/${id}/entry/confirm`, { state: { draft } });
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="entry-root">
      <header className="entry-header">
        <button type="button" onClick={() => window.history.back()} aria-label="閉じる">
          <span className="material-symbols-outlined">close</span>
        </button>
        <h1>大会エントリー</h1>
        <span className="entry-header-spacer" />
      </header>

      <section className="entry-progress" aria-label="エントリー手順">
        <div className="entry-progress-track" />
        <div className="entry-progress-item active">
          <span className="entry-progress-badge">1</span>
          <p>情報入力</p>
        </div>
        <div className="entry-progress-item">
          <span className="entry-progress-badge">2</span>
          <p>内容確認</p>
        </div>
        <div className="entry-progress-item">
          <span className="entry-progress-badge">3</span>
          <p>完了</p>
        </div>
      </section>

      <main className="entry-main">
        <form className="entry-form" id="tournament-entry-form" onSubmit={onSubmit}>
          <div className="entry-field-group">
            <label className="entry-label" htmlFor="entry-team-select">
              エントリーチーム
            </label>
            <div className="entry-select-wrap">
              <select
                id="entry-team-select"
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                required
              >
                {teamOptions.map((team) => (
                  <option key={team.id} value={team.id}>
                    {team.name}
                  </option>
                ))}
              </select>
              <span className="material-symbols-outlined">expand_more</span>
            </div>
            {teamId && teamOptions.find((team) => String(team.id) === String(teamId))?.status === "pending" ? (
              <p className="entry-inline-note">選択中のチームは承認待ちです。承認後にエントリーできます。</p>
            ) : null}
            {loadError ? <p className="entry-inline-note">{loadError}</p> : null}
          </div>

          <div className="entry-field-group">
            <label className="entry-label">参加カテゴリー</label>
            <div className="entry-radio-grid">
              {ENTRY_CATEGORIES.map((item) => (
                <label key={item.value} className="entry-radio-row">
                  <input
                    type="radio"
                    name="category"
                    value={item.value}
                    checked={category === item.value}
                    onChange={(e) => setCategory(e.target.value)}
                  />
                  <div className="entry-radio-content">
                    <span className="entry-radio-title">{item.label}</span>
                    <span className="entry-radio-caption">{item.description}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="entry-field-group">
            <label className="entry-label">代表者情報</label>
            <div className="entry-profile-block">
              <div className="entry-text-field">
                <label>代表者氏名</label>
                <input readOnly value={user?.name || "田中 健太郎"} />
              </div>
              <div className="entry-text-field">
                <label>電話番号</label>
                <input readOnly value={user?.phone_number || user?.phone || "090-1234-5678"} />
              </div>
              <p>
                <span className="material-symbols-outlined">info</span>
                プロフィール情報から自動入力されています
              </p>
            </div>
          </div>

          <div className="entry-field-group">
            <label className="entry-label">お支払い方法</label>
            <div className="entry-payment-wrap">
              <label className="entry-radio-row">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentType === "card"}
                  onChange={(e) => setPaymentType(e.target.value)}
                />
                <div className="entry-radio-content entry-payment-main">
                  <span className="entry-radio-title icon-row">
                    <span className="material-symbols-outlined">credit_card</span>
                    クレジットカード
                  </span>
                </div>
              </label>

              <label className="entry-radio-row">
                <input
                  type="radio"
                  name="payment"
                  value="cash"
                  checked={paymentType === "cash"}
                  onChange={(e) => setPaymentType(e.target.value)}
                />
                <div className="entry-radio-content">
                  <span className="entry-radio-title icon-row">
                    <span className="material-symbols-outlined">payments</span>
                    当日払い
                  </span>
                  <span className="entry-radio-caption">※当日払いは現金のみとなります</span>
                </div>
              </label>
            </div>
          </div>

          {error ? <p className="entry-error">{error}</p> : null}
        </form>
      </main>

      <div className="entry-footer sticky-footer">
        <div className="entry-total-row">
          <div>
            <span>合計金額（税込）</span>
            <strong>¥15,000</strong>
          </div>
          <span>1チームあたり</span>
        </div>

        <button type="submit" form="tournament-entry-form">
          <span>確認画面へ進む</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    </div>
  );
}
