import { join } from 'node:path';
import { readdir } from 'node:fs/promises';

export async function verificationGates({ root, npmCli, browser = false }) {
return [
  ['doctor', [npmCli, 'run', 'agent:doctor']],
  ['agent-check', [npmCli, 'run', 'agent:check']],
  ['agent-tests', [npmCli, 'run', 'test:agent']],
  ['typecheck', [npmCli, 'run', 'check-types']],
  ['lint', [npmCli, 'run', 'lint']],
  // Same root TS test files as npm test; Node's loader avoids the CLI's optional Unix IPC server.
  ['domain-tests', ['--import', 'tsx', '--test', ...(await readdir(join(root, 'tests'))).filter(name => name.endsWith('.test.ts')).sort().map(name => `tests/${name}`)]],
  ['node-tests', ['--test', ...(await readdir(join(root, 'tests'))).filter(name => name.endsWith('.test.mjs') && name !== 'agent-harness.test.mjs').sort().map(name => `tests/${name}`)]],
  // JSX form suites use their existing automatic-JSX Vitest runner.
  ['forms-tests', [npmCli, 'run', 'test:forms']],
  // Repository policy tests live outside the root tests directory.
  ['factory-tests', ['--test', '.github/factory/contract.test.mjs']],
  ['convex-tests', [npmCli, 'run', 'test:convex']],
  // Includes dry production/fixture builds and actual local workerd/SQLite tests.
  ['worker-local-runtime', [npmCli, 'run', 'test:agent-worker']],
  ['web-build', [npmCli, 'run', 'build']],
  ['compatibility', ['--test', 'docs/contracts/compatibility.test.mjs']],
  ['platform-render', [join(root, 'node_modules/vitest/vitest.mjs'), 'run', '--config', 'vitest.platform.config.ts']],
  ['contractor-component', [npmCli, 'run', 'verify:all', '--workspace', '@johnny/contractor-os-core']],
  ['marketing-build', [npmCli, 'run', 'build:marketing']],
  ['company-site-build', [npmCli, 'run', 'build:company-site']],
  ['platform-admin-build', [npmCli, 'run', 'build:platform-admin']],
  ['http', ['scripts/run-http-acceptance.mjs']],
  ['marketing-http', ['scripts/run-marketing-http-acceptance.mjs']],
  ['company-site-http', [npmCli, 'run', 'test:http:company-site']],
  ['platform-admin-http', ['scripts/run-platform-admin-http-acceptance.mjs']],
  ['platform-http', ['scripts/run-platform-http-acceptance.mjs']],
  ...(browser ? [['browser', ['scripts/agent-browser.mjs']]] : []),
];
}
