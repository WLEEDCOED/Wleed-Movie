import { NextRequest, NextResponse } from 'next/server';
import { getArabicSubtitle } from '@/lib/subtitles';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { episodeId } = body;

    if (!episodeId) {
      return NextResponse.json(
        { error: 'episodeId is required' },
        { status: 400 }
      );
    }

    const subtitle = await getArabicSubtitle(parseInt(episodeId));

    if (!subtitle) {
      return NextResponse.json(
        { message: 'No Arabic subtitle found' },
        { status: 404 }
      );
    }

    return NextResponse.json(subtitle);
  } catch (error) {
    console.error('Error fetching subtitle:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subtitle' },
      { status: 500 }
    );
  }
}
