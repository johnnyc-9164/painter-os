import type { PublishedArticle } from '@painter-os-bts/public-content';

export default function ArticleList({ articles, workspace, detail }: {
  articles: readonly PublishedArticle[]; workspace: string; detail: boolean;
}) {
  return <>{articles.map(article => <article key={article.id}>
    <h2>{article.title}</h2>
    <p className="copy">{detail ? article.content : article.content.slice(0, 300)}</p>
    {!detail && <a href={`/site/${encodeURIComponent(workspace)}/${encodeURIComponent(article.slug)}`}>Read article →</a>}
  </article>)}{articles.length === 0 && <p>No articles have been published yet.</p>}</>;
}
