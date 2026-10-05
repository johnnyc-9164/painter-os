export interface PublishedArticle { id: string; title: string; slug: string; content: string; publishedAt: string }
export declare const publishedArticlesFunction: 'painter:articles';
export declare function decodePublishedArticles(value: unknown): PublishedArticle[];
export declare function publicAdminOrigin(value: string | undefined): string | null;
