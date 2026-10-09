import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
test('intake components render with the installed JSX runner', () => {
  const result = spawnSync(process.execPath, ['node_modules/vitest/vitest.mjs', 'run', '--config', 'vitest.intake.config.ts'], {cwd: new URL('../', import.meta.url), encoding: 'utf8', timeout: 60000});
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`);
});
