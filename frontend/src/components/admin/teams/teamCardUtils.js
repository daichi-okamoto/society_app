export function cardMeta(team) {
  if (team.status === "pending") {
    return {
      chip: "承認待ち",
      chipClass: "is-pending",
      sub: formatDateDots(team.created_at),
    };
  }
  if (team.status === "suspended") {
    return {
      chip: "利用停止中",
      chipClass: "is-suspended",
      sub: `ID: TM-${String(team.id).padStart(5, "0")}`,
    };
  }
  return {
    chip: "承認済み",
    chipClass: "is-approved",
    sub: `ID: TM-${String(team.id).padStart(5, "0")}`,
  };
}

export function initials(name) {
  const s = String(name || "").trim();
  if (!s) return "TM";
  return s.slice(0, 2).toUpperCase();
}

function formatDateDots(value) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}
