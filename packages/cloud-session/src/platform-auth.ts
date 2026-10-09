import type { getConvexBridge } from './server';
type Bridge = ReturnType<typeof getConvexBridge>;
const maxBodyBytes = 16384;
function reply(state: string, status: number) {
  return Response.json({ state }, { status, headers: { 'Cache-Control': 'private, no-store', Vary: 'Cookie' } });
}
function sameOrigin(request: Request, configuredOrigin?: string) {
  try {
    const expected = new URL(configuredOrigin ?? request.url);
    // Next's loopback request URL can use its internal hostname; Host is the browser-facing authority.
    if (!configuredOrigin && request.headers.get('host')) expected.host = request.headers.get('host')!;
    const supplied = request.headers.get('origin');
    return !!supplied && new URL(supplied).origin === supplied && supplied === expected.origin;
  } catch { return false; }
}
async function boundedBody(request: Request): Promise<string> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const parts: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      length += part.value.byteLength;
      if (length > maxBodyBytes) { await reader.cancel(); throw new Error('INVALID_BODY'); }
      parts.push(part.value);
    }
  } finally { reader.releaseLock(); }
  const body = new Uint8Array(length);
  let offset = 0;
  for (const part of parts) { body.set(part, offset); offset += part.byteLength; }
  return new TextDecoder('utf-8', { fatal: true }).decode(body);
}
/** Narrow platform compatibility login/logout only. Better Auth remains the identity authority. */
export async function platformAuthResponse(request: Request, getBridge: () => Bridge, configuredOrigin?: string): Promise<Response> {
  if (!sameOrigin(request, configuredOrigin)) return reply('denied', 403);
  if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return reply('invalid_request', 400);
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(await boundedBody(request));
    if (!data || typeof data !== 'object' || Array.isArray(data) || !['login', 'logout'].includes(String(data.action))) return reply('invalid_request', 400);
    const allowed = data.action === 'login' ? ['action', 'email', 'password'] : ['action'];
    if (Object.keys(data).some(key => !allowed.includes(key))) return reply('invalid_request', 400);
    if (data.action === 'login' && (typeof data.email !== 'string' || typeof data.password !== 'string' || !data.email.trim() || !data.password)) return reply('invalid_request', 400);
  } catch { return reply('invalid_request', 400); }
  try {
    const url = new URL(request.url);
    url.pathname = data.action === 'login' ? '/api/auth/sign-in/email' : '/api/auth/sign-out'; url.search = '';
    const headers = new Headers(request.headers); headers.delete('content-length'); headers.set('content-type', 'application/json');
    const upstream = await getBridge().handler.POST(new Request(url, { method: 'POST', headers, body: JSON.stringify(data.action === 'login' ? { email: String(data.email).trim(), password: data.password } : {}) }));
    const response = reply(upstream.ok ? 'ready' : 'unavailable', upstream.ok ? 200 : [400, 401, 403, 429].includes(upstream.status) ? upstream.status : 503);
    for (const cookie of upstream.headers.getSetCookie()) response.headers.append('set-cookie', cookie);
    return response;
  } catch { return reply('unavailable', 503); }
}
/** Platform app exposes only existing session endpoints; no signup or tenant provisioning endpoint. */
export async function platformSessionResponse(request: Request, getBridge: () => Bridge, configuredOrigin?: string): Promise<Response> {
  const pathname = new URL(request.url).pathname;
  const allowed = request.method === 'GET' ? ['/api/auth/get-session', '/api/auth/convex/token'] : ['/api/auth/sign-in/email', '/api/auth/sign-out'];
  if (!allowed.includes(pathname)) return reply('not_found', 404);
  if (request.method !== 'GET' && !sameOrigin(request, configuredOrigin)) return reply('denied', 403);
  try {
    const headers = new Headers(request.headers); headers.delete('content-length');
    const upstreamRequest = request.method === 'GET' ? request : new Request(request.url, { method: 'POST', headers, body: await boundedBody(request) });
    const upstream = await getBridge().handler[request.method === 'GET' ? 'GET' : 'POST'](upstreamRequest);
    // Raw session endpoints preserve the Better Auth protocol; backend handles authorization.
    if (!upstream.ok) return reply('unavailable', [400, 401, 403, 429].includes(upstream.status) ? upstream.status : 503);
    const response = new Response(upstream.body, { status: upstream.status, headers: upstream.headers });
    response.headers.set('Cache-Control', 'private, no-store'); response.headers.set('Vary', 'Cookie');
    return response;
  } catch { return reply('unavailable', 503); }
}
