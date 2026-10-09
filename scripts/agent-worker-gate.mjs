import { lstat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join } from 'node:path';

/** Metadata-only refusal: Wrangler prefers legacy home config over XDG when present. */
export async function assertNoLegacyWranglerConfig(path = join(homedir(), '.wrangler')) {
  try { await lstat(path); }
  catch (error) { if (error.code === 'ENOENT') return; throw error; }
  throw new Error('LEGACY_WRANGLER_CONFIG_PRESENT: Worker verification requires an isolated runner without legacy .wrangler configuration. Files were not read or changed.');
}

/** Only the local Worker gate receives owned config/log paths; no global environment is changed. */
export function workerGateEnvironment(name, env, directory) {
  return name === 'worker-local-runtime' ? { ...env, XDG_CONFIG_HOME: directory, WRANGLER_LOG_PATH: join(directory, 'wrangler.log'), WRANGLER_SEND_METRICS: 'false' } : env;
}
