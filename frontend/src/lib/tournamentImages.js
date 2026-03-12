export const DEFAULT_TOURNAMENT_COVER =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCX9N6okYrlSA1JKbjKPe2_OujI5m-zAzfcWY6dOzQXUlqN9fIRSxO_fow1KBmxaYSudTZ_ag5J0YGHfE5NyDAiKo88kZu02LEKIs7vX7-YpAIhujKiuIZaTgsNOir5-rx2E2WiM2ozCYYAcfeiFYyxfOngcE6_Tx7HCaieXyeyOVbYf1Pfz8ry5aegO7v_iIommHbn2LUuXWkF4IgkzymE5RF7WbOhknTU51mDkLaYr64wO2o7IWVRuAoo9mNi55XVan_RHplgzHaw";

export function getTournamentCoverUrl(tournament) {
  const imageUrl = tournament?.image_url;
  return typeof imageUrl === "string" && imageUrl.trim() ? imageUrl : DEFAULT_TOURNAMENT_COVER;
}
