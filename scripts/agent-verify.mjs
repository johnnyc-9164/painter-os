import { spawn } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { readdir } from 'node:fs/promises';
import { root, assertNoEnvFiles, createRun, verificationEnvironment, gitState, writeJson, observe, stop } from './agent-common.mjs';
import { captureNextArtifacts, restoreOwnedNextArtifacts } from './agent-generated.mjs';

const browser = process.argv.includes('--browser');
if (process.argv.slice(2).some(arg => arg !== '--browser')) throw new Error('ONLY_SUPPORTED_OPTION_IS_--browser');
await assertNoEnvFiles();
const npmCli = process.env.npm_execpath;
if (!npmCli) throw new Error('RUN_THROUGH_NPM');
const directory = await createRun('verify');
const initial = gitState();
if (initial.dirty) throw new Error('CLEAN_CHECKOUT_REQUIRED: commit the scoped change before producing exact-head acceptance evidence.');
const generatedBefore = await captureNextArtifacts();
const env = verificationEnvironment();
const gates = [
  ['doctor', [npmCli, 'run', 'agent:doctor']],
  ['agent-check', [npmCli, 'run', 'agent:check']],
  ['agent-tests', [npmCli, 'run', 'test:agent']],
  ['typecheck', [npmCli, 'run', 'check-types']],
  ['lint', [npmCli, 'run', 'lint']],
  // Same root TS test files as npm test; Node's loader avoids the CLI's optional Unix IPC server.
  ['domain-tests', ['--import', 'tsx', '--test', ...(await readdir(join(root, 'tests'))).filter(name => name.endsWith('.test.ts')).sort().map(name => `tests/${name}`)]],
  ['node-tests', ['--test', ...(await readdir(join(root, 'tests'))).filter(name => name.endsWith('.test.mjs') && name !== 'agent-harness.test.mjs').sort().map(name => `tests/${name}`)]],
  ['convex-tests', [npmCli, 'run', 'test:convex']],
  ['web-build', [npmCli, 'run', 'build']],
  ['compatibility', ['--test', 'docs/contracts/compatibility.test.mjs']],
  ['platform-render', [join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'vitest.platform.config.ts']],
  ['contractor-component', [npmCli, 'run', 'verify:all', '--workspace', '@johnny/contractor-os-core']],
  ['marketing-build', [npmCli, 'run', 'build:marketing']],
  ['http', ['scripts/run-http-acceptance.mjs']],
  ['marketing-http', ['scripts/run-marketing-http-acceptance.mjs']],
  ['platform-http', ['scripts/run-platform-http-acceptance.mjs']],
  ...(browser ? [['browser', ['scripts/agent-browser.mjs']]] : []),
];
const results = [];
let child, state, interrupted = false;
const interrupt = () => { interrupted = true; child?.kill('SIGTERM'); };
process.once('SIGINT', interrupt); process.once('SIGTERM', interrupt);
try {
  for (const [name, args] of gates) {
    if (interrupted) throw new Error('VERIFICATION_INTERRUPTED');
    console.log(`Running ${name}; logs: ${directory}`);
    const log = createWriteStream(join(directory, `${name}.log`), { mode: 0o600 });
    const started = performance.now();
    child = spawn(process.execPath, args, { cwd: root, env, stdio: ['ignore', 'pipe', 'pipe'], shell: false }); state = observe(child);
    child.stdout.pipe(log, { end: false }); child.stderr.pipe(log, { end: false });
    let timer;
    try {
      const result = await Promise.race([state.finished, new Promise(resolve => { timer = setTimeout(() => resolve({ timeout: true }), 15 * 60_000); })]);
      const status = result.timeout ? 'timeout' : result.error || result.code !== 0 ? 'failed' : 'passed';
      results.push({ name, command: [process.execPath, ...args], status, exitCode: result.code, durationMs: Math.round(performance.now() - started) });
      if (status !== 'passed') throw new Error(`GATE_${status.toUpperCase()}: ${name}; inspect ${join(directory, `${name}.log`)}`);
    } finally { clearTimeout(timer); await stop(child, state); await new Promise(resolve => log.end(resolve)); }
  }
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally {
  process.removeListener('SIGINT', interrupt); process.removeListener('SIGTERM', interrupt);
  let restored = [];
  try { restored = await restoreOwnedNextArtifacts(generatedBefore); }
  catch (error) { process.exitCode = 1; results.push({ name: 'generated-artifact-restoration', status: 'failed', reason: error.message }); }
  const current = gitState();
  if (current.head !== initial.head || current.dirty) { process.exitCode = 1; results.push({ name: 'source-stability', status: 'failed', reason: 'Head or tracked/untracked source changed during verification.' }); }
  await writeJson(join(directory, 'receipt.json'), { ...initial, final: current, generatedArtifactsRestored: restored, status: process.exitCode ? 'failed' : 'passed', browser: browser ? 'requested' : 'not requested', runtime: 'local synthetic only', results });
  console.log(`Verification receipt: ${join(directory, 'receipt.json')}`);
}
