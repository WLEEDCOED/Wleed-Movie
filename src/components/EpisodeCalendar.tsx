'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { RECENT_EPISODE_DAYS, recentEpisodeStart, type CalendarEpisode } from '@/lib/episode-calendar';
import { riyadhToday } from '@/lib/episode-dates';

interface ScheduleResponse {
  episodes: CalendarEpisode[];
  incomplete: boolean;
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC',
});

function EpisodeRows({ episodes, upcoming }: { episodes: CalendarEpisode[]; upcoming: boolean }) {
  return <ul className="calendar-episode-list">
    {episodes.map(episode => <li key={`${episode.seriesId}:${episode.season}:${episode.episode}`}>
      <Link href={upcoming ? `/series/${episode.seriesId}?season=${episode.season}#episodes` : `/watch/tv/${episode.seriesId}/${episode.season}/${episode.episode}`} prefetch={false}>
        <div className="calendar-episode-copy">
          <strong>{episode.seriesName}</strong>
          <span>S{episode.season} · E{episode.episode} · {episode.name}</span>
        </div>
        <time dateTime={episode.airDate}>{dateFormatter.format(new Date(`${episode.airDate}T00:00:00Z`))}</time>
      </Link>
    </li>)}
  </ul>;
}

function ScheduleGroup({ heading, episodes, upcoming }: { heading: string; episodes: CalendarEpisode[]; upcoming: boolean }) {
  const visibleCount = 5;
  return <div className="calendar-group">
    <h3>{heading}</h3>
    {episodes.length ? <EpisodeRows episodes={episodes.slice(0, visibleCount)} upcoming={upcoming} />
      : <p className="calendar-message">{upcoming ? 'No upcoming dates announced.' : 'No episodes aired in this period.'}</p>}
    {episodes.length > visibleCount && <details className="calendar-more">
      <summary>Show {episodes.length - visibleCount} more</summary>
      <EpisodeRows episodes={episodes.slice(visibleCount)} upcoming={upcoming} />
    </details>}
  </div>;
}

export default function EpisodeCalendar({ seriesIds }: { seriesIds: number[] }) {
  const seriesKey = seriesIds.join(',');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<(ScheduleResponse & { seriesKey: string; attempt: number }) | null>(null);
  const schedule = result?.seriesKey === seriesKey && result.attempt === attempt ? result : null;

  useEffect(() => {
    if (!seriesKey) return;
    const controller = new AbortController();
    const ids = seriesKey.split(',');

    async function loadSchedule() {
      const episodes: CalendarEpisode[] = [];
      let incomplete = false;
      for (let index = 0; index < ids.length && !controller.signal.aborted; index += 5) {
        const batch = await Promise.allSettled(ids.slice(index, index + 5).map(async id => {
          const response = await fetch(`/api/episode-calendar/${id}`, { signal: controller.signal });
          if (!response.ok) throw new Error('Schedule unavailable');
          return response.json() as Promise<ScheduleResponse>;
        }));
        for (const item of batch) {
          if (item.status === 'rejected') {
            incomplete = true;
          } else {
            episodes.push(...item.value.episodes);
            incomplete ||= item.value.incomplete;
          }
        }
      }
      if (!controller.signal.aborted) setResult({ seriesKey, attempt, episodes, incomplete });
    }

    void loadSchedule();
    return () => controller.abort();
  }, [seriesKey, attempt]);

  const today = riyadhToday();
  const since = recentEpisodeStart(today);
  const byDate = (a: CalendarEpisode, b: CalendarEpisode) => a.airDate.localeCompare(b.airDate);
  const recent = schedule?.episodes.filter(episode => episode.airDate >= since && episode.airDate <= today).sort((a, b) => byDate(b, a)) ?? [];
  const upcoming = schedule?.episodes.filter(episode => episode.airDate > today).sort(byDate) ?? [];

  return <section className="episode-calendar" aria-labelledby="episode-calendar-heading">
    <header className="calendar-heading">
      <h2 id="episode-calendar-heading">Episode Calendar</h2>
      <p>Last {RECENT_EPISODE_DAYS} days and upcoming dates for shows in My List.</p>
    </header>
    {!seriesKey ? <p className="calendar-message">Save a show to see its episode schedule here.</p>
      : !schedule ? <p className="calendar-message" role="status">Loading episode dates…</p>
        : <>
          {schedule.incomplete && <div className="calendar-notice" role="status">
            <span>Some episode dates couldn’t be loaded.</span>
            <button type="button" onClick={() => setAttempt(value => value + 1)}>Try again</button>
          </div>}
          {(!schedule.incomplete || schedule.episodes.length > 0) && <div className="calendar-groups">
            <ScheduleGroup heading="Recently Aired" episodes={recent} upcoming={false} />
            <ScheduleGroup heading="Upcoming" episodes={upcoming} upcoming />
          </div>}
        </>}
  </section>;
}
