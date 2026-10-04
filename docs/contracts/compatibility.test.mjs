import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { test } from 'node:test';
import { depositView } from './compatibility.ts';
const root = new URL('../../', import.meta.url);
const source = path => readFileSync(new URL(path, root), 'utf8');
test('deposit receipt and satisfaction remain distinct, including zero requirement', () => {
  assert.deepEqual(depositView(0, 0), { requiredCents: 0, receivedCents: 0, remainingCents: 0, status: 'not_required' });
  assert.equal(depositView(10000, 0).status, 'unpaid');
  assert.deepEqual(depositView(10000, 1), { requiredCents: 10000, receivedCents: 1, remainingCents: 9999, status: 'partial' });
  assert.equal(depositView(10000, 10000).status, 'satisfied');
  assert.equal(depositView(1e12, 1e12).remainingCents, 0);
});
test('deposit model rejects unsafe money and overpayment', () => {
  for (const invalid of [-1, 0.5, NaN, Infinity, 1e12 + 1, Number.MAX_SAFE_INTEGER + 1, '10']) {
    assert.throws(() => depositView(invalid, 0), /INVALID_DEPOSIT_CENTS/);
    assert.throws(() => depositView(10, invalid), /INVALID_DEPOSIT_CENTS/);
  }
  assert.throws(() => depositView(0, 1), /DEPOSIT_OVERPAYMENT/);
});
test('freeze links resolve to actual tracked source', () => {
  const document = source('docs/contracts/issue-2-freeze.md');
  for (const match of document.matchAll(/`((?:packages|apps|docs)\/[A-Za-z0-9_./-]+\.(?:ts|md))`/g)) {
    assert.ok(existsSync(new URL(match[1], root)), match[1]);
  }
});
test('source boundary remains mounted and explicitly unmirrored', () => {
  const config = source('packages/backend/convex/convex.config.ts');
  assert.deepEqual([...config.matchAll(/app\.use\((\w+)\)/g)].map(m => m[1]), ['betterAuth', 'contractorOs', 'painting']);
  const painter = source('packages/backend/convex/painter.ts');
  assert.match(painter, /not a projection of painterEntities/);
  assert.match(painter, /safeGetAuthUser/);
  assert.match(painter, /painterMembers/);
  assert.match(source('packages/contractor-os-core/src/shared/business.ts'), /SIGNED_CONTRACT_REQUIRED/);
});
