import { ConvexError } from 'convex/values';
import { ConvexHttpClient } from 'convex/browser';
import { makeFunctionReference } from 'convex/server';
import { decodePublishedArticles, publishedArticlesFunction, decodePublishedArticlePage, publishedArticlePageFunction, publicArticlePageSize } from '@painter-os-bts/backend/published-articles.mjs';

const publishedArticles = makeFunctionReference(publishedArticlesFunction);

/** Read-only transport seam. Every response passes the existing public DTO decoder. */
export function createPublishedArticleReader(query) {
  return async (workspaceId, slug) => {
    const args = slug === undefined ? { workspaceId } : { workspaceId, slug };
    return decodePublishedArticles(await query(args));
  };
}

export async function readPublishedArticles(url, workspaceId, slug) {
  if (!url) throw new Error('PUBLIC_CONTENT_NOT_CONFIGURED');
  return createPublishedArticleReader(args => new ConvexHttpClient(url).query(publishedArticles, args))(workspaceId, slug);
}

/** Only the public query's typed invalid-workspace error is a missing route. */
export async function readJournalArticles(url, workspaceId, slug, missing) {
  try {
    return await readPublishedArticles(url, workspaceId, slug);
  } catch (error) {
    if (error instanceof ConvexError && error.data === 'PUBLIC_WORKSPACE_NOT_FOUND') missing();
    throw error;
  }
}


export function createPublishedArticlePageReader(query) {
  return async (workspaceId, cursor = null) => decodePublishedArticlePage(await query({ workspaceId, cursor, limit: publicArticlePageSize }));
}

export async function readPublishedArticlePage(url, workspaceId, cursor = null) {
  if (!url) throw new Error('PUBLIC_CONTENT_NOT_CONFIGURED');
  const reference = makeFunctionReference(publishedArticlePageFunction);
  return createPublishedArticlePageReader(args => new ConvexHttpClient(url).query(reference, args))(workspaceId, cursor);
}

export async function readJournalArticlePage(url, workspaceId, cursor, missing) {
  try { return await readPublishedArticlePage(url, workspaceId, cursor); }
  catch (error) {
    if (error instanceof ConvexError && error.data === 'PUBLIC_WORKSPACE_NOT_FOUND') missing();
    throw error;
  }
}
