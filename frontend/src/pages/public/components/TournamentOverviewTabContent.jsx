import { parseTournamentDescriptionGroups } from "../../../lib/tournamentGroups";

export default function TournamentOverviewTabContent({ description, venue, cautionItems = [] }) {
  const mapPlaceName = String(venue || "").trim() || "山吹ほたるパーク";
  const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(mapPlaceName)}&output=embed`;
  const { mainDescription, groups } = parseTournamentDescriptionGroups(description);
  const summaryText =
    mainDescription ||
    "仕事終わりに最高の汗を流しませんか？新宿中央公園内の綺麗な人工芝コートで開催される、初心者から経験者まで楽しめる7人制サッカー大会です。審判はJ7公認レフェリーが務めますので、安心してプレイいただけます。";

  return (
    <div className="tdetail-sections">
      <section>
        <h2>
          <span />
          大会概要
        </h2>
        <p>{summaryText}</p>
      </section>

      {groups.length > 0 ? (
        <section>
          <h2>
            <span />
            グループ設定
          </h2>
          <div className="tdetail-group-grid">
            {groups.map((group) => (
              <article key={group.id} className="tdetail-group-card">
                <div className="tdetail-group-head">
                  <strong>{group.name}</strong>
                  <span>{group.label}</span>
                </div>
                <div className="tdetail-group-stars" aria-label={`${group.name} 強度 ${group.stars}`}>
                  {Array.from({ length: 5 }, (_, index) => (
                    <span key={`${group.id}-${index + 1}`} className={`material-symbols-outlined ${index < group.stars ? "filled" : ""}`}>
                      star
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section>
        <h2>
          <span />
          開催場所
        </h2>
        <div className="tdetail-map">
          <iframe
            title={`${mapPlaceName} 地図`}
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
        {cautionItems.length > 0 ? (
          <ul>
            {cautionItems.map((item) => (
              <li key={item}>
                <span className="material-symbols-outlined">check_circle</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p>注意事項はありません。</p>
        )}
      </section>
    </div>
  );
}
