import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

const readJson = (path: string) => JSON.parse(readFileSync(new URL('../' + path, import.meta.url), 'utf8'));
const web = readJson('apps/web/package.json');
const backend = readJson('packages/backend/package.json');
const cloudSession = readJson('packages/cloud-session/package.json');
const lock = readJson('package-lock.json');

test('web and Convex backend use a single Better Auth version compatible with the pinned plugin', () => {
  const version = web.dependencies['better-auth'];
  assert.equal(version, backend.dependencies['better-auth'], 'web/backend Better Auth versions must be equal');
  assert.equal(version, '1.6.34', 'use the latest verified 1.6 compatibility release until Convex integration supports 1.7');
  assert.equal(backend.dependencies['@convex-dev/better-auth'], '0.12.6');
  assert.equal(web.dependencies['@convex-dev/better-auth'], '0.12.6');
  assert.equal(cloudSession.dependencies['@convex-dev/better-auth'], '0.12.6');
  assert.equal(lock.packages['apps/web'].dependencies['better-auth'], version);
  assert.equal(lock.packages['packages/backend'].dependencies['better-auth'], version);
  const installed = Object.entries(lock.packages)
    .filter(([path]) => path === 'node_modules/better-auth' || path.endsWith('/node_modules/better-auth'))
    .map(([path, metadata]: [string, any]) => ({ path, version: metadata.version }));
  assert.ok(installed.length, 'Better Auth must appear in lockfile');
  assert.ok(installed.every(({ version: found }) => found === version), 'no shadow copy of incompatible Better Auth allowed');
});

test('current auth configuration does not activate vulnerable Magic Link + OAuth combination', () => {
  const auth = readFileSync(new URL('../packages/backend/convex/auth.ts', import.meta.url), 'utf8');
  assert.doesNotMatch(auth, /\bmagicLink\s*\(/);
  assert.doesNotMatch(auth, /\bsocialProviders\s*:/);
  assert.doesNotMatch(auth, /\bgenericOAuth\s*\(/);
  assert.doesNotMatch(auth, /\boauthProxy\s*\(/);
});
