import { getSeriesDetail, getSeasonEpisodes, getImageUrl, TMDBEpisode } from '@/lib/tmdb';
import { generateTVServers } from '@/lib/servers';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import ServerSwitcher from '@/components/ServerSwitcher';
import type { Metadata } from 'next';

interface PageProps {
  params: Promise<{ tmdbId: string; season: string; episode: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { tmdbId, season, episode } = await params;
  try {
    const series = await getSeriesDetail(parseInt(tmdbId));
    return {
      title: `${series.name} S${season}E${episode} | WleedMovie`,
      description: series.overview,
    };
  } catch {
    return { title: 'Not found' };
  }
}

export default async function WatchTVPage({ params }: PageProps) {
  const { tmdbId: tmdbIdStr, season: seasonStr, episode: episodeStr } = await params;
  const tmdbId = parseInt(tmdbIdStr);
  const seasonNum = parseInt(seasonStr);
  const episodeNum = parseInt(episodeStr);
  if (isNaN(tmdbId) || isNaN(seasonNum) || isNaN(episodeNum)) notFound();

  let series;
  try {
    series = await getSeriesDetail(tmdbId);
  } catch {
    notFound();
  }

  let episodes: TMDBEpisode[] = [];
  try {
    episodes = await getSeasonEpisodes(tmdbId, seasonNum);
  } catch {
    episodes = [];
  }

  const currentEp = episodes.find((e) => e.episode_number === episodeNum);
  const servers = generateTVServers(tmdbId, seasonNum, episodeNum);

  const prevEp = episodes.find((e) => e.episode_number === episodeNum - 1);
  const nextEp = episodes.find((e) => e.episode_number === episodeNum + 1);

  return (
    <div className="watch-page max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="watch-breadcrumb flex items-center gap-2 text-sm text-neutral-400 mb-4 animate-fade-in">
        <Link href="/" className="hover:text-white transition-colors">Home</Link>
        <span>/</span>
        <Link href={`/series/${tmdbId}`} className="hover:text-white transition-colors">{series.name}</Link>
        <span>/</span>
        <span className="text-white">S{seasonNum} · E{episodeNum}</span>
      </div>

      <div className="mb-6 animate-fade-in">
        <h1 className="text-2xl md:text-3xl font-black mb-2">
          {currentEp?.name || `Episode ${episodeNum}`}
        </h1>
        <p className="text-neutral-400">
          {series.name} — Season {seasonNum}, Episode {episodeNum}
        </p>
      </div>

      <div className="animate-slide-up">
        <ServerSwitcher servers={servers} tmdbId={tmdbId} mediaType="tv" season={seasonNum} episode={episodeNum} watchInfo={{ mediaType: 'tv', mediaId: tmdbId, title: series.name, imageUrl: getImageUrl(currentEp?.still_path || series.backdrop_path, 'w780'), href: `/watch/tv/${tmdbId}/${seasonNum}/${episodeNum}`, runtimeSeconds: currentEp?.runtime ? currentEp.runtime * 60 : undefined, season: seasonNum, episode: episodeNum }} />
      </div>

      <div className="flex items-center justify-between mt-8 animate-fade-in">
        {prevEp ? (
          <Link href={`/watch/tv/${tmdbId}/${seasonNum}/${prevEp.episode_number}`} className="flex items-center gap-2 glass rounded-xl px-5 py-3 hover:bg-white/10 transition-colors group">
            <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
            <span className="text-sm">Previous Episode</span>
          </Link>
        ) : <div />}
        {nextEp ? (
          <Link href={`/watch/tv/${tmdbId}/${seasonNum}/${nextEp.episode_number}`} className="flex items-center gap-2 glass rounded-xl px-5 py-3 hover:bg-white/10 transition-colors group">
            <span className="text-sm">Next Episode</span>
            <svg className="w-4 h-4 rotate-180 group-hover:-translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        ) : <div />}
      </div>

      {currentEp?.overview && (
        <div className="mt-8 glass rounded-xl p-6 animate-fade-in">
          <h2 className="text-lg font-bold mb-2">About This Episode</h2>
          <p className="text-neutral-300 leading-relaxed" dir="auto">{currentEp.overview}</p>
        </div>
      )}

      {episodes.length > 1 && (
        <div className="mt-8 animate-fade-in">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="w-1.5 h-5 bg-gradient-to-b from-blue-500 to-purple-600 rounded-full" />
            Season {seasonNum} Episodes
          </h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {episodes.map((ep) => (
              <Link
                key={ep.id}
                href={`/watch/tv/${tmdbId}/${seasonNum}/${ep.episode_number}`}
                className={`glass rounded-lg p-2.5 text-center text-sm font-medium transition-all hover:bg-white/10 ${
                  ep.episode_number === episodeNum ? 'bg-blue-600/30 border-blue-500/50 text-blue-400' : 'text-neutral-400 hover:text-white'
                }`}
              >
                E{ep.episode_number}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
