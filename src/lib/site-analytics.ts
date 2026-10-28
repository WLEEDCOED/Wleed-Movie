import { Redis } from '@upstash/redis';

const ACTIVE_WINDOW_MS = 90_000;
const DATA_TTL_SECONDS = 45 * 24 * 60 * 60;
const ACTIVE_KEY = 'wm:analytics:active';
const WATCHING_KEY = 'wm:analytics:watching';

export interface PresenceUpdate {
  visitorId: string;
  tabId: string;
  path: string;
  watching: boolean;
  active: boolean;
  pageView: boolean;
}

export interface AnalyticsSnapshot {
  activeVisitors: number;
  watchingVisitors: number;
  pageViewsToday: number;
  uniqueVisitorsToday: number;
  weekly: { day: string; pageViews: number; visitors: number }[];
  topPages: { path: string; views: number }[];
  updatedAt: string;
}

export function analyticsConfigured(): boolean {
  return Boolean(
    (process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL) &&
    (process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN)
  );
}

export function getRedis(): Redis {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error('Analytics storage is not configured');
  return new Redis({ url, token });
}

function riyadhDay(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Riyadh', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = (type: string) => parts.find(part => part.type === type)?.value || '';
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function sessionMember(visitorId: string, tabId: string): string {
  return `${visitorId}:${tabId}`;
}

function uniqueVisitorCount(sessions: string[]): number {
  return new Set(sessions.map(session => session.split(':', 1)[0])).size;
}

export async function recordPresence(update: PresenceUpdate): Promise<void> {
  const redis = getRedis();
  const member = sessionMember(update.visitorId, update.tabId);
  if (!update.active) {
    await Promise.all([redis.zrem(ACTIVE_KEY, member), redis.zrem(WATCHING_KEY, member)]);
    return;
  }

  const now = Date.now();
  const writes: Promise<unknown>[] = [
    redis.zadd(ACTIVE_KEY, { score: now, member }),
    update.watching
      ? redis.zadd(WATCHING_KEY, { score: now, member })
      : redis.zrem(WATCHING_KEY, member),
  ];

  // Prune expired sessions without adding cleanup commands to every heartbeat.
  if (Math.random() < 0.05) {
    writes.push(
      redis.zremrangebyscore(ACTIVE_KEY, '-inf', now - ACTIVE_WINDOW_MS),
      redis.zremrangebyscore(WATCHING_KEY, '-inf', now - ACTIVE_WINDOW_MS),
    );
  }

  if (update.pageView) {
    const day = riyadhDay(new Date(now));
    const viewsKey = `wm:analytics:views:${day}`;
    const visitorsKey = `wm:analytics:visitors:${day}`;
    const pagesKey = `wm:analytics:pages:${day}`;
    writes.push((async () => {
      await Promise.all([
        redis.incr(viewsKey),
        redis.sadd(visitorsKey, update.visitorId),
        redis.hincrby(pagesKey, update.path, 1),
      ]);
      await Promise.all([
        redis.expire(viewsKey, DATA_TTL_SECONDS),
        redis.expire(visitorsKey, DATA_TTL_SECONDS),
        redis.expire(pagesKey, DATA_TTL_SECONDS),
      ]);
    })());
  }

  await Promise.all(writes);
}

export async function getAnalyticsSnapshot(): Promise<AnalyticsSnapshot> {
  const redis = getRedis();
  const now = Date.now();
  const cutoff = now - ACTIVE_WINDOW_MS;
  const days = Array.from({ length: 7 }, (_, index) =>
    riyadhDay(new Date(now - (6 - index) * 86_400_000))
  );
  const today = days[6];

  const [activeSessions, watchingSessions, weeklyValues, pages] = await Promise.all([
    redis.zrange<string[]>(ACTIVE_KEY, cutoff, '+inf', { byScore: true }),
    redis.zrange<string[]>(WATCHING_KEY, cutoff, '+inf', { byScore: true }),
    Promise.all(days.map(async day => {
      const [pageViews, visitors] = await Promise.all([
        redis.get<number>(`wm:analytics:views:${day}`),
        redis.scard(`wm:analytics:visitors:${day}`),
      ]);
      return { day, pageViews: Number(pageViews || 0), visitors: Number(visitors || 0) };
    })),
    redis.hgetall<Record<string, number>>(`wm:analytics:pages:${today}`),
  ]);

  const activeIds = new Set(activeSessions);
  const watchingNow = watchingSessions.filter(session => activeIds.has(session));
  const todayValues = weeklyValues[6];

  return {
    activeVisitors: uniqueVisitorCount(activeSessions),
    watchingVisitors: uniqueVisitorCount(watchingNow),
    pageViewsToday: todayValues.pageViews,
    uniqueVisitorsToday: todayValues.visitors,
    weekly: weeklyValues,
    topPages: Object.entries(pages || {})
      .map(([path, views]) => ({ path, views: Number(views) || 0 }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 8),
    updatedAt: new Date(now).toISOString(),
  };
}
