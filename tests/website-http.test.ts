import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire} from 'node:module';
const {WebsiteTransportError, websiteRequest} = createRequire(import.meta.url)('../apps/web/src/lib/company-website-http.ts') as typeof import('../apps/web/src/lib/company-website-http');

const decode = (value: unknown) => {
  if (!value || typeof value !== 'object' || !('revision' in value) || typeof value.revision !== 'number') throw new Error('INVALID_RESPONSE');
  return value.revision;
};
test('private website transport limits endpoint and forces same-origin uncached requests', async () => {
  let seen: RequestInit | undefined;
  const send: typeof fetch = async (_path, init) => {seen = init; return Response.json({revision: 2});};
  assert.equal(await websiteRequest('/api/website?workspaceId=company', decode, {credentials: 'include', cache: 'force-cache'}, send), 2);
  assert.equal(seen?.credentials, 'same-origin'); assert.equal(seen?.cache, 'no-store');
  await assert.rejects(websiteRequest('https://foreign.test/api/website', decode, {}, send), {kind: 'denied'});
  await assert.rejects(websiteRequest('/api/website-other', decode, {}, send), {kind: 'denied'});
});
test('unknown writes and malformed replies never report confirmed success or expose server text', async () => {
  await assert.rejects(websiteRequest('/api/website', decode, {}, async () => {throw new Error('private network details');}), {kind: 'unknown'});
  for (const body of ['invalid', JSON.stringify({secret: 'private'}), ' '.repeat(1024 * 1024 + 1)]) {
    await assert.rejects(websiteRequest('/api/website', decode, {}, async () => new Response(body)), (error: unknown) => error instanceof WebsiteTransportError && error.kind === 'invalid_response' && !error.message.includes('private'));
  }
  for (const [status, kind] of [[401, 'signed_out'], [403, 'denied'], [409, 'conflict'], [503, 'unavailable'], [500, 'unknown']] as const) {
    await assert.rejects(websiteRequest('/api/website', decode, {}, async () => new Response('private backend detail', {status})), {kind});
  }
});
