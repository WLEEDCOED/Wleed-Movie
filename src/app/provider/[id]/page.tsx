import { notFound } from 'next/navigation';
import { getMoviesByProvider, getTVByProvider } from '@/lib/tmdb';
import { PROVIDER_BRANDS } from '@/lib/providers';
import ContentRail from '@/components/ContentRail';


export default async function ProviderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const provider = PROVIDER_BRANDS.find(item => item.id === Number(id));
  if (!provider) notFound();
  const [movies, shows] = await Promise.all([getMoviesByProvider(provider.id), getTVByProvider(provider.id)]);
  return <div className="catalog-page content-shell"><div className="catalog-heading"><p className="eyebrow">BROWSE BY PROVIDER</p><h1>{provider.name}</h1><p>Discover movies and series available on {provider.name}.</p></div><ContentRail title="Movies" items={movies} href={`/movies?provider=${provider.id}`} /><ContentRail title="Series" items={shows} href={`/series?provider=${provider.id}`} /></div>;
}
