import { createHmac, scryptSync, timingSafeEqual } from 'node:crypto';

export const ADMIN_COOKIE = 'wm_admin_session';
const SESSION_SECONDS = 12 * 60 * 60;

export function adminConfigured(): boolean {
  return Boolean(process.env.ADMIN_PASSWORD_HASH && process.env.ADMIN_SESSION_SECRET);
}

export function verifyAdminPassword(password: string): boolean {
  const stored = process.env.ADMIN_PASSWORD_HASH || '';
  const [salt, hash] = stored.split(':');
  if (!/^[a-f\d]{32}$/i.test(salt || '') || !/^[a-f\d]{64}$/i.test(hash || '')) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, Buffer.from(salt, 'hex'), expected.length);
  return timingSafeEqual(actual, expected);
}

function signature(value: string): string {
  return createHmac('sha256', process.env.ADMIN_SESSION_SECRET || '')
    .update(value)
    .digest('hex');
}

export function createAdminSession(): string {
  const expires = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${expires}.${signature(expires)}`;
}

export function verifyAdminSession(value?: string): boolean {
  if (!adminConfigured() || !value) return false;
  const [expires, supplied] = value.split('.');
  if (!/^\d{10}$/.test(expires || '') || !/^[a-f\d]{64}$/i.test(supplied || '')) return false;
  if (Number(expires) < Math.floor(Date.now() / 1000)) return false;
  const expected = Buffer.from(signature(expires), 'hex');
  return timingSafeEqual(Buffer.from(supplied, 'hex'), expected);
}

export const adminCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/',
  maxAge: SESSION_SECONDS,
};
