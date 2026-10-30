const DAY_MS = 24 * 60 * 60 * 1000;

/** Keep verified release dates separate from TMDB's editable episode metadata. */
export function resolveEpisodeAirDate(
  seriesId: number,
  season: number,
  episode: number,
  tmdbDate: string | null,
): string | null {
  // Paramount+ lists Dexter: Resurrection S2E1 on October 30, 2026 and
  // announces weekly Friday episodes. TMDB currently lists this season on
  // Sundays, exactly two days later. Only replace those known stale dates;
  // if TMDB changes its schedule, its new dates take precedence.
  // https://www.paramountplus.com/shows/dexter-resurrection/episodes/2/
  // https://www.paramountplus.com/sneak-peak/dexter-resurrection-season-2-trailer-breakdown/
  if (seriesId === 259909 && season === 2 && episode >= 1 && episode <= 10 && tmdbDate) {
    const friday = Date.UTC(2026, 9, 30) + (episode - 1) * 7 * DAY_MS;
    const staleSunday = new Date(friday + 2 * DAY_MS).toISOString().slice(0, 10);
    if (tmdbDate === staleSunday) return new Date(friday).toISOString().slice(0, 10);
  }

  return tmdbDate;
}
