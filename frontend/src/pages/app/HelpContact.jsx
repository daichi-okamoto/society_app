import { Link, useNavigate } from "react-router-dom";

const FAQ_ITEMS = [
  {
    q: "大会のエントリー費用はいくらですか？",
    a: "大会規模や会場により異なりますが、一般的に1チームあたり15,000円〜25,000円程度です。詳細は各大会のエントリーページをご確認ください。"
  },
  {
    q: "チーム登録の方法を教えてください。",
    a: "マイページの「マイチーム設定」より、チーム名、代表者情報、所属メンバーを登録することができます。登録には有効なメールアドレスが必要です。"
  },
  {
    q: "7人制サッカーの独自ルールはありますか？",
    a: "オフサイドなし、自由な交代、GKからのスローによる再開など、J7独自のルールが適用されます。競技規則ページにて全文を公開しております。"
  },
  {
    q: "雨天時の開催判断について",
    a: "原則として小雨決行ですが、荒天の場合は開始2時間前までに代表者様へメールおよびアプリ通知にてご連絡いたします。"
  }
];

export default function HelpContact() {
  const navigate = useNavigate();

  return (
    <div className="help-root">
      <header className="help-header">
        <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h1>ヘルプ・お問い合わせ</h1>
      </header>

      <main className="help-main">
        <section className="help-section">
          <div className="help-title-row">
            <span className="bar" />
            <h2>よくある質問</h2>
          </div>

          <div className="help-faq-list">
            {FAQ_ITEMS.map((item) => (
              <details key={item.q} className="help-faq-item group">
                <summary>
                  <span>{item.q}</span>
                  <span className="material-symbols-outlined">expand_more</span>
                </summary>
                <div className="help-faq-body">{item.a}</div>
              </details>
            ))}
          </div>
        </section>

        <section className="help-section contact">
          <div className="help-title-row">
            <span className="bar" />
            <h2>お問い合わせ</h2>
          </div>

          <div className="help-contact-card">
            <div className="help-contact-top">
              <div className="help-mail-icon">
                <span className="material-symbols-outlined">mail</span>
              </div>
              <h3>メールでのお問い合わせ</h3>
              <p>
                FAQで解決しない場合は、こちらの窓口よりお気軽にお問い合わせください。スタッフが内容を確認し、順次回答させていただきます。
              </p>
            </div>

            <a className="help-mail-btn" href="mailto:support@j7soccer.example?subject=J7%20Soccer%E3%81%B8%E3%81%AE%E3%81%8A%E5%95%8F%E3%81%84%E5%90%88%E3%82%8F%E3%81%9B">
              <span className="material-symbols-outlined">send</span>
              <span>お問い合わせメールを作成</span>
            </a>

            <div className="help-contact-foot">
              <p>
                受付時間：平日 10:00 〜 18:00
                <br />
                <span>(土日祝・年末年始を除く)</span>
                <br />
                <span>※通常2〜3営業日以内に返信いたします。</span>
              </p>
            </div>
          </div>

          <Link to="/policies" className="help-policy-link help-policy-link-bottom">
            <span className="material-symbols-outlined">gavel</span>
            <span>利用規約・プライバシーポリシー</span>
            <span className="material-symbols-outlined">chevron_right</span>
          </Link>
        </section>
      </main>

      <nav className="help-nav">
        <div className="help-nav-row">
          <Link to="/app/home" className="help-nav-item">
            <span className="material-symbols-outlined">home</span>
            <span>ホーム</span>
          </Link>
          <Link to="/tournaments" className="help-nav-item">
            <span className="material-symbols-outlined">search</span>
            <span>さがす</span>
          </Link>
          <div className="help-nav-center">
            <button type="button">
              <span className="material-symbols-outlined">sports_soccer</span>
            </button>
          </div>
          <Link to="/teams" className="help-nav-item">
            <span className="material-symbols-outlined">groups</span>
            <span>チーム</span>
          </Link>
          <Link to="/me" className="help-nav-item active">
            <span className="material-symbols-outlined">person</span>
            <span>マイページ</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}
