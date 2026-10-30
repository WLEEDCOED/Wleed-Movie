import { NextRequest, NextResponse } from 'next/server';
import { searchMovies, searchMulti, searchTV } from '@/lib/tmdb';

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim().slice(0, 100) ?? '';
  const type = request.nextUrl.searchParams.get('type') ?? 'all';
  if (query.length < 2) return NextResponse.json({ results: [] });
  if (type !== 'movie' && type !== 'tv' && type !== 'all') {
    return NextResponse.json({ error: 'Invalid media type' }, { status: 400 });
  }

  try {
    const results = type === 'movie'
      ? (await searchMovies(query)).results
      : type === 'tv'
        ? (await searchTV(query)).results
        : await searchMulti(query);
    return NextResponse.json({ results }, { headers: { 'Cache-Control': 'public, max-age=60, stale-while-revalidate=300' } });
  } catch {
    return NextResponse.json({ error: 'Search is unavailable right now.' }, { status: 502 });
  }
}
