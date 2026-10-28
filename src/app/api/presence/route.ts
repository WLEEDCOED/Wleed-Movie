import { NextRequest, NextResponse } from 'next/server';
import { analyticsConfigured, recordPresence, type PresenceUpdate } from '@/lib/site-analytics';
import { isSameOrigin } from '@/lib/request-origin';

export const dynamic = 'force-dynamic';

const UUID = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (!analyticsConfigured()) {
    return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503 });
  }

  let payload: PresenceUpdate;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  if (!payload || !UUID.test(payload.visitorId) || !UUID.test(payload.tabId)
    || typeof payload.path !== 'string' || !/^\/[\w\-/]*$/.test(payload.path)
    || payload.path.length > 120 || payload.path.startsWith('/admin')
    || typeof payload.watching !== 'boolean' || typeof payload.active !== 'boolean'
    || typeof payload.pageView !== 'boolean') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    await recordPresence(payload);
    return new NextResponse(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Analytics presence update failed:', error);
    return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503 });
  }
}
