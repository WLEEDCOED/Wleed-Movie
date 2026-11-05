'use client';

import { useEffect, useState } from 'react';

interface EpisodeOverviewProps {
  tmdbId: number;
  season: number;
  episode: number;
  overview: string;
  sourceOverview?: string;
  className?: string;
}

export default function EpisodeOverview({ tmdbId, season, episode, overview, sourceOverview, className }: EpisodeOverviewProps) {
  const [translated, setTranslated] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(sourceOverview));

  useEffect(() => {
    if (!sourceOverview) return;
    const controller = new AbortController();
    fetch('/api/episode-overview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tmdbId, season, episode }),
      signal: controller.signal,
    }).then(async response => {
      if (!response.ok) return null;
      const result = await response.json() as { overview?: string | null };
      return result.overview || null;
    }).then(value => {
      if (controller.signal.aborted) return;
      setTranslated(value);
      setLoading(false);
    }).catch(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [tmdbId, season, episode, sourceOverview]);

  return <p className={className} dir="rtl">{translated || (loading ? 'جاري ترجمة وصف الحلقة…'
    : sourceOverview ? 'تعذّر ترجمة الوصف الآن. حاول فتح الصفحة لاحقًا.' : overview)}</p>;
}
