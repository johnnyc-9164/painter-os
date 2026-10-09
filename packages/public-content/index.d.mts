import type { PublishedArticle } from '@painter-os-bts/backend/published-articles.mjs';
export type { PublishedArticle } from '@painter-os-bts/backend/published-articles.mjs';
export interface PublishedArticleQuery { workspaceId: string; slug?: string }
export declare function createPublishedArticleReader(query: (args: PublishedArticleQuery) => Promise<unknown>): (workspaceId: string, slug?: string) => Promise<PublishedArticle[]>;
export declare function readPublishedArticles(url: string | undefined, workspaceId: string, slug?: string): Promise<PublishedArticle[]>;
export declare function readJournalArticles(url: string | undefined, workspaceId: string, slug: string | undefined, missing: () => never): Promise<PublishedArticle[]>;

export type { PublishedArticleSummary, PublishedArticlePage } from '@painter-os-bts/backend/published-articles.mjs';
import type { PublishedArticlePage } from '@painter-os-bts/backend/published-articles.mjs';
export interface PublishedArticlePageQuery { workspaceId: string; cursor: string | null; limit: number }
export declare function createPublishedArticlePageReader(query: (args: PublishedArticlePageQuery) => Promise<unknown>): (workspaceId: string, cursor?: string | null) => Promise<PublishedArticlePage>;
export declare function readPublishedArticlePage(url: string | undefined, workspaceId: string, cursor?: string | null): Promise<PublishedArticlePage>;
export declare function readJournalArticlePage(url: string | undefined, workspaceId: string, cursor: string | null, missing: () => never): Promise<PublishedArticlePage>;
