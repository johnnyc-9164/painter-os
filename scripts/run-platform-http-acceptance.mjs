import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { observe, stop, waitForHarness, removeOwnedDirectory } from './run-http-acceptance.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
export function platformEnvironment(source, directory, runtime) {
  if (!['local', 'unconfigured'].includes(runtime)) throw new Error('ISOLATED_RUNTIME_REQUIRED');
  const env = {};
  for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'CI', 'TZ']) if (source[key] !== undefined) env[key] = source[key];
  return { ...env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', HOME: directory, USERPROFILE: directory, ...(runtime === 'local' ? { PAINTER_RUNTIME: 'local' } : {}) };
}
async function unusedPort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const port = server.address().port;
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
  return port;
}
async function ready(base, state) {
  const deadline = Date.now() + 45000;
  while (Date.now() < deadline) {
    if (state.ended) throw new Error('PLATFORM_EXITED_BEFORE_READY', { cause: state.result?.error });
    try { if ((await fetch(base + '/platform', { redirect: 'error', signal: AbortSignal.timeout(500) })).status === 200) return; } catch { /* Poll only until the fixed deadline. */ }
    await pause(100);
  }
  throw new Error('PLATFORM_READINESS_TIMEOUT');
}
export async function runPlatformHttpAcceptance(runtime) {
  const parent = resolve(process.env.RUNNER_TEMP || tmpdir());
  const directory = await mkdtemp(join(parent, 'painter-http-platform-'));
  let server, serverState, harness, harnessState;
  let interrupted = false;
  const interrupt = () => { interrupted = true; harness?.kill('SIGTERM'); server?.kill('SIGTERM'); };
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  try {
    const base = `http://127.0.0.1:${await unusedPort()}`;
    const env = platformEnvironment(process.env, directory, runtime);
    const web = join(root, 'apps', 'web');
    const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next', { paths: [web] });
    server = spawn(process.execPath, [nextBin, 'start', '--hostname', '127.0.0.1', '--port', new URL(base).port], { cwd: web, env, stdio: 'inherit', shell: false });
    serverState = observe(server);
    await ready(base, serverState);
    if (interrupted) throw new Error('PLATFORM_ACCEPTANCE_INTERRUPTED');
    harness = spawn(process.execPath, [join(root, 'tests', 'platform-http.acceptance.mjs')], { cwd: root, env: { ...env, PAINTER_PLATFORM_TEST_URL: base, PAINTER_PLATFORM_EXPECTED_REASON: runtime === 'local' ? 'local_runtime' : 'not_configured' }, stdio: 'inherit', shell: false });
    harnessState = observe(harness); await waitForHarness(harnessState, 90000);
    if (interrupted) throw new Error('PLATFORM_ACCEPTANCE_INTERRUPTED');
  } finally {
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    try { await stop(harness, harnessState); } finally { try { await stop(server, serverState); } finally { await removeOwnedDirectory(parent, directory); } }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runPlatformHttpAcceptance('local').then(() => runPlatformHttpAcceptance('unconfigured')).catch(error => { console.error(error.message); process.exitCode = 1; });
}
