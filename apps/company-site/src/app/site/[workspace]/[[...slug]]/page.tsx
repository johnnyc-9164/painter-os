import { notFound } from 'next/navigation';
import ArticleList from '../../../../components/article-list';
import { readJournalArticles, readJournalArticlePage } from '../../../../lib/articles';
export const dynamic = 'force-dynamic';
export default async function Journal({ params, searchParams }: { params: Promise<{ workspace: string; slug?: string[] }>; searchParams: Promise<{ cursor?: string | string[] }> }) {
  const { workspace, slug } = await params;
  if (slug && (slug.length !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug[0]))) notFound();
  const { cursor } = await searchParams;
  if (cursor !== undefined && (typeof cursor !== 'string' || cursor.length > 8192)) throw new Error('INVALID_PUBLIC_ARTICLE_CURSOR');
  const page = slug ? null : await readJournalArticlePage(workspace, cursor ?? null, notFound);
  const articles = page ? page.page : await readJournalArticles(workspace, slug?.[0], notFound);
  if (slug && articles.length === 0) notFound();
  return <><p className="eyebrow">OUR PAINTING JOURNAL</p><h1>{slug ? articles[0].title : 'Craftsmanship, shared.'}</h1><p><a href={`/estimate-request/${encodeURIComponent(workspace)}`}>Explore your painting project</a></p><ArticleList articles={articles} workspace={workspace} detail={Boolean(slug)}/>{page && !page.isDone && <nav aria-label="Journal pages"><a href={`/site/${encodeURIComponent(workspace)}?cursor=${encodeURIComponent(page.continueCursor!)}`}>Next articles →</a></nav>}</>;
}
