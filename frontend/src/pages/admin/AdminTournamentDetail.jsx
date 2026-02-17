import { Link, useNavigate, useParams } from "react-router-dom";

const SAMPLE_TOURNAMENTS = {
  "tokyo-sevens": {
    idText: "#TSC-2023-005",
    title: "第5回 東京セブンズカップ",
    status: "募集中",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuArmpCuqVtA8v8TSrNLYNIa8STfBQr0JkidJPLJYHTg6K2qy98F3J0sHQ0WtejsoXu9JWYGCAc_Eodv-dRIIssNeiCJ4uRhCdBwETMSqfNcqp86lm8rt76vTh0lXAQdzu56cLaHk6C2OOQ8NIqMDH0VVI_sF364oBWQk3a2bRgzDTJyAO_VSsaOkft8yeqkNh1Bp0g-l2LfUCHNeAUxJPC9TcPK-HS55ht7pWufV-cXhCT_uE8nAaq4aUdygoSPXjNPlBUpdCwc7tU0",
  },
};

const DEFAULT_TOURNAMENT = {
  idText: "#TOUR-000",
  title: "大会詳細",
  status: "募集中",
  image:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuArmpCuqVtA8v8TSrNLYNIa8STfBQr0JkidJPLJYHTg6K2qy98F3J0sHQ0WtejsoXu9JWYGCAc_Eodv-dRIIssNeiCJ4uRhCdBwETMSqfNcqp86lm8rt76vTh0lXAQdzu56cLaHk6C2OOQ8NIqMDH0VVI_sF364oBWQk3a2bRgzDTJyAO_VSsaOkft8yeqkNh1Bp0g-l2LfUCHNeAUxJPC9TcPK-HS55ht7pWufV-cXhCT_uE8nAaq4aUdygoSPXjNPlBUpdCwc7tU0",
};

const teams = [
  { code: "FC", color: "blue", name: "FC バルセロナ東京", status: "承認済み", meta: "代表: 佐藤 健太 • メンバー: 9名" },
  { code: "RD", color: "red", name: "レッドドラゴンズ", status: "承認済み", meta: "代表: 田中 宏 • メンバー: 7名" },
  { code: "MK", color: "gray", name: "港区キッカーズ", status: "承認待ち", meta: "代表: 山本 太郎 • メンバー: 登録中" },
  { code: "SV", color: "indigo", name: "渋谷ユナイテッド", status: "承認済み", meta: "代表: 鈴木 一郎 • メンバー: 8名" },
  { code: "GR", color: "emerald", name: "グリーンロケッツ", status: "承認済み", meta: "代表: 高橋 裕二 • メンバー: 10名" },
];

export default function AdminTournamentDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const tournament = SAMPLE_TOURNAMENTS[id] || DEFAULT_TOURNAMENT;

  return (
    <div className="atd-root">
      <header className="atd-header">
        <div className="atd-header-row">
          <div className="atd-header-left">
            <button type="button" className="atd-icon-btn" onClick={() => navigate(-1)}>
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1>大会詳細</h1>
          </div>
          <div className="atd-header-actions">
            <button type="button" className="atd-icon-btn">
              <span className="material-symbols-outlined">edit</span>
            </button>
            <button type="button" className="atd-icon-btn is-danger">
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </header>

      <main className="atd-main">
        <section className="atd-summary-card">
          <div className="atd-hero">
            <img src={tournament.image} alt="" />
            <div className="atd-hero-overlay" />
            <div className="atd-status-chip">{tournament.status}</div>
            <div className="atd-hero-copy">
              <h2>{tournament.title}</h2>
              <p>ID: {tournament.idText}</p>
            </div>
          </div>

          <div className="atd-facts">
            <div className="atd-fact">
              <div className="atd-fact-icon">
                <span className="material-symbols-outlined">calendar_month</span>
              </div>
              <div className="atd-fact-body">
                <small>開催日時</small>
                <strong>11/24 (土) 10:00 〜 16:00</strong>
                <span>※雨天決行・荒天中止</span>
              </div>
            </div>

            <div className="atd-fact">
              <div className="atd-fact-icon">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <div className="atd-fact-body">
                <div className="atd-fact-head">
                  <small>募集状況</small>
                  <em>あと4チーム</em>
                </div>
                <div className="atd-count-row">
                  <strong>12</strong>
                  <span>/ 16 チーム</span>
                </div>
                <div className="atd-progress-track">
                  <div className="atd-progress-fill" style={{ width: "75%" }} />
                </div>
              </div>
            </div>

            <div className="atd-fact">
              <div className="atd-fact-icon">
                <span className="material-symbols-outlined">location_on</span>
              </div>
              <div className="atd-fact-body">
                <small>会場</small>
                <strong>墨田区総合運動場 フットサルコート A・B面</strong>
              </div>
            </div>

            <div className="atd-fact">
              <div className="atd-fact-icon">
                <span className="material-symbols-outlined">payments</span>
              </div>
              <div className="atd-fact-body">
                <small>参加費</small>
                <strong>
                  ¥15,000 <span>/ チーム</span>
                </strong>
              </div>
            </div>
          </div>
        </section>

        <section className="atd-panel">
          <div className="atd-tabs">
            <button type="button" className="active">
              参加チーム <span>12</span>
            </button>
            <button type="button">対戦表・結果</button>
            <button type="button">詳細設定</button>
          </div>

          <div className="atd-panel-body">
            <div className="atd-team-search">
              <span className="material-symbols-outlined">search</span>
              <input type="text" placeholder="チーム名で検索" />
            </div>

            <div className="atd-team-list">
              {teams.map((team) => (
                <button type="button" key={team.name} className={`atd-team-row ${team.status === "承認待ち" ? "pending" : ""}`}>
                  <div className={`atd-team-logo ${team.color}`}>{team.code}</div>
                  <div className="atd-team-main">
                    <div className="atd-team-top">
                      <h4>{team.name}</h4>
                      <span className={`atd-tag ${team.status === "承認待ち" ? "pending" : "approved"}`}>{team.status}</span>
                    </div>
                    <p>{team.meta}</p>
                  </div>
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <nav className="atd-nav">
        <div className="atd-nav-row">
          <Link to="/admin" className="atd-nav-item">
            <span className="material-symbols-outlined">dashboard</span>
            <span>ダッシュ</span>
          </Link>
          <Link to="/admin/tournaments" className="atd-nav-item active">
            <span className="material-symbols-outlined">emoji_events</span>
            <span>大会</span>
          </Link>
          <Link to="/admin/teams" className="atd-nav-item">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/admin/payments" className="atd-nav-item">
            <span className="material-symbols-outlined">payments</span>
            <span>決済</span>
          </Link>
          <Link to="/admin/notifications" className="atd-nav-item">
            <span className="material-symbols-outlined">notifications</span>
            <span>通知</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
