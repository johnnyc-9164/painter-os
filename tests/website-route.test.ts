import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire, registerHooks} from 'node:module';
import {mkdtempSync, writeFileSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {emptyCompanyWebsiteContent} from '@painter-os-bts/domain/company-website';
import {getFunctionName} from 'convex/server';
const seam = globalThis as typeof globalThis & {[key: symbol]: unknown};
const bridgeKey = Symbol.for('painter.website.bridge.test');
const fixtureDirectory = mkdtempSync(join(tmpdir(), 'website-route-'));
const fixturePath = join(fixtureDirectory, 'bridge.cjs');
writeFileSync(fixturePath, 'module.exports={getConvexBridge(){return globalThis[Symbol.for("painter.website.bridge.test")]}}');
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === '@painter-os-bts/cloud-session/server') return {url: pathToFileURL(fixturePath).href, shortCircuit: true};
    if (specifier.startsWith('@/lib/')) return {url: new URL(`../apps/web/src/lib/${specifier.slice(6)}.ts`, import.meta.url).href, shortCircuit: true};
    return nextResolve(specifier, context);
  },

});
const require = createRequire(import.meta.url);
const {NextRequest} = require('next/server') as typeof import('next/server');
const route = require('../apps/web/src/app/api/website/route.ts') as typeof import('../apps/web/src/app/api/website/route');
const mediaRoute = require('../apps/web/src/app/api/website/media/route.ts') as typeof import('../apps/web/src/app/api/website/media/route');
let revision = 0, deny = '', session = true, sessionActor = 'actor-a';
const content = emptyCompanyWebsiteContent('Fixture painting company');
const calls: {name: string; args: Record<string, unknown>}[] = [];
const media = {mediaId: 'verified-image', name: 'project.png', width: 10, height: 10, contentType: 'image/png', size: 4, createdAt: '2026-10-09T00:00:00Z'};
seam[bridgeKey] = {
  async fetchAuthQuery(fn: never, args: Record<string, unknown>) {
    const name = getFunctionName(fn); calls.push({name, args});
    if (name === 'auth:getCurrentUser') return session ? {_id: sessionActor} : null;
    if (deny) throw new Error(deny);
    if (name === 'companyWebsite:current') return {revision, draft: content, published: null};
    if (name === 'companyWebsite:preview') return {revision, content, media: []};
    if (name === 'websiteMedia:list') return {media: [media], cursor: null, done: true};
    if (name === 'painter:articlesPage') return {page: [], isDone: true, continueCursor: null};
    if (name === 'websiteMedia:status') return {state: 'uploading', mediaId: media.mediaId};
    throw new Error('UNEXPECTED_QUERY');
  },
  async fetchAuthMutation(fn: never, args: Record<string, unknown>) {const name = getFunctionName(fn); calls.push({name, args}); if (deny) throw new Error(deny); revision++; return {revision, publishedRevision: null, replayed: false};},
  async fetchAuthAction(fn: never, args: Record<string, unknown>) {const name = getFunctionName(fn); calls.push({name, args}); if (deny) throw new Error(deny); return name === 'websiteMediaUpload:readPrivate' ? {bytes: new ArrayBuffer(4), contentType: 'image/png'} : {state: 'ready', media};},
};
const post = (value: unknown, origin = 'https://painter.test') => new NextRequest('https://painter.test/api/website', {method: 'POST', headers: {origin, host: 'painter.test', 'x-painter-website-actor': 'actor-a'}, body: JSON.stringify(value)});
const command = () => ({workspaceId: 'company', action: 'saveDraft', expectedRevision: revision, requestKey: 'exact-intent', content});
test('actual website route + server use authenticated session, canonical data and backend authority', async () => {
  revision = 0; calls.length = 0;
  const response = await route.GET(new NextRequest('https://painter.test/api/website?workspaceId=company', {headers: {'x-painter-website-actor': 'actor-a'}}));
  assert.equal(response.status, 200); assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual((await response.json()).state, {revision: 0, draft: content, published: null});
  assert.deepEqual(calls.map(call => call.name), ['auth:getCurrentUser', 'companyWebsite:current', 'companyWebsite:preview', 'websiteMedia:list', 'painter:articlesPage']);
  calls.length = 0;
  assert.equal((await route.POST(post(command()))).status, 200);
  assert.equal(calls[1]!.name, 'companyWebsite:saveDraft');
  assert.equal(calls[1]!.args.requestKey, 'exact-intent'); assert.equal(calls[1]!.args.expectedRevision, 0);
  assert.equal(calls[4]!.args.expectedRevision, 1);
  session = false; calls.length = 0;
  assert.equal((await route.POST(post(command()))).status, 401);
  assert.deepEqual(calls.map(call => call.name), ['auth:getCurrentUser']); session = true;
  for (const [code, status] of [['FORBIDDEN', 403], ['REVISION_CONFLICT', 409], ['IDEMPOTENCY_KEY_CONFLICT', 409]] as const) {
    deny = code; assert.equal((await route.POST(post(command()))).status, status);
  }
  deny = '';
});
test('actual server actor comparison prevents stale-account writes within the same workspace', async () => {
  sessionActor = 'actor-b'; calls.length = 0;
  const stale = post(command()); stale.headers.set('cookie', 'fixture-session=actor-b');
  const response = await route.POST(stale);
  assert.equal(response.status, 401); assert.deepEqual(await response.json(), {error: 'UNAUTHENTICATED'});
  assert.deepEqual(calls.map(call => call.name), ['auth:getCurrentUser']);
  const missing = post(command()); missing.headers.delete('x-painter-website-actor'); calls.length = 0;
  assert.equal((await route.POST(missing)).status, 401); assert.equal(calls.length, 0);
  const oversized = post(command()); oversized.headers.set('x-painter-website-actor', 'a'.repeat(201));
  assert.equal((await route.POST(oversized)).status, 401); assert.equal(calls.length, 0);
  sessionActor = 'actor-a';
});
test('forged fields, duplicate query values, local mode and streamed oversize deny before backend writes', async () => {
  calls.length = 0;
  for (const value of [{...command(), role: 'owner'}, {...command(), action: 'private.file.publish'}, {...command(), expectedRevision: -1}, {...command(), content: {...content, secret: 'forged'}}]) assert.equal((await route.POST(post(value))).status, 400);
  assert.equal((await route.POST(post(command(), 'https://foreign.test'))).status, 403);
  assert.equal((await route.GET(new NextRequest('https://painter.test/api/website?workspaceId=company&workspaceId=other'))).status, 400);
  const oversized = new NextRequest('https://painter.test/api/website', {method: 'POST', headers: {origin: 'https://painter.test', host: 'painter.test', 'x-painter-website-actor': 'actor-a'}, body: ' '.repeat(256 * 1024 + 1)});
  assert.equal((await route.POST(oversized)).status, 400);
  const previous = process.env.PAINTER_RUNTIME; process.env.PAINTER_RUNTIME = 'local';
  try {assert.equal((await route.POST(post(command()))).status, 503);} finally {if (previous === undefined) delete process.env.PAINTER_RUNTIME; else process.env.PAINTER_RUNTIME = previous;}
  assert.equal(calls.length, 0);
});
test('dedicated media proxy transmits bytes to authenticated action and never adopts private file IDs', async () => {
  calls.length = 0;
  const form = new FormData(); form.set('workspaceId', 'company'); form.set('requestKey', 'same-upload-nonce'); form.set('file', new File([new Uint8Array([1, 2, 3, 4])], 'project.png', {type: 'image/png'}));
  const request = new NextRequest('https://painter.test/api/website/media', {method: 'POST', headers: {origin: 'https://painter.test', host: 'painter.test', 'x-painter-website-actor': 'actor-a'}, body: form});
  assert.equal((await mediaRoute.POST(request)).status, 200);
  assert.equal(calls[1]!.name, 'websiteMediaUpload:upload'); assert.equal((calls[1]!.args.bytes as ArrayBuffer).byteLength, 4);
  assert.equal(calls[1]!.args.requestKey, 'same-upload-nonce'); assert.equal('storageId' in calls[1]!.args, false);
  const image = await mediaRoute.GET(new NextRequest('https://painter.test/api/website/media?workspaceId=company&mediaId=verified-image&revision=1'));
  assert.equal(image.headers.get('cache-control'), 'private, no-store'); assert.equal(image.headers.get('cross-origin-resource-policy'), 'same-origin');
  assert.equal(image.headers.get('content-type'), 'image/png');
  assert.equal((await mediaRoute.GET(new NextRequest('https://painter.test/api/website/media?workspaceId=company&requestKey=same-upload-nonce', {headers: {'x-painter-website-actor': 'actor-a'}}))).status, 200);
  assert.equal((await mediaRoute.GET(new NextRequest('https://painter.test/api/website/media?workspaceId=company&mediaId=private-job-file&role=owner'))).status, 400);
  form.set('storageId', 'private-job-storage'); calls.length = 0;
  assert.equal((await mediaRoute.POST(new NextRequest('https://painter.test/api/website/media', {method: 'POST', headers: {origin: 'https://painter.test', host: 'painter.test', 'x-painter-website-actor': 'actor-a'}, body: form}))).status, 400);
  assert.equal(calls.length, 0);
});
test.after(() => {hooks.deregister(); delete seam[bridgeKey]; rmSync(fixtureDirectory, {recursive: true});});
