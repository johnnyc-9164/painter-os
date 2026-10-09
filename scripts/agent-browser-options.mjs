import { access, realpath, stat } from 'node:fs/promises';
import { constants } from 'node:fs';
import { isAbsolute } from 'node:path';

export async function browserLaunchOptions(source = process.env) {
  const options = { headless: true, chromiumSandbox: true };
  const selected = source.PAINTER_AGENT_CHROMIUM_EXECUTABLE;
  if (selected === undefined) return options;
  if (!isAbsolute(selected)) throw new Error('INVALID_CHROMIUM_EXECUTABLE: expected an absolute executable file path');
  try {
    const path = await realpath(selected);
    if (!(await stat(path)).isFile()) throw new Error('not a file');
    await access(path, constants.X_OK);
    options.executablePath = path;
  } catch {
    throw new Error('INVALID_CHROMIUM_EXECUTABLE: expected an existing executable file');
  }
  return options;
}

export function requestJsonLines(spans) {
  return spans.map(span => JSON.stringify(span)).join('\n') + (spans.length ? '\n' : '');
}

export function browserGateEnvironment(name, env, source = process.env) {
  return name === 'browser' && source.PAINTER_AGENT_CHROMIUM_EXECUTABLE !== undefined
    ? { ...env, PAINTER_AGENT_CHROMIUM_EXECUTABLE: source.PAINTER_AGENT_CHROMIUM_EXECUTABLE }
    : env;
}
