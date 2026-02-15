import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

const COVER_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCX9N6okYrlSA1JKbjKPe2_OujI5m-zAzfcWY6dOzQXUlqN9fIRSxO_fow1KBmxaYSudTZ_ag5J0YGHfE5NyDAiKo88kZu02LEKIs7vX7-YpAIhujKiuIZaTgsNOir5-rx2E2WiM2ozCYYAcfeiFYyxfOngcE6_Tx7HCaieXyeyOVbYf1Pfz8ry5aegO7v_iIommHbn2LUuXWkF4IgkzymE5RF7WbOhknTU51mDkLaYr64wO2o7IWVRuAoo9mNi55XVan_RHplgzHaw";

function formatDate(dateText) {
  if (!dateText) return "-";
  const date = new Date(`${dateText}T00:00:00`);
  return date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric", weekday: "short" });
}

export default function TournamentDetailUpcoming({ tournament }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div className="tdetail-root">
      <div className="tdetail-hero">
        <img src={COVER_IMAGE} alt="Tournament Cover" />
        <div className="tdetail-hero-overlay" />
        <button type="button" className="tdetail-back" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <div className="tdetail-hero-copy">
          <span className="tdetail-status">募集中</span>
          <h1>{tournament.name}</h1>
        </div>
      </div>

      <main className="tdetail-main">
        <section className="tdetail-info">
          <div className="tdetail-location">
            <span className="material-symbols-outlined">location_on</span>
            <span>{tournament.venue}</span>
          </div>

          <div className="tdetail-kpis">
            <article>
              <span className="material-symbols-outlined">calendar_month</span>
              <small>開催日時</small>
              <strong>{formatDate(tournament.event_date)}</strong>
              <strong>19:00〜</strong>
            </article>
            <article>
              <span className="material-symbols-outlined">groups</span>
              <small>募集チーム</small>
              <strong>残り 2 / 8</strong>
            </article>
            <article>
              <span className="material-symbols-outlined">payments</span>
              <small>参加費</small>
              <strong>¥{Number(tournament.entry_fee_amount || 0).toLocaleString("ja-JP")}</strong>
              <em>/ 1チーム</em>
            </article>
          </div>
        </section>

        <section>
          <div className="tdetail-tabs">
            <button type="button" className={activeTab === "overview" ? "active" : ""} onClick={() => setActiveTab("overview")}>
              概要
            </button>
            <button type="button" className={activeTab === "rules" ? "active" : ""} onClick={() => setActiveTab("rules")}>
              ルール
            </button>
          </div>

          <div className="tdetail-content">
            {activeTab === "overview" ? (
              <div className="tdetail-sections">
                <section>
                  <h2>
                    <span />
                    大会概要
                  </h2>
                  <p>
                    仕事終わりに最高の汗を流しませんか？新宿中央公園内の綺麗な人工芝コートで開催される、
                    初心者から経験者まで楽しめる7人制サッカー大会です。審判はJ7公認レフェリーが務めますので、
                    安心してプレイいただけます。
                  </p>
                </section>

                <section>
                  <h2>
                    <span />
                    開催場所
                  </h2>
                  <div className="tdetail-map">
                    <span className="material-symbols-outlined">map</span>
                    <div>新宿中央公園多目的運動広場</div>
                  </div>
                </section>

                <section>
                  <h2>
                    <span />
                    注意事項
                  </h2>
                  <ul>
                    <li>雨天決行（荒天時は中止のご連絡をいたします）</li>
                    <li>スパイクの使用は禁止です（トレシュ推奨）</li>
                    <li>開始20分前までに受付をお済ませください</li>
                  </ul>
                </section>
              </div>
            ) : (
              <div className="tdetail-sections">
                <section>
                  <h2>
                    <span />
                    試合形式
                  </h2>
                  <ul className="tdetail-dots">
                    <li>12分ハーフ（ハーフタイム3分）</li>
                    <li>予選リーグ（各チーム3試合）+ 順位決定戦</li>
                    <li>同点の場合はPK戦（3人制）にて勝敗を決定</li>
                  </ul>
                </section>

                <section>
                  <h2>
                    <span />
                    競技規則
                  </h2>
                  <div className="tdetail-rule-card">
                    <article>
                      <span className="material-symbols-outlined">sports_soccer</span>
                      <div>
                        <h3>基本ルール</h3>
                        <p>JFA 7人制サッカー競技規則に準ずる。ただし、オフサイドはございません。</p>
                      </div>
                    </article>
                    <article>
                      <span className="material-symbols-outlined">swap_horiz</span>
                      <div>
                        <h3>交代ルール</h3>
                        <p>自由な交代（審判への申告不要、交代エリアからの出入り）が可能です。</p>
                      </div>
                    </article>
                    <article>
                      <span className="material-symbols-outlined">warning</span>
                      <div>
                        <h3>ラフプレイ</h3>
                        <p>スライディングタックルは原則禁止（シュートブロック等の一部例外あり）。</p>
                      </div>
                    </article>
                  </div>
                </section>

                <section>
                  <h2>
                    <span />
                    注意事項（用具・設備）
                  </h2>
                  <ul className="tdetail-icons">
                    <li>
                      <span className="material-symbols-outlined">block</span>
                      <p>サッカースパイクの使用は厳禁です。トレーニングシューズをご用意ください。</p>
                    </li>
                    <li>
                      <span className="material-symbols-outlined">check_circle</span>
                      <p>レガース（すねあて）の着用は必須です。</p>
                    </li>
                    <li>
                      <span className="material-symbols-outlined">check_circle</span>
                      <p>アクセサリー類、腕時計は安全のため外してプレイしてください。</p>
                    </li>
                  </ul>
                </section>
              </div>
            )}
          </div>
        </section>
      </main>

      <div className="tdetail-entry-wrap">
        <Link to={user ? `/tournaments/${tournament.id}/entry` : "/login"} className="tdetail-entry-btn">
          <span>大会にエントリーする</span>
          <span className="material-symbols-outlined">arrow_forward</span>
        </Link>
      </div>
    </div>
  );
}
