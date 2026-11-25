import type { CatalogMediaType } from '@/lib/catalog-content';
import { getCatalogTitleVisibility } from '@/lib/tmdb';

export async function GET(request: Request) {
  const titles = [...new Set((new URL(request.url).searchParams.get('titles') ?? '').split(','))];
  if (titles.length > 20 || titles.some(title => !/^(movie|tv):[1-9]\d{0,9}$/.test(title))) {
    return Response.json({ error: 'Invalid catalog titles' }, { status: 400 });
  }

  const visibility: Record<string, boolean> = {};
  for (let offset = 0; offset < titles.length; offset += 5) {
    await Promise.all(titles.slice(offset, offset + 5).map(async title => {
      const [type, id] = title.split(':');
      try {
        visibility[title] = await getCatalogTitleVisibility(type as CatalogMediaType, Number(id));
      } catch { /* Leave unavailable metadata unchecked for a later request. */ }
    }));
  }
  return Response.json(visibility, { headers: { 'Cache-Control': 'private, max-age=300' } });
}
