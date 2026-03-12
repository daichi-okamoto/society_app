export function getGroupLevelLabel(stars) {
  if (stars <= 2) return "ビギナー（初心者中心）";
  if (stars === 3) return "エンジョイ（楽しむ重視）";
  if (stars === 4) return "スタンダード（経験者歓迎）";
  return "コンペティティブ（競技志向）";
}

export function parseTournamentDescriptionGroups(rawDescription) {
  const lines = String(rawDescription || "")
    .split("\n")
    .map((line) => line.trimEnd());

  const sectionIndex = lines.findIndex((line) => line.trim() === "グループ設定:");
  if (sectionIndex < 0) {
    return {
      mainDescription: String(rawDescription || "").trim(),
      groups: [],
    };
  }

  const mainDescription = lines
    .slice(0, sectionIndex)
    .join("\n")
    .trim();

  const groupLines = lines
    .slice(sectionIndex + 1)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-"));

  const groups = groupLines.map((line, index) => {
    const match = line.match(/^-+\s*(.+?)\s*:\s*(★{1,5})/);
    if (match) {
      const stars = Math.max(1, Math.min(5, match[2].length));
      return {
        id: `group-${index}`,
        name: match[1].trim(),
        stars,
        label: getGroupLevelLabel(stars),
      };
    }

    return {
      id: `group-${index}`,
      name: line.replace(/^-+\s*/, "").replace(/:.*$/, "").trim() || `グループ${String.fromCharCode(65 + index)}`,
      stars: 3,
      label: getGroupLevelLabel(3),
    };
  });

  return { mainDescription, groups };
}
