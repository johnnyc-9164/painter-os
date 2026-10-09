import { createRequire } from 'node:module';
import { readFileSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { root, web, assertNoEnvFiles } from './agent-common.mjs';

const failures = [];
const pkg = JSON.parse(readFileSync(join(root, 'package.json')));
const npm = process.env.npm_execpath;
const version = npm ? execFileSync(process.execPath, [npm, '--version'], { encoding: 'utf8' }).trim() : null;
const required = pkg.packageManager.split('@')[1].split('.').map(Number);
const installed = (version || '0.0.0').split('.').map(Number);
if (Number(process.versions.node.split('.')[0]) < 24) failures.push('Install Node 24 or newer (node:sqlite is required).');
if (installed[0] < required[0] || installed[0] === required[0] && (installed[1] < required[1] || installed[1] === required[1] && installed[2] < required[2])) failures.push(`Use npm >=${pkg.packageManager.split('@')[1]}; run this doctor through npm.`);
try {
  const require = createRequire(import.meta.url);
  const next = require.resolve('next/package.json', { paths: [web] });
  const docs = join(next, '../dist/docs/01-app/03-api-reference/06-cli/next.md');
  if (!existsSync(docs)) failures.push('Installed Next CLI guide missing; inspect the installed package before changing Next behavior.');
  require.resolve('tsx'); require.resolve('@playwright/test');
} catch { failures.push('Run npm ci --ignore-scripts at the repository root.'); }
try { execFileSync('python3', ['--version'], { stdio: 'ignore' }); execFileSync('jq', ['--version'], { stdio: 'ignore' }); } catch { failures.push('Install python3 and jq for the existing Contractor OS verifier.'); }
try { await assertNoEnvFiles(); } catch (error) { failures.push(error.message); }
console.log(JSON.stringify({ node: process.versions.node, npm: version, required: pkg.engines, failures, browser: 'Install separately with npx playwright install chromium; browser verification reports an explicit failure if sandbox/browser is unavailable.' }, null, 2));
if (failures.length) process.exitCode = 1;
