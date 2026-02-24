import { cardMeta, initials } from "./teamCardUtils";

export default function TeamListCard({ team }) {
  const meta = cardMeta(team);
  const disabled = team.status === "suspended";

  return (
    <article className={`adteam-card ${disabled ? "is-disabled" : ""}`}>
      <div className="adteam-card-top">
        <span className={`adteam-chip ${meta.chipClass}`}>{meta.chip}</span>
        <span>{meta.sub}</span>
      </div>

      <div className="adteam-card-main">
        <div className={`adteam-avatar ${disabled ? "is-disabled" : ""}`}>{initials(team.name)}</div>
        <div className="adteam-card-copy">
          <h4>{team.name}</h4>
          <p>
            <span className="material-symbols-outlined">person</span>
            {team.captain_name || "未設定"} <small>代表者</small>
          </p>
        </div>
        <span className="material-symbols-outlined adteam-right">chevron_right</span>
      </div>

      {disabled ? (
        <div className="adteam-suspended-text">
          <span className="material-symbols-outlined">warning</span>
          規約違反による停止
        </div>
      ) : (
        <div className="adteam-card-foot">
          <div>
            <span className="material-symbols-outlined">group</span>
            <strong>
              {team.member_count || 0} <small>メンバー</small>
            </strong>
          </div>
          <div>
            <span className="material-symbols-outlined">location_on</span>
            <strong>{team.captain_address || "住所未設定"}</strong>
          </div>
        </div>
      )}
    </article>
  );
}
