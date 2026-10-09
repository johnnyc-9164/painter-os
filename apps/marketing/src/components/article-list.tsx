import type { PublishedArticle } from '@painter-os-bts/backend/published-articles.mjs';

export default function ArticleList({ articles, workspace, detail }: {
  articles: readonly (PublishedArticle | { id: string; title: string; slug: string; excerpt: string })[]; workspace: string; detail: boolean;
}) {
  return <>{articles.map(article => <article key={article.id}>
    <h2>{article.title}</h2>
    <p className="copy">{'content' in article ? (detail ? article.content : article.content.slice(0, 300)) : article.excerpt}</p>
    {!detail && <a href={`/site/${encodeURIComponent(workspace)}/${encodeURIComponent(article.slug)}`}>Read article →</a>}
  </article>)}{articles.length === 0 && <p>No articles have been published yet.</p>}</>;
}
