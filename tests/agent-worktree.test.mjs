import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, copyFileSync, writeFileSync, rmSync } from 'node:fs';
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
    assert.equal(script('cleanup', target).status, 0);
    assert.equal(call('git', ['-C', target, 'status']).status, 0);
    assert.notEqual(script('cleanup', repo, '--execute').status, 0);
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
