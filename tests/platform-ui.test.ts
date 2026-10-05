import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const { decodePlatformResult } = require('../apps/web/src/lib/platform-client.ts') as typeof import('../apps/web/src/lib/platform-client.ts');

// Next compiles workspace TSX with the automatic JSX runtime. Keep state-render tests
// on that same transform; root tsx's CJS loader does not cover shared UI's JSX config.
test('platform state rendering with the installed automatic-JSX test runner', () => {
  const child = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.platform.config.ts'], { cwd: new URL('../', import.meta.url), encoding: 'utf8', timeout: 60000, env: { PATH: process.env.PATH, HOME: process.env.HOME, CI: '1', TZ: 'UTC' } });
  assert.equal(child.status, 0, child.stdout + child.stderr);
});

test('client rejects malformed and extra-private-field responses rather than rendering them', () => {
  assert.deepEqual(decodePlatformResult('workspaces', { state: 'ready', items: [], nextCursor: null }), { state: 'ready', items: [], nextCursor: null });
  assert.throws(() => decodePlatformResult('workspaces', { state: 'ready', items: [{ id: 'x', name: 'X', createdAt: 'test', demo: false, ownerId: 'secret' }], nextCursor: null }));
  assert.throws(() => decodePlatformResult('workspaces', { state: 'ready', items: 'wrong', nextCursor: null }));
  assert.throws(() => decodePlatformResult('overview', { state: 'ready', user: { email: 'secret' } }));
});
