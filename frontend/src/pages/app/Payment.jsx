import { Link } from "react-router-dom";

const CARD_INFO = {
  brand: "VISA",
  masked: ["••••", "••••", "••••", "4242"],
  expiredAt: "12/26",
};

const PAYMENT_HISTORY = [
  { id: 1, title: "渋谷区 7人制 秋季大会", meta: "2023.11.24 • エントリー費", amount: "¥4,500", status: "決済完了", icon: "sports_soccer" },
  { id: 2, title: "スポーツ保険更新", meta: "2023.10.12 • 年会費", amount: "¥2,800", status: "決済完了", icon: "shield" },
  { id: 3, title: "個人フットサル参加", meta: "2023.09.30 • 施設利用料", amount: "¥1,500", status: "決済完了", icon: "stadium" },
];

export default function Payment({
  paymentMethod = CARD_INFO,
  paymentHistory = PAYMENT_HISTORY,
}) {
  // 将来的には API から取得して `paymentMethod` を切り替える
  const hasPaymentMethod = Boolean(paymentMethod);

  return (
    <div className="pay-root">
      <header className="pay-header">
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="お支払い情報を戻る"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1>お支払い情報</h1>
        <span className="pay-header-spacer" />
      </header>

      <main className="pay-main">
        {hasPaymentMethod ? (
          <section className="pay-has-card">
            <div className="pay-section-title">
              <p>登録済みのお支払い方法</p>
            </div>

            <div className="pay-card">
              <div className="pay-card-glow" />
              <div className="pay-card-top">
                <span className="pay-card-chip-wrap">
                  <span className="pay-card-chip" />
                </span>
                <strong>{paymentMethod.brand}</strong>
              </div>

              <div className="pay-card-number">
                <p>カード番号</p>
                <div>
                  {paymentMethod.masked.map((chunk, index) => (
                    <span key={index}>{chunk}</span>
                  ))}
                </div>
              </div>

              <div className="pay-card-bottom">
                <div>
                  <p>有効期限</p>
                  <p>{paymentMethod.expiredAt}</p>
                </div>
                <button type="button">編集</button>
              </div>
            </div>

            <div className="pay-section-title with-action">
              <h2>最近の支払い履歴</h2>
              <button type="button">すべて見る</button>
            </div>

            <div className="pay-history-list">
              {paymentHistory.map((item) => (
                <article className="pay-history-item" key={item.id}>
                  <div className="pay-history-left">
                    <div className="pay-history-icon">
                      <span className="material-symbols-outlined">{item.icon}</span>
                    </div>
                    <div>
                      <h3>{item.title}</h3>
                      <p>{item.meta}</p>
                    </div>
                  </div>
                  <div className="pay-history-right">
                    <strong>{item.amount}</strong>
                    <span>{item.status}</span>
                  </div>
                </article>
              ))}
            </div>

            <button type="button" className="pay-add-btn">
              <span className="material-symbols-outlined">add_card</span>
              <span>新しいカードを追加</span>
            </button>
          </section>
        ) : (
          <section className="pay-empty">
            <div className="pay-empty-icon">
              <span className="material-symbols-outlined">credit_card</span>
              <span className="pay-empty-plus material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                add_circle
              </span>
            </div>

            <h2>お支払い方法が登録されていません</h2>
            <p>
              大会への参加申し込みをスムーズに行うために、
              <br />
              クレジットカード等の登録をお勧めします。
            </p>

            <button type="button" className="pay-primary-btn">
              <span className="material-symbols-outlined">add</span>
              <span>お支払い方法を追加する</span>
            </button>

            <p className="pay-empty-note">
              <span className="material-symbols-outlined">shield</span>
              <span>カード情報は暗号化され、安全に保管されます</span>
            </p>
          </section>
        )}
      </main>

      <nav className="pay-nav">
        <div className="pay-nav-row">
          <Link to="/app/home" className="pay-nav-item">
            <span className="material-symbols-outlined">home</span>
            <span>ホーム</span>
          </Link>
          <Link to="/tournaments" className="pay-nav-item">
            <span className="material-symbols-outlined">search</span>
            <span>さがす</span>
          </Link>
          <div className="pay-nav-center">
            <button type="button" aria-label="ホーム">
              <span className="material-symbols-outlined">sports_soccer</span>
            </button>
          </div>
          <Link to="/teams" className="pay-nav-item">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/me" className="pay-nav-item active">
            <span className="material-symbols-outlined">person</span>
            <span>マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
