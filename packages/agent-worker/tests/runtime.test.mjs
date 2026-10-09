import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

function runtime(storage, release = 'yes', production = false) {
  const options = convertV4MiniflareOptions({
    name: 'painter-local-test', modules: true,
    scriptPath: new URL(production ? '../dist/index.js' : '../dist-fixture/worker.js', import.meta.url).pathname,
    compatibilityDate: '2026-10-09', compatibilityFlags: ['nodejs_compat'],
    durableObjects: production ? { PAINTER_AGENT: { className: 'PainterAgent', useSQLite: true } } : { FIXTURE: { className: 'FixtureAgent', useSQLite: true } },
    bindings: { RELEASE: release },
  });
  // Miniflare 5 stores resource persistence on the instance, not the V4 DO option.
  options.resourcePersistencePath = storage;
  return new Miniflare(options);
}
async function call(mf, path, params = {}) {
  const url = new URL(path, 'http://fixture.invalid');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await mf.dispatchFetch(url);
  assert.equal(response.status, 200, await response.clone().text());
  return response.json();
}
function metric(state, name) { return state.metrics.find(row => row.name === name)?.count ?? 0; }
async function until(mf, predicate, params = {}) {
  for (let i = 0; i < 100; i++) { const state = await call(mf, '/inspect', params); if (predicate(state)) return state; await delay(30); }
  throw new Error('Fixture did not reach expected durable checkpoint');
}

test('production worker refuses all requests without a trusted adapter', { timeout: 30000 }, async () => {
  const storage = await mkdtemp(join(tmpdir(), 'painter-pi-prod-'));
  const mf = runtime(storage, 'yes', true);
  try {
    for (const path of ['/', '/ask', '/submit', '/snapshot']) {
      const response = await mf.dispatchFetch(`http://fixture.invalid${path}`, { method: 'POST' });
      assert.equal(response.status, 503);
      assert.equal(response.headers.get('cache-control'), 'no-store');
      assert.deepEqual(await response.json(), { error: 'TRUSTED_AGENT_ADAPTER_NOT_CONFIGURED' });
    }
  } finally { await mf.dispose(); await rm(storage, { recursive: true, force: true }); }
});

test('actual Pi lifecycle persists submission dedup, tenant object isolation and snapshot through restart', { timeout: 60000 }, async () => {
  const storage = await mkdtemp(join(tmpdir(), 'painter-pi-dedup-'));
  let mf = runtime(storage);
  try {
    const params = { conversation: 'company-a/chat-1', operation: 'input-1' };
    assert.equal((await call(mf, '/submit', params)).accepted, true);
    assert.equal((await call(mf, '/result', params)).status, 'done');
    assert.equal((await call(mf, '/submit', params)).accepted, false);
    assert.equal(metric(await call(mf, '/inspect', params), 'read'), 1);
    assert.equal(metric(await call(mf, '/inspect', { conversation: 'company-b/chat-1' }), 'read'), 0);
    const before = await call(mf, '/snapshot', params);
    assert.ok(JSON.stringify(before).includes('fixture completed'));
    await mf.dispose();
    mf = runtime(storage);
    assert.equal((await call(mf, '/submit', params)).accepted, false);
    assert.equal((await call(mf, '/result', params)).status, 'done');
    assert.equal(metric(await call(mf, '/inspect', params), 'read'), 1);
    const after = await call(mf, '/snapshot', params);
    assert.ok(JSON.stringify(after).includes('fixture completed'));
  } finally { await mf.dispose(); await rm(storage, { recursive: true, force: true }); }
});

test('safe tool repeats after actual runtime restart and completes persisted operation', { timeout: 60000 }, async () => {
  const storage = await mkdtemp(join(tmpdir(), 'painter-pi-safe-'));
  let mf = runtime(storage, 'no');
  try {
    const params = { operation: 'safe-interrupted' };
    await call(mf, '/submit', params);
    await until(mf, state => metric(state, 'read') === 1);
    await mf.dispose();
    mf = runtime(storage, 'yes');
    assert.equal((await call(mf, '/result', params)).status, 'done');
    assert.equal(metric(await call(mf, '/inspect'), 'read'), 2);
  } finally { await mf.dispose(); await rm(storage, { recursive: true, force: true }); }
});

test('unsafe tool does not replay; explicit later model retry is blocked by durable unknown-outcome fixture ledger', { timeout: 60000 }, async () => {
  const storage = await mkdtemp(join(tmpdir(), 'painter-pi-unsafe-'));
  let mf = runtime(storage, 'no');
  try {
    const params = { operation: 'unsafe-interrupted', prompt: 'unsafe effect' };
    await call(mf, '/submit', params);
    await until(mf, state => metric(state, 'effect') === 1);
    await mf.dispose();
    mf = runtime(storage, 'yes');
    assert.equal((await call(mf, '/result', params)).status, 'done');
    const state = await call(mf, '/inspect');
    assert.equal(metric(state, 'effect'), 1);
    assert.equal(metric(state, 'blocked'), 1);
    assert.deepEqual(state.effects, [{ id: 'fixed-effect', outcome: 'dispatching' }]);
  } finally { await mf.dispose(); await rm(storage, { recursive: true, force: true }); }
});

test('explicit session abort reaches a tool honoring abortSignal and settles unanswered', { timeout: 60000 }, async () => {
  const storage = await mkdtemp(join(tmpdir(), 'painter-pi-abort-'));
  const mf = runtime(storage, 'no');
  try {
    const params = { operation: 'abort-input' };
    await call(mf, '/submit', params);
    await until(mf, state => metric(state, 'read') === 1);
    await call(mf, '/abort', params);
    assert.equal((await call(mf, '/result', params)).status, 'unanswered');
    assert.deepEqual((await call(mf, '/inspect')).pending, []);
  } finally { await mf.dispose(); await rm(storage, { recursive: true, force: true }); }
});

test('interrupted actual model stream is requested again after SQLite runtime restart', { timeout: 60000 }, async () => {
  const storage = await mkdtemp(join(tmpdir(), 'painter-pi-model-'));
  let mf = runtime(storage, 'no');
  try {
    const params = { operation: 'model-interrupted', prompt: 'inflight model' };
    await call(mf, '/submit', params);
    await until(mf, state => metric(state, 'model') === 1);
    await mf.dispose();
    mf = runtime(storage, 'yes');
    assert.equal((await call(mf, '/result', params)).status, 'done');
    assert.ok(metric(await call(mf, '/inspect'), 'model') >= 3, 'initial interrupted request plus repeated model request and final answer');
    assert.equal(metric(await call(mf, '/inspect'), 'read'), 1);
  } finally { await mf.dispose(); await rm(storage, { recursive: true, force: true }); }
});
