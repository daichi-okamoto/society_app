const TEAM_PROFILE_STORAGE_PREFIX = "team-profile:";

function keyOf(teamId) {
  return `${TEAM_PROFILE_STORAGE_PREFIX}${teamId}`;
}

export function readTeamProfileDraft(teamId) {
  if (!teamId || typeof window === "undefined") return null;

  try {
    const raw = window.localStorage.getItem(keyOf(teamId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

export function writeTeamProfileDraft(teamId, draft) {
  if (!teamId || typeof window === "undefined") return;

  try {
    window.localStorage.setItem(keyOf(teamId), JSON.stringify(draft || {}));
  } catch {
    // ignore storage errors
  }
}

export function normalizeTeamHandle(value, fallbackName = "") {
  const v = (value || "").trim();
  if (v) {
    return v.startsWith("@") ? v : `@${v}`;
  }

  const fromName = fallbackName
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_\-ぁ-んァ-ヶ一-龠ー]/g, "");

  return fromName ? `@${fromName}` : "@tokyo_seven_fc";
}
