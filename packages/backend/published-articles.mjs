/** Public CMS read contract. Admin remains the sole content writer. */
export const publishedArticlesFunction = 'painter:articles';

/** @param {unknown} value */
export function decodePublishedArticles(value) {
  if (!Array.isArray(value)) throw new Error('INVALID_PUBLIC_ARTICLES');
  return value.map(article => {
    if (!article || ['id', 'title', 'slug', 'content', 'publishedAt'].some(key => typeof article[key] !== 'string') ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) throw new Error('INVALID_PUBLIC_ARTICLE');
    return { id: article.id, title: article.title, slug: article.slug,
      content: article.content, publishedAt: article.publishedAt };
  });
}

/** @param {string | undefined} value */
export function publicAdminOrigin(value) {
  if (!value) return null;
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password ||
    url.pathname !== '/' || url.search || url.hash) throw new Error('INVALID_PUBLIC_ADMIN_ORIGIN');
  return url.origin;
}

export const publishedArticlePageFunction = 'painter:articlesPage';
export const publicArticlePageSize = 10;

/** Page rows intentionally omit complete content and private source fields. */
export function decodePublishedArticlePage(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.page) || value.page.length > 20 ||
    typeof value.isDone !== 'boolean' || (value.isDone ? value.continueCursor !== null :
      typeof value.continueCursor !== 'string' || !value.continueCursor || value.continueCursor.length > 8192)) {
    throw new Error('INVALID_PUBLIC_ARTICLE_PAGE');
  }
  const page = value.page.map(article => {
    if (!article || ['id', 'title', 'slug', 'excerpt', 'publishedAt'].some(key => typeof article[key] !== 'string') ||
      article.excerpt.length > 300 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(article.slug)) throw new Error('INVALID_PUBLIC_ARTICLE_SUMMARY');
    return { id: article.id, title: article.title, slug: article.slug, excerpt: article.excerpt, publishedAt: article.publishedAt };
  });
  return { page, isDone: value.isDone, continueCursor: value.continueCursor };
}
