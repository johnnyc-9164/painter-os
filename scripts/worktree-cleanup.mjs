import { realpathSync } from 'node:fs';
import { repository, run, targetPath, fail } from './worktree-common.mjs';

try {
  const args = process.argv.slice(2);
  if (args.includes('--help')) {
    console.log('Usage: node scripts/worktree-cleanup.mjs <path> [--execute]\nDefaults to dry run. Stop worktree processes first. Branches are retained.');
  } else {
    const execute = args.includes('--execute');
    const positional = args.filter((arg) => arg !== '--execute');
    if (positional.length !== 1) throw new Error('Expected exactly one worktree path and optional --execute.');
    const target = realpathSync(targetPath(positional[0]));
    const records = run('git', ['worktree', 'list', '--porcelain', '-z'], repository, true).split('\0\0').map((record) => record.split('\0'));
    const registered = records.find((record) => record.includes(`worktree ${target}`));
    const primary = records[0]?.find((line) => line.startsWith('worktree '))?.slice(9);
    if (!registered || target === primary || target === repository) throw new Error('Only another registered linked worktree can be removed.');
    if (registered.some((line) => line.startsWith('locked'))) throw new Error('Worktree is locked.');
    const attempt = (args) => { try { return run('git', args, target, true); } catch { return null; } };
    const branch = attempt(['symbolic-ref', '--short', '-q', 'HEAD']);
    if (!branch) throw new Error('Worktree has a detached HEAD; create or push a branch first.');
    const originHead = attempt(['symbolic-ref', '--short', '-q', 'refs/remotes/origin/HEAD'])?.replace(/^origin\//, '');
    if (branch === originHead || (!originHead && ['main', 'master'].includes(branch))) throw new Error(`Refusing the repository default branch ${branch}.`);
    if (attempt(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{upstream}']) === null) throw new Error(`Branch ${branch} has no upstream; push it first.`);
    if (attempt(['rev-list', '--count', '@{upstream}..HEAD']) !== '0') throw new Error(`Branch ${branch} has commits not on its upstream; push them first.`);
    if (run('git', ['status', '--porcelain', '--untracked-files=all'], target, true)) throw new Error('Worktree has tracked changes or untracked files; preserve them first.');
    const ignored = run('git', ['ls-files', '--others', '--ignored', '--exclude-standard', '-z'], target, true).split('\0').filter(Boolean);
    const disposable = /(^|\/)(node_modules|\.next|\.turbo)\//;
    if (ignored.some((path) => !disposable.test(path))) throw new Error('Worktree contains ignored data outside dependency/build caches. Archive evidence, local data and configuration outside the worktree first.');
    console.log(`${execute ? 'Removing' : 'Would remove'} ${target}; branch retained. Stop its processes before removal.`);
    if (execute) run('git', ['worktree', 'remove', target]);
  }
} catch (error) { fail(error); }
