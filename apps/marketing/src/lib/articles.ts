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
