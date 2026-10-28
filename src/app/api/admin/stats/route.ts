import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, verifyAdminSession } from '@/lib/admin-auth';
import { analyticsConfigured, getAnalyticsSnapshot } from '@/lib/site-analytics';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (!verifyAdminSession(request.cookies.get(ADMIN_COOKIE)?.value)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: { 'Cache-Control': 'no-store' } });
  }
  if (!analyticsConfigured()) {
    return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
  try {
    return NextResponse.json(await getAnalyticsSnapshot(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('Admin analytics read failed:', error);
    return NextResponse.json({ error: 'Analytics unavailable' }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
