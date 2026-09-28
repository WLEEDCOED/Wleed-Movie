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

  const servers = await prisma.streamingServer.findMany({
    where: {
      episodeId: parseInt(episodeId),
      isActive: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(servers);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { episodeId, name, embedUrl, language, quality, isTrusted } = body;

    if (!episodeId || !name || !embedUrl) {
      return NextResponse.json(
        { error: 'episodeId, name, and embedUrl are required' },
        { status: 400 }
      );
    }

    const server = await prisma.streamingServer.create({
      data: {
        episodeId: parseInt(episodeId),
        name,
        embedUrl,
        language: language || null,
        quality: quality || null,
        isTrusted: isTrusted || false,
      },
    });

    return NextResponse.json(server, { status: 201 });
  } catch (error) {
    console.error('Error creating server:', error);
    return NextResponse.json(
      { error: 'Failed to create server' },
      { status: 500 }
    );
  }
}
