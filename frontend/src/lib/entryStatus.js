export const ACTIVE_ENTRY_STATUSES = new Set(["approved", "pending"]);

export function isActiveEntryStatus(status) {
  return ACTIVE_ENTRY_STATUSES.has(status);
}

export function participationBadge(status) {
  if (isActiveEntryStatus(status)) {
    return { label: "参加大会", className: "joined" };
  }
  return { label: "未参加", className: "not-joined" };
}
