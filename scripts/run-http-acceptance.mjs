import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

export function localEnvironment(source, base, dataDir) {
  if (new URL(base).hostname !== '127.0.0.1' || new URL(base).protocol !== 'http:') throw new Error('LOOPBACK_REQUIRED');
  const env = {};
  for (const name of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'HOME', 'USERPROFILE', 'CI', 'TZ']) {
    if (source[name] !== undefined) env[name] = source[name];
  }
  return { ...env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', PAINTER_RUNTIME: 'local', PAINTER_ALLOW_DEMO: 'true', PAINTER_COOKIE_SECURE: 'false', PAINTER_APP_URL: base, PAINTER_TEST_URL: base, PAINTER_DATA_DIR: dataDir };
}

export async function removeOwnedDirectory(parent, directory) {
  const target = resolve(directory);
  if (dirname(target) !== resolve(parent) || !basename(target).startsWith('painter-http-')) throw new Error('UNOWNED_CLEANUP_PATH');
  await rm(target, { recursive: true, force: true });
}

export function observe(child) {
  const state = { ended: false, result: undefined };
  state.finished = new Promise(resolve => {
    const finish = result => { if (!state.ended) { state.ended = true; state.result = result; resolve(result); } };
    child.once('error', error => finish({ error }));
    child.once('exit', (code, signal) => finish({ code, signal }));
  });
  return state;
}

export async function waitForReady(base, state, timeoutMs = 60_000) {
  if (new URL(base).hostname !== '127.0.0.1' || new URL(base).protocol !== 'http:') throw new Error('LOOPBACK_REQUIRED');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (state.ended) throw new Error('NEXT_EXITED_BEFORE_READY', { cause: state.result?.error });
    try {
      const response = await fetch(`${base}/api/snapshot`, { redirect: 'error', signal: AbortSignal.timeout(Math.min(500, Math.max(1, deadline - Date.now()))) });
      if (response.status === 401 && (await response.json()).error === 'UNAUTHENTICATED') return;
    } catch { /* Startup is polled only until the fixed deadline. */ }
    await pause(Math.min(100, Math.max(0, deadline - Date.now())));
  }
  throw new Error('NEXT_READINESS_TIMEOUT');
}

export async function stop(child, state) {
  if (!child || state.ended) return;
  child.kill('SIGTERM');
  await Promise.race([state.finished, pause(2_000)]);
  if (!state.ended) {
    child.kill('SIGKILL');
    await Promise.race([state.finished, pause(2_000)]);
  }
  if (!state.ended) throw new Error('CHILD_CLEANUP_FAILED');
}

export async function waitForHarness(state, timeoutMs = 120_000) {
  let timeout;
  let result;
  try {
    result = await Promise.race([state.finished, new Promise(resolve => { timeout = setTimeout(() => resolve({ timeout: true }), timeoutMs); })]);
  } finally { clearTimeout(timeout); }
  if (result.timeout) throw new Error('HTTP_ACCEPTANCE_TIMEOUT');
  if (result.error || result.code !== 0) throw new Error(`HTTP_ACCEPTANCE_FAILED:${result.code ?? result.signal ?? 'spawn'}`, { cause: result.error });
}

async function unusedPort() {
  const reservation = createServer();
  await new Promise((resolve, reject) => { reservation.once('error', reject); reservation.listen(0, '127.0.0.1', resolve); });
  const port = reservation.address().port;
  await new Promise((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
  return port;
}

export async function runHttpAcceptance() {
  const parent = resolve(process.env.RUNNER_TEMP || tmpdir());
  const directory = await mkdtemp(join(parent, 'painter-http-'));
  let server, serverState, harness, harnessState;
  let interrupted = false;
  const interrupt = () => { interrupted = true; harness?.kill('SIGTERM'); server?.kill('SIGTERM'); };
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', interrupt);
  try {
    const base = `http://127.0.0.1:${await unusedPort()}`;
    const env = localEnvironment(process.env, base, directory);
    const web = join(root, 'apps', 'web');
    const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next', { paths: [web] });
    server = spawn(process.execPath, [nextBin, 'start', '--hostname', '127.0.0.1', '--port', new URL(base).port], { cwd: web, env, stdio: 'inherit', shell: false });
    serverState = observe(server);
    await waitForReady(base, serverState);
    if (interrupted) throw new Error('HTTP_ACCEPTANCE_INTERRUPTED');
    harness = spawn(process.execPath, [join(root, 'tests', 'http.acceptance.mjs')], { cwd: root, env, stdio: 'inherit', shell: false });
    harnessState = observe(harness);
    await waitForHarness(harnessState);
    if (interrupted) throw new Error('HTTP_ACCEPTANCE_INTERRUPTED');
    console.log('HTTP loopback acceptance passed (local datastore; legacy /site, not the separate marketing app).');
  } finally {
    process.removeListener('SIGINT', interrupt);
    process.removeListener('SIGTERM', interrupt);
    try { await stop(harness, harnessState); } finally {
      await stop(server, serverState);
      await removeOwnedDirectory(parent, directory);
    }
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runHttpAcceptance().catch(error => { console.error(error.message); process.exitCode = 1; });
}
