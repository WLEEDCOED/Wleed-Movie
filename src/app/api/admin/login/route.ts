import { createHmac } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE, adminConfigured, adminCookieOptions, createAdminSession, verifyAdminPassword } from '@/lib/admin-auth';
import { analyticsConfigured, getRedis } from '@/lib/site-analytics';
import { isSameOrigin, sameOriginUrl } from '@/lib/request-origin';

export const dynamic = 'force-dynamic';

function goToAdmin(request: NextRequest, error?: string) {
  const url = sameOriginUrl(request, '/admin');
  if (error) url.searchParams.set('error', error);
  const response = NextResponse.redirect(url, 303);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function POST(request: NextRequest) {
  if (!isSameOrigin(request)) return goToAdmin(request, 'invalid');
  if (!adminConfigured() || !analyticsConfigured()) return goToAdmin(request, 'setup');

  const form = await request.formData();
  const password = form.get('password');
  if (typeof password !== 'string' || password.length > 256) return goToAdmin(request, 'invalid');

  try {
    const redis = getRedis();
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const id = createHmac('sha256', process.env.ADMIN_SESSION_SECRET || '')
      .update(ip).digest('hex').slice(0, 32);
    const attemptsKey = `wm:admin:attempts:${id}`;
    if (Number(await redis.get<number>(attemptsKey) || 0) >= 8) {
      return goToAdmin(request, 'locked');
    }

    if (!verifyAdminPassword(password)) {
      const attempts = await redis.incr(attemptsKey);
      if (attempts === 1) await redis.expire(attemptsKey, 15 * 60);
      return goToAdmin(request, 'invalid');
    }

    await redis.del(attemptsKey);
    const response = goToAdmin(request);
    response.cookies.set(ADMIN_COOKIE, createAdminSession(), adminCookieOptions);
    return response;
  } catch (error) {
    console.error('Admin sign in failed:', error);
    return goToAdmin(request, 'unavailable');
  }
}
