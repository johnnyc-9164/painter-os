import { it, expect, vi } from 'vitest';
import { ConvexError } from 'convex/values';
const query = vi.hoisted(() => vi.fn());
vi.mock('convex/browser', () => ({ ConvexHttpClient: class { query = query; } }));
import { readJournalArticles } from '../../../apps/marketing/src/lib/articles';

it('route loader maps only the exact typed workspace error to notFound', async () => {
  vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://example.convex.cloud');
  const missing = vi.fn((): never => { throw new Error('TEST_NOT_FOUND'); });
  query.mockRejectedValueOnce(new ConvexError('PUBLIC_WORKSPACE_NOT_FOUND'));
  await expect(readJournalArticles('invalid', undefined, missing)).rejects.toThrow('TEST_NOT_FOUND');
  expect(missing).toHaveBeenCalledTimes(1);
  for (const error of [new Error('PUBLIC_WORKSPACE_NOT_FOUND'), new Error('network timeout'), new ConvexError('OTHER_APPLICATION_ERROR'), { data: 'PUBLIC_WORKSPACE_NOT_FOUND' }]) {
    missing.mockClear();
    query.mockRejectedValueOnce(error);
    await expect(readJournalArticles('invalid', undefined, missing)).rejects.toBe(error);
    expect(missing).not.toHaveBeenCalled();
  }
  vi.unstubAllEnvs();
});

it('route loader preserves valid empty responses and configuration/DTO failures', async () => {
  vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', 'https://example.convex.cloud');
  const missing = vi.fn((): never => { throw new Error('TEST_NOT_FOUND'); });
  query.mockResolvedValueOnce([]);
  await expect(readJournalArticles('valid', undefined, missing)).resolves.toEqual([]);
  query.mockResolvedValueOnce([{ privateNotes: 'not a DTO' }]);
  await expect(readJournalArticles('valid', undefined, missing)).rejects.toThrow('INVALID_PUBLIC_ARTICLE');
  vi.stubEnv('NEXT_PUBLIC_CONVEX_URL', '');
  await expect(readJournalArticles('valid', undefined, missing)).rejects.toThrow('PUBLIC_CONTENT_NOT_CONFIGURED');
  expect(missing).not.toHaveBeenCalled();
  vi.unstubAllEnvs();
});
