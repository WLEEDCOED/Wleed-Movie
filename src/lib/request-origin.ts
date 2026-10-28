export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  const host = request.headers.get('host');
  if (!host) return false;
  try {
    const parsed = new URL(origin);
    const expectedProtocol = new URL(request.url).protocol;
    return parsed.host === host && parsed.protocol === expectedProtocol;
  } catch {
    return false;
  }
}

export function sameOriginUrl(request: Request, path: string): URL {
  const origin = request.headers.get('origin');
  return new URL(path, origin && isSameOrigin(request) ? origin : request.url);
}
