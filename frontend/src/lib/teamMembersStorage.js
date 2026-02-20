const MANUAL_STORAGE_PREFIX = "team-manual-members:";
const OVERRIDE_STORAGE_PREFIX = "team-member-overrides:";

function manualKey(teamId) {
  return `${MANUAL_STORAGE_PREFIX}${teamId}`;
}

function overrideKey(teamId) {
  return `${OVERRIDE_STORAGE_PREFIX}${teamId}`;
}

function toSafeNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num > 0 ? num : 0;
}

export function loadManualMemberRecords(teamId) {
  if (!teamId || typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(manualKey(teamId));
    if (!raw) return [];
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export function saveManualMemberRecords(teamId, records) {
  if (!teamId || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(manualKey(teamId), JSON.stringify(Array.isArray(records) ? records : []));
  } catch {
    // ignore write errors
  }
}

export function loadManualMembersForList(teamId) {
  return loadManualMemberRecords(teamId).map((m, index) => ({
    id: m.id || `manual-${index}`,
    name: m.name || "未設定",
    furigana: m.furigana || "",
    pos: m.position || "MF",
    number: toSafeNumber(m.number),
    roleLabel: undefined,
    roleBadge: undefined,
    featured: false,
    initial: (m.name || "追").trim().slice(0, 1),
    tone: "amber",
    source: "manual",
    avatar_data_url: m.avatar_data_url || "",
    avatar: m.avatar_data_url || ""
  }));
}

export function updateManualMemberRecord(teamId, memberId, updater) {
  const current = loadManualMemberRecords(teamId);
  const next = current.map((item) => {
    if (String(item.id) !== String(memberId)) return item;
    return updater(item);
  });
  saveManualMemberRecords(teamId, next);
}

export function removeManualMemberRecord(teamId, memberId) {
  const current = loadManualMemberRecords(teamId);
  const next = current.filter((item) => String(item.id) !== String(memberId));
  saveManualMemberRecords(teamId, next);
}

export function loadMemberOverrides(teamId) {
  if (!teamId || typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(overrideKey(teamId));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function saveMemberOverrides(teamId, overrides) {
  if (!teamId || typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(overrideKey(teamId), JSON.stringify(overrides || {}));
  } catch {
    // ignore write errors
  }
}

export function setMemberOverride(teamId, memberId, patch) {
  const current = loadMemberOverrides(teamId);
  const key = String(memberId);
  current[key] = {
    ...(current[key] || {}),
    ...(patch || {}),
    updated_at: new Date().toISOString()
  };
  saveMemberOverrides(teamId, current);
}

export function applyOverridesToMember(member, overrides) {
  const data = overrides?.[String(member.id)];
  if (!data) return member;

  return {
    ...member,
    pos: data.pos || member.pos,
    number: toSafeNumber(data.number) || member.number
  };
}
