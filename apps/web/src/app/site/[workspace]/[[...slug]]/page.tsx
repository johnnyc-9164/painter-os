import { notFound } from 'next/navigation';
import { ConvexHttpClient } from 'convex/browser';
import { ConvexError } from 'convex/values';
import { api } from '@painter-os-bts/backend/convex/runtime';
import { decodePublishedArticles, decodePublishedArticlePage, type PublishedArticle, type PublishedArticleSummary } from '@painter-os-bts/backend/published-articles.mjs';
import { localEnabled, publicArticlesLocal } from '@/lib/local-runtime';
import { Paintbrush, ArrowRight } from 'lucide-react';
export const dynamic = 'force-dynamic';

type JournalData = { workspace: { name: string }; articles: (PublishedArticle | PublishedArticleSummary)[]; next: string | null };
function localOffset(cursor: string | null, workspace: string): number {
  if (cursor === null) return 0;
  try {
    const value = JSON.parse(cursor);
    if (value.workspaceId !== workspace || !Number.isSafeInteger(value.offset) || value.offset < 0) throw new Error('invalid offset');
    return value.offset;
  } catch { throw new Error('INVALID_PUBLIC_ARTICLE_CURSOR'); }
}
export default async function PublicSite({ params, searchParams }: {
  params: Promise<{ workspace: string; slug?: string[] }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const { workspace, slug } = await params;
  if (slug && (slug.length !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug[0]))) notFound();
  const { cursor } = await searchParams;
  if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 8192)) throw new Error('INVALID_PUBLIC_ARTICLE_CURSOR');
  let data: JournalData;
  if (localEnabled()) {
    // Synthetic local runtime remains separate from the indexed cloud query.
    let local: ReturnType<typeof publicArticlesLocal>;
    try { local = publicArticlesLocal(workspace, slug?.[0]); } catch { notFound(); }
    const offset = slug ? 0 : localOffset(cursor ?? null, workspace);
    const all = decodePublishedArticles(local.articles);
    const rows = slug ? all : all.slice(offset, offset + 10).map(({ content, ...article }) => ({ ...article, excerpt: content.slice(0, 300) }));
    data = { workspace: { name: String(local.workspace.name) }, articles: rows, next: !slug && offset + 10 < all.length ? JSON.stringify({ workspaceId: workspace, offset: offset + 10 }) : null };
  } else {
    if (!process.env.NEXT_PUBLIC_CONVEX_URL) throw new Error('PUBLIC_CONTENT_NOT_CONFIGURED');
    const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);
    try {
      if (slug) data = { workspace: { name: 'Painter OS' }, articles: decodePublishedArticles(await client.query(api.painter.articles, { workspaceId: workspace, slug: slug[0] })), next: null };
      else {
        const page = decodePublishedArticlePage(await client.query(api.painter.articlesPage, { workspaceId: workspace, cursor: cursor ?? null, limit: 10 }));
        data = { workspace: { name: 'Painter OS' }, articles: page.page, next: page.continueCursor };
      }
    } catch (error) {
      if (error instanceof ConvexError && error.data === 'PUBLIC_WORKSPACE_NOT_FOUND') notFound();
      throw error;
    }
  }
  if (slug && !data.articles.length) notFound();
  return <div><header className="portal-top"><span className="brand"><span className="brand-mark"><Paintbrush/></span>{data.workspace.name}</span><a className="text-link" href={`/site/${encodeURIComponent(workspace)}`}>Our painting journal</a></header>
    <main className="portal-shell"><span className="eyebrow">CRAFTSMANSHIP, SHARED</span><h1>{slug ? data.articles[0].title : 'Better spaces begin with great painting.'}</h1><p className="muted">Ideas and practical guidance from our crew.</p>
      {data.articles.map(article => <article className="card" key={article.id}>{!slug && <h2>{article.title}</h2>}<div className="public-copy">{'content' in article ? (slug ? article.content : article.content.slice(0, 300)) : article.excerpt}</div>{!slug && <a className="text-link" href={`/site/${encodeURIComponent(workspace)}/${encodeURIComponent(article.slug)}`}>Read article <ArrowRight size={15}/></a>}</article>)}
      {!data.articles.length && <p>No articles have been published yet.</p>}
      {data.next && <nav aria-label="Journal pages"><a className="text-link" href={`/site/${encodeURIComponent(workspace)}?cursor=${encodeURIComponent(data.next)}`}>Next articles <ArrowRight size={15}/></a></nav>}
      <footer className="page-footer">Published with Painter OS</footer>
    </main></div>;
}
