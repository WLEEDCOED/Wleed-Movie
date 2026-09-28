import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const episodeId = searchParams.get('episodeId');

  if (!episodeId) {
    return NextResponse.json(
      { error: 'episodeId is required' },
      { status: 400 }
    );
  }

  const subtitles = await prisma.subtitle.findMany({
    where: {
      episodeId: parseInt(episodeId),
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(subtitles);
}
