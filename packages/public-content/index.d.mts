import type { PublishedArticle } from '@painter-os-bts/backend/published-articles.mjs';
export type { PublishedArticle } from '@painter-os-bts/backend/published-articles.mjs';
export interface PublishedArticleQuery { workspaceId: string; slug?: string }
export declare function createPublishedArticleReader(query: (args: PublishedArticleQuery) => Promise<unknown>): (workspaceId: string, slug?: string) => Promise<PublishedArticle[]>;
export declare function readPublishedArticles(url: string | undefined, workspaceId: string, slug?: string): Promise<PublishedArticle[]>;
export declare function readJournalArticles(url: string | undefined, workspaceId: string, slug: string | undefined, missing: () => never): Promise<PublishedArticle[]>;
