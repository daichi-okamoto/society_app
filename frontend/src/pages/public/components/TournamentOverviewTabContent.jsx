export default function TournamentOverviewTabContent({ description, venue }) {
  return (
    <div className="tdetail-sections">
      <section>
        <h2>
          <span />
          大会概要
        </h2>
        <p>
          {description ||
            "仕事終わりに最高の汗を流しませんか？新宿中央公園内の綺麗な人工芝コートで開催される、初心者から経験者まで楽しめる7人制サッカー大会です。審判はJ7公認レフェリーが務めますので、安心してプレイいただけます。"}
        </p>
      </section>

      <section>
        <h2>
          <span />
          開催場所
        </h2>
        <div className="tdetail-map">
          <span className="material-symbols-outlined">map</span>
          <div>{venue || "新宿中央公園多目的運動広場"}</div>
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
  );
}
