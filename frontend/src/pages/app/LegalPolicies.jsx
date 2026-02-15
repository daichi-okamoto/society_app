import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const TERMS_SECTIONS = [
  {
    title: "第1条（目的）",
    body: (
      <p>
        この利用規約（以下「本規約」といいます。）は、高森スポーツネットワーク（以下「当社」といいます。）が提供するソサイチ大会運営サービス「高森ソサイチ」（以下「本サービス」といいます。）の利用条件を定めるものです。ユーザーの皆さまは、本規約に同意した上で本サービスを利用するものとします。
      </p>
    )
  },
  {
    title: "第2条（定義）",
    body: (
      <>
        <p>本規約において使用する用語は、次の各号の意味を有します。</p>
        <ul>
          <li>「ユーザー」: 本サービスに登録し利用する個人または法人その他の団体。</li>
          <li>「主催者」: 本サービス上で大会を企画・運営するユーザー。</li>
          <li>「参加者」: 主催者が開催する大会に参加するユーザー。</li>
          <li>「チーム」: 参加者により構成される競技参加単位。</li>
        </ul>
      </>
    )
  },
  {
    title: "第3条（利用登録）",
    body: (
      <>
        <p>
          1. 本サービスの利用を希望する者は、当社所定の方法により利用登録を申請するものとします。
          <br />2.
          当社は、申請者が以下のいずれかに該当すると判断した場合、登録を承認しないことがあります。
        </p>
        <div className="legal-highlight">
          （1）登録情報に虚偽、誤記または記入漏れがある場合
          <br />
          （2）過去に本規約違反等により利用停止等の措置を受けた場合
          <br />
          （3）反社会的勢力との関与が認められる場合
          <br />
          （4）その他、当社が登録を不適当と判断した場合
        </div>
      </>
    )
  },
  {
    title: "第4条（禁止事項）",
    body: (
      <>
        <p>ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。</p>
        <ul className="bullet-dot">
          <li>法令または公序良俗に違反する行為</li>
          <li>犯罪行為またはそのおそれのある行為</li>
          <li>他のユーザー、主催者または第三者の権利を侵害する行為</li>
          <li>虚偽情報の登録、なりすまし、運営妨害行為</li>
          <li>本サービスのサーバーまたはネットワークに過度な負荷をかける行為</li>
        </ul>
      </>
    )
  },
  {
    title: "第5条（大会運営と安全管理）",
    body: (
      <p>
        主催者は、スポーツマンシップに則り、公平かつ安全な大会運営を行う責任を負います。安全配慮義務違反、差別的・暴力的言動、ハラスメント等が確認された場合、当社は大会掲載停止、利用制限またはアカウント停止措置を行うことがあります。
      </p>
    )
  },
  {
    title: "第6条（免責）",
    body: (
      <p>
        当社は、本サービスの提供にあたり合理的な注意を払いますが、通信障害、自然災害、施設都合その他当社の責めに帰さない事由により生じた損害については、当社の故意または重過失がある場合を除き責任を負いません。
      </p>
    )
  }
];

const PRIVACY_SECTIONS = [
  {
    title: "1. 基本方針",
    body: "高森スポーツネットワーク（以下「当社」）は、高森ソサイチの提供において、ユーザーの個人情報の重要性を認識し、個人情報保護法その他関連法令を遵守して適切に取り扱います。"
  },
  {
    title: "2. 取得する情報",
    body: (
      <ul>
        <li>アカウント情報（氏名、メールアドレス、電話番号等）</li>
        <li>チーム情報および大会参加情報（所属チーム、対戦結果、エントリー履歴等）</li>
        <li>決済関連情報（決済手段の識別情報、取引履歴等）</li>
        <li>アクセスログ、端末情報、Cookie等の技術情報</li>
      </ul>
    )
  },
  {
    title: "3. 利用目的",
    body: (
      <ul>
        <li>本サービスの提供、本人確認、認証、サポート対応</li>
        <li>大会運営、チーム管理、結果表示、通知配信</li>
        <li>利用状況の分析、サービス改善、新機能開発</li>
        <li>不正利用防止およびセキュリティ確保</li>
        <li>法令に基づく対応</li>
      </ul>
    )
  },
  {
    title: "4. 第三者提供",
    body: "当社は、法令に基づく場合を除き、本人の同意なく個人情報を第三者に提供しません。ただし、決済代行会社、インフラ提供事業者等への業務委託に伴い、必要な範囲で情報を提供する場合があります。"
  },
  {
    title: "5. 安全管理措置",
    body: "当社は、アクセス制御、通信の暗号化、ログ監査、権限管理等の安全管理措置を実施し、個人情報の漏えい、滅失またはき損の防止に努めます。"
  },
  {
    title: "6. 開示・訂正・削除等",
    body: "ユーザーは、当社所定の手続により、自己の個人情報の開示、訂正、利用停止、削除を請求できます。合理的な期間および範囲で対応します。"
  },
  {
    title: "7. お問い合わせ窓口",
    body: "個人情報の取扱いに関するお問い合わせは、アプリ内「ヘルプ・お問い合わせ」または当社サポート窓口までご連絡ください。"
  }
];

export default function LegalPolicies() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("terms");

  const title = useMemo(() => (tab === "terms" ? "高森ソサイチ サービス利用規約" : "高森ソサイチ プライバシーポリシー"), [tab]);

  return (
    <div className="legal-root">
      <header className="legal-header">
        <div className="legal-header-row">
          <button type="button" onClick={() => navigate(-1)} aria-label="戻る">
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h1>規約とポリシー</h1>
        </div>

        <div className="legal-tabs">
          <button
            type="button"
            className={tab === "terms" ? "active" : ""}
            onClick={() => setTab("terms")}
          >
            利用規約
          </button>
          <button
            type="button"
            className={tab === "privacy" ? "active" : ""}
            onClick={() => setTab("privacy")}
          >
            プライバシーポリシー
          </button>
        </div>
      </header>

      <main className="legal-main">
        <article className="legal-article">
          <h2>{title}</h2>
          <p className="legal-updated">最終改訂日：2026年2月14日</p>

          <div className="legal-sections">
            {tab === "terms"
              ? TERMS_SECTIONS.map((section) => (
                  <section key={section.title} className="legal-section">
                    <h3>{section.title}</h3>
                    <div className="legal-body">{section.body}</div>
                  </section>
                ))
              : PRIVACY_SECTIONS.map((section) => (
                  <section key={section.title} className="legal-section">
                    <h3>{section.title}</h3>
                    <div className="legal-body">{section.body}</div>
                  </section>
                ))}
          </div>

          <div className="legal-spacer" />
        </article>
      </main>

      <div className="legal-blob left" />
      <div className="legal-blob right" />
      <div className="legal-fade" />
    </div>
  );
}
