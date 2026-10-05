import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { createServer } from 'node:net';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { observe, stop, waitForHarness, removeOwnedDirectory } from './run-http-acceptance.mjs';
import { publicAdminOrigin } from '../packages/backend/published-articles.mjs';
const root = fileURLToPath(new URL('../', import.meta.url));
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

export function marketingEnvironment(source, directory) {
  const env = {};
  for (const key of ['PATH', 'Path', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'CI', 'TZ']) if (source[key] !== undefined) env[key] = source[key];
  return { ...env, NODE_ENV: 'production', NEXT_TELEMETRY_DISABLED: '1', HOME: directory, USERPROFILE: directory };
}
async function unusedPort() {
  const reservation = createServer();
  await new Promise((resolve, reject) => { reservation.once('error', reject); reservation.listen(0, '127.0.0.1', resolve); });
  const port = reservation.address().port;
  await new Promise((resolve, reject) => reservation.close(error => error ? reject(error) : resolve()));
  return port;
}
async function ready(base, state) {
  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (state.ended) throw new Error('MARKETING_EXITED_BEFORE_READY', { cause: state.result?.error });
    try {
      const response = await fetch(base, { redirect: 'error', signal: AbortSignal.timeout(500) });
      if (response.status === 200) return;
    } catch { /* Poll only to the fixed deadline. */ }
    await pause(100);
  }
  throw new Error('MARKETING_READINESS_TIMEOUT');
}
export async function runMarketingHttpAcceptance(expectedAdminOrigin = null) {
  const expected = publicAdminOrigin(expectedAdminOrigin ?? undefined);
  const parent = resolve(process.env.RUNNER_TEMP || tmpdir());
  const directory = await mkdtemp(join(parent, 'painter-http-marketing-'));
  let server, serverState, harness, harnessState;
  let interrupted = false;
  const interrupt = () => { interrupted = true; harness?.kill('SIGTERM'); server?.kill('SIGTERM'); };
  process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
  try {
    const base = `http://127.0.0.1:${await unusedPort()}`;
    const env = marketingEnvironment(process.env, directory);
    const marketing = join(root, 'apps', 'marketing');
    const nextBin = createRequire(import.meta.url).resolve('next/dist/bin/next', { paths: [marketing] });
    server = spawn(process.execPath, [nextBin, 'start', '--hostname', '127.0.0.1', '--port', new URL(base).port], { cwd: marketing, env, stdio: 'inherit', shell: false });
    serverState = observe(server);
    await ready(base, serverState);
    if (interrupted) throw new Error('MARKETING_ACCEPTANCE_INTERRUPTED');
    harness = spawn(process.execPath, [join(root, 'tests', 'marketing-http.acceptance.mjs')], { cwd: root, env: { ...env, PAINTER_MARKETING_TEST_URL: base, PAINTER_EXPECTED_BUILD_ADMIN_ORIGIN: expected || '' }, stdio: 'inherit', shell: false });
    harnessState = observe(harness);
    await waitForHarness(harnessState, 90_000);
    if (interrupted) throw new Error('MARKETING_ACCEPTANCE_INTERRUPTED');
  } finally {
    process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
    try { await stop(harness, harnessState); } finally {
      try { await stop(server, serverState); } finally { await removeOwnedDirectory(parent, directory); }
    }
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length > 3) throw new Error('EXPECTED_ONLY_OPTIONAL_BUILD_ADMIN_ORIGIN');
  runMarketingHttpAcceptance(process.argv[2] || null).catch(error => { console.error(error.message); process.exitCode = 1; });
}
