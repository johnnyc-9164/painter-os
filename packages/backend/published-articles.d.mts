export interface PublishedArticle { id: string; title: string; slug: string; content: string; publishedAt: string }
export declare const publishedArticlesFunction: 'painter:articles';
export declare function decodePublishedArticles(value: unknown): PublishedArticle[];
export declare function publicAdminOrigin(value: string | undefined): string | null;

export interface PublishedArticleSummary { id: string; title: string; slug: string; excerpt: string; publishedAt: string }
export interface PublishedArticlePage { page: PublishedArticleSummary[]; isDone: boolean; continueCursor: string | null }
export declare const publishedArticlePageFunction: 'painter:articlesPage';
export declare const publicArticlePageSize: 10;
export declare function decodePublishedArticlePage(value: unknown): PublishedArticlePage;
