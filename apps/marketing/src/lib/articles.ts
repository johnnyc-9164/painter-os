import { ConvexError } from 'convex/values';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { decodePublishedArticles, publishedArticlesFunction } from '@painter-os-bts/backend/published-articles.mjs';

const publishedArticles = makeFunctionReference<'query', { workspaceId: string; slug?: string }, unknown>(publishedArticlesFunction);

export async function readPublishedArticles(workspaceId: string, slug?: string) {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error('PUBLIC_CONTENT_NOT_CONFIGURED');
  const args = slug === undefined ? { workspaceId } : { workspaceId, slug };
  return decodePublishedArticles(await new ConvexHttpClient(url).query(publishedArticles, args));
}

/** Only the public query's typed invalid-workspace error is a missing route. */
export async function readJournalArticles(workspaceId: string, slug: string | undefined, missing: () => never) {
  try {
    return await readPublishedArticles(workspaceId, slug);
  } catch (error) {
    if (error instanceof ConvexError && error.data === 'PUBLIC_WORKSPACE_NOT_FOUND') missing();
    throw error;
  }
}
