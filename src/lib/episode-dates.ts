const DAY_MS = 24 * 60 * 60 * 1000;

export function riyadhToday(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(now);
  const value = (type: string) => parts.find(part => part.type === type)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function dateTime(date: string | null): number | null {
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const time = Date.parse(`${date}T00:00:00Z`);
  return Number.isFinite(time) && new Date(time).toISOString().slice(0, 10) === date ? time : null;
}

export function episodeDateStatus(
  airDate: string | null,
  today: string,
  hasPlayed = false,
): 'released' | 'check' | 'upcoming' | 'unknown' {
  if (hasPlayed) return 'released';
  const airTime = dateTime(airDate);
  const todayTime = dateTime(today);
  if (airTime === null || todayTime === null) return 'unknown';
  const daysAway = (airTime - todayTime) / DAY_MS;
  if (daysAway <= 0) return 'released';
  // Release dates from TMDB can lag behind a broadcaster by a few days.
  // Keep a way to check playback without claiming the episode is released.
  return daysAway <= 3 ? 'check' : 'upcoming';
}

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
