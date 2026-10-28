import { NextRequest, NextResponse } from 'next/server';
import { ADMIN_COOKIE } from '@/lib/admin-auth';
import { sameOriginUrl } from '@/lib/request-origin';

export async function POST(request: NextRequest) {
  const response = NextResponse.redirect(sameOriginUrl(request, '/admin'), 303);
  response.cookies.delete(ADMIN_COOKIE);
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
