export default function TournamentOverviewTabContent({ description, venue }) {
  const mapPlaceName = String(venue || "").trim() || "山吹ほたるパーク";
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapPlaceName)}&output=embed`;

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
          <iframe
            title="山吹ほたるパーク 地図"
            src={mapSrc}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </section>

      <section>
        <h2>
          <span />
          注意事項
        </h2>
        <ul>
          <li>
            <span className="material-symbols-outlined">check_circle</span>
            <span>雨天決行（荒天時は中止のご連絡をいたします）</span>
          </li>
          <li>
            <span className="material-symbols-outlined">check_circle</span>
            <span>スパイクの使用は禁止です（トレシュ推奨）</span>
          </li>
          <li>
            <span className="material-symbols-outlined">check_circle</span>
            <span>開始20分前までに受付をお済ませください</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
