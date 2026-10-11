import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('worktree lifecycle preserves dirty work, ignored evidence and branches', () => {
  const root = mkdtempSync(join(tmpdir(), 'painter-worktrees-'));
  const repo = join(root, 'repo');
  const target = join(root, 'task');
  mkdirSync(join(repo, 'scripts'), { recursive: true });
  const call = (command, args, cwd = repo) => spawnSync(command, args, { cwd, encoding: 'utf8' });
  const git = (...args) => assert.equal(call('git', args).status, 0);
  try {
    for (const name of ['common', 'setup', 'cleanup']) copyFileSync(new URL(`../scripts/worktree-${name}.mjs`, import.meta.url), join(repo, 'scripts', `worktree-${name}.mjs`));
    writeFileSync(join(repo, '.gitignore'), 'node_modules/\n.agent/\n');
    git('init'); git('config', 'user.email', 'test@example.invalid'); git('config', 'user.name', 'Test'); git('add', '.'); git('commit', '-m', 'fixture');
    const script = (name, ...args) => call(process.execPath, [`scripts/worktree-${name}.mjs`, ...args]);
    assert.equal(script('setup', target, 'task', '--skip-install').status, 0);
    assert.notEqual(script('setup', target, 'task', '--skip-install').status, 0);
    assert.notEqual(script('cleanup', target).status, 0); // new branch: no upstream yet
    assert.equal(call('git', ['-C', target, 'status']).status, 0);
    assert.notEqual(script('cleanup', repo, '--execute').status, 0);
    // Path containment, default branch, no upstream and unpushed-commit refusals.
    const refusal = (...args) => { const r = script('cleanup', ...args); assert.notEqual(r.status, 0); return r.stderr; };
    const outside = join(root, 'outside');
    mkdirSync(outside);
    symlinkSync(outside, join(root, 'link'));
    assert.match(refusal(join(root, 'link'), '--execute'), /registered linked worktree/);
    assert.match(refusal(outside, '--execute'), /registered linked worktree/);
    assert.match(refusal(join(target, 'scripts'), '--execute'), /registered linked worktree|ENOENT/);
    const remote = join(root, 'remote.git');
    assert.equal(call('git', ['init', '--bare', remote]).status, 0);
    git('remote', 'add', 'origin', remote);
    assert.match(refusal(target, '--execute'), /no upstream/);
    const defaultBranch = call('git', ['symbolic-ref', '--short', 'HEAD']).stdout.trim();
    git('push', 'origin', defaultBranch);
    const defaultTarget = join(root, 'default');
    git('checkout', '--detach');
    git('worktree', 'add', defaultTarget, defaultBranch);
    git('branch', '--set-upstream-to', `origin/${defaultBranch}`, defaultBranch);
    assert.match(refusal(defaultTarget, '--execute'), /default branch/);
    git('worktree', 'remove', defaultTarget);
    git('checkout', defaultBranch);
    assert.equal(call('git', ['push', '--set-upstream', 'origin', 'task'], target).status, 0);
    writeFileSync(join(target, 'ahead'), 'x');
    assert.equal(call('git', ['add', 'ahead'], target).status, 0);
    assert.equal(call('git', ['commit', '-m', 'ahead'], target).status, 0);
    assert.match(refusal(target, '--execute'), /not on its upstream/);
    assert.equal(call('git', ['push'], target).status, 0);
    assert.equal(script('cleanup', target).status, 0);
    writeFileSync(join(target, 'unsaved'), 'keep');
    assert.notEqual(script('cleanup', target, '--execute').status, 0);
    rmSync(join(target, 'unsaved'));
    mkdirSync(join(target, '.agent'));
    writeFileSync(join(target, '.agent', 'receipt.json'), '{}');
    assert.notEqual(script('cleanup', target, '--execute').status, 0);
    rmSync(join(target, '.agent'), { recursive: true });
    mkdirSync(join(target, 'node_modules'));
    writeFileSync(join(target, 'node_modules', 'cache'), 'disposable');
    assert.equal(script('cleanup', target, '--execute').status, 0);
    git('show-ref', '--verify', 'refs/heads/task');
  } finally { rmSync(root, { recursive: true, force: true }); }
});
