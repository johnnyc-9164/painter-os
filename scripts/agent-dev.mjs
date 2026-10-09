import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { root, assertNoEnvFiles, createRun, unusedPort, spawnNext, observe, stop, waitForReady, gitState, writeJson } from './agent-common.mjs';

await assertNoEnvFiles();
const directory = await createRun('dev');
const base = `http://127.0.0.1:${await unusedPort()}`;
const log = createWriteStream(join(directory, 'server.log'), { mode: 0o600 });
const server = spawnNext('dev', base, directory, ['ignore', 'pipe', 'pipe']);
const state = observe(server);
server.stdout.pipe(log, { end: false }); server.stderr.pipe(log, { end: false });
const interrupt = () => server.kill('SIGTERM');
process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
let receipt = { ...gitState(), root, base, pid: server.pid, runtime: 'local', status: 'starting' };
try {
  const started = performance.now();
  await waitForReady(base, state, 120_000);
  receipt = { ...receipt, status: 'running', startupMs: Math.round(performance.now() - started) };
  await writeJson(join(directory, 'run.json'), receipt);
  console.log(JSON.stringify({ base, directory, log: join(directory, 'server.log'), runtime: 'local synthetic acceptance only', stop: 'Ctrl-C; retain this run directory only as long as needed, then remove it after stopping the server.' }, null, 2));
  const result = await state.finished;
  if (result.error || result.code && result.code !== 0) process.exitCode = 1;
} finally {
  await stop(server, state);
  await writeJson(join(directory, 'run.json'), { ...receipt, status: 'stopped' });
  process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
  await new Promise(resolve => log.end(resolve));
}
