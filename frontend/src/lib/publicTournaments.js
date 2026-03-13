export function splitPublicTournaments(tournaments) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = [];
  const ongoing = [];
  const past = [];

  tournaments.forEach((tournament) => {
    const eventDate = new Date(`${tournament.event_date}T00:00:00`);
    if (Number.isNaN(eventDate.getTime())) return;

    if (eventDate.getTime() === today.getTime()) {
      ongoing.push(tournament);
      return;
    }

    if (eventDate > today) {
      upcoming.push(tournament);
      return;
    }

    past.push(tournament);
  });

  upcoming.sort((a, b) => a.event_date.localeCompare(b.event_date));
  past.sort((a, b) => b.event_date.localeCompare(a.event_date));

  return { upcoming, ongoing, past };
}

export function formatPublicDate(dateText) {
  if (!dateText) return "-";
  return new Date(`${dateText}T00:00:00`).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    weekday: "short"
  });
}
