import test from 'node:test';
import assert from 'node:assert/strict';
import { createPublishedArticlePageReader } from '../packages/public-content/index.mjs';
import { decodePublishedArticlePage } from '../packages/backend/published-articles.mjs';

const summary = { id: 'a', title: 'Paint', slug: 'paint', excerpt: 'Prep.', publishedAt: '2026-10-09' };
test('page transport binds workspace and continuation, strips full content and private fields', async () => {
  const requests = [];
  const read = createPublishedArticlePageReader(async args => {
    requests.push(args);
    return { page: [{ ...summary, content: 'full body secret', tenantId: 'secret', privateNotes: 'private' }], isDone: args.cursor !== null, continueCursor: args.cursor === null ? 'next' : null };
  });
  const first = await read('a');
  assert.deepEqual(first, { page: [summary], isDone: false, continueCursor: 'next' });
  assert.equal((await read('a', first.continueCursor)).isDone, true);
  assert.deepEqual(requests, [{ workspaceId: 'a', cursor: null, limit: 10 }, { workspaceId: 'a', cursor: 'next', limit: 10 }]);
});
test('malformed and oversized page data cannot masquerade as complete published content', () => {
  for (const value of [null, [], { page: [summary], isDone: true, continueCursor: 'hidden next' }, { page: [summary], isDone: false, continueCursor: null }, { page: Array(21).fill(summary), isDone: true, continueCursor: null }, { page: [{ ...summary, excerpt: 'x'.repeat(301) }], isDone: true, continueCursor: null }]) {
    assert.throws(() => decodePublishedArticlePage(value), /INVALID_PUBLIC_ARTICLE/);
  }
});
