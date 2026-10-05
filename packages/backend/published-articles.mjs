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
