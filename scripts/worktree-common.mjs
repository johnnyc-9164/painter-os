import { spawnSync } from 'node:child_process';
import { realpathSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repository = realpathSync(fileURLToPath(new URL('..', import.meta.url)));
export function run(command, args, cwd = repository, capture = false) {
  const result = spawnSync(command, args, { cwd, encoding: 'utf8', stdio: capture ? 'pipe' : 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`${command} failed (${result.status}): ${result.stderr ?? ''}`);
  return result.stdout?.trim() ?? '';
}
export function targetPath(value) {
  if (!value || value.startsWith('-')) throw new Error('Provide an explicit worktree path.');
  return resolve(process.cwd(), value);
}
export function fail(error) {
  console.error(error.message);
  process.exitCode = 1;
}
