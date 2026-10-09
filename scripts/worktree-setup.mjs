import { existsSync } from 'node:fs';
import { repository, run, targetPath, fail } from './worktree-common.mjs';

try {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: node scripts/worktree-setup.mjs <path> <new-branch> [base-ref] [--skip-install]\nDefault base: HEAD. Installs isolated dependencies and runs agent:doctor. No fetch or provider setup.');
  } else {
    const skipInstall = args.includes('--skip-install');
    const positional = args.filter((arg) => arg !== '--skip-install');
    if (positional.length < 2 || positional.length > 3 || positional.some((arg) => arg.startsWith('-'))) throw new Error('Expected <path> <new-branch> [base-ref] [--skip-install].');
    const [value, branch, base = 'HEAD'] = positional;
    const target = targetPath(value);
    if (existsSync(target)) throw new Error('Target already exists; refusing to reuse it.');
    run('git', ['check-ref-format', '--branch', branch]);
    run('git', ['rev-parse', '--verify', `${base}^{commit}`], repository, true);
    // Git refuses existing branches; no reset, environment copy, or shared caches.
    run('git', ['worktree', 'add', '-b', branch, target, base]);
    console.log(`Created ${target} on ${branch}.`);
    if (!skipInstall) {
      const npm = process.env.npm_execpath;
      const command = npm ? process.execPath : 'npm';
      const prefix = npm ? [npm] : [];
      const version = run(command, [...prefix, '--version'], target, true).split('.').map(Number);
      if (Number(process.versions.node.split('.')[0]) < 24 || version[0] < 11 || (version[0] === 11 && version[1] < 16)) throw new Error(`Use Node 24+ and npm 11.16+; worktree retained at ${target}.`);
      run(command, [...prefix, 'ci', '--ignore-scripts'], target);
      run(command, [...prefix, 'run', 'agent:doctor'], target);
    }
  }
} catch (error) { fail(error); }
