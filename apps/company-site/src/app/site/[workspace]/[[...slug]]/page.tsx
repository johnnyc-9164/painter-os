import { notFound } from 'next/navigation';
import ArticleList from '../../../../components/article-list';
import { readJournalArticles } from '../../../../lib/articles';
export const dynamic = 'force-dynamic';
export default async function Journal({ params }: { params: Promise<{ workspace: string; slug?: string[] }> }) {
  const { workspace, slug } = await params;
  if (slug && (slug.length !== 1 || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug[0]))) notFound();
  const articles = await readJournalArticles(workspace, slug?.[0], notFound);
  if (slug && articles.length === 0) notFound();
  return <><p className="eyebrow">OUR PAINTING JOURNAL</p><h1>{slug ? articles[0].title : 'Craftsmanship, shared.'}</h1><p><a href={`/estimate-request/${encodeURIComponent(workspace)}`}>Explore your painting project</a></p><ArticleList articles={articles} workspace={workspace} detail={Boolean(slug)}/></>;
}
