import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { root } from './agent-common.mjs';

const paths = ['apps/web/next-env.d.ts', 'apps/marketing/next-env.d.ts', 'apps/web/tsconfig.json', 'apps/marketing/tsconfig.json'];
const declaration = '/// <reference types="next" />\n/// <reference types="next/image-types/global" />\nimport "./.next/types/routes.d.ts";\nimport "./.next/types/root-params.d.ts";\n\n// NOTE: This file should not be edited\n// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.\n';

export function allowedNextRewrite(path, before, after) {
  if (before === after) return true;
  if (path.endsWith('/next-env.d.ts')) return after === declaration;
  if (!path.endsWith('/tsconfig.json')) return false;
  try {
    const expected = JSON.parse(before);
    // These are the installed Next's automatic compiler defaults, not arbitrary compiler edits.
    if (expected.compilerOptions.allowJs === undefined) expected.compilerOptions.allowJs = true;
    if (expected.compilerOptions.incremental === undefined) expected.compilerOptions.incremental = true;
    if (!expected.include.includes('.next/dev/types/**/*.ts')) expected.include.push('.next/dev/types/**/*.ts');
    return isDeepStrictEqual(expected, JSON.parse(after));
  } catch { return false; }
}

export async function captureNextArtifacts() {
  return Object.fromEntries(await Promise.all(paths.map(async path => [path, await readFile(join(root, path), 'utf8')])));
}

export async function restoreOwnedNextArtifacts(before) {
  const changes = [];
  for (const [path, original] of Object.entries(before)) {
    const current = await readFile(join(root, path), 'utf8');
    if (current === original) continue;
    if (!allowedNextRewrite(path, original, current)) throw new Error(`UNEXPECTED_NEXT_ARTIFACT_EDIT: ${path}; no files restored.`);
    changes.push(path);
  }
  // Inspect every candidate before writing any; the isolated, initially clean run owns only these recognized generated edits.
  for (const path of changes) await writeFile(join(root, path), before[path]);
  return changes;
}
