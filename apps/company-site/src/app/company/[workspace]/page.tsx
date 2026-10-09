import { notFound } from 'next/navigation';
import { CompanyWebsite } from '@painter-os-bts/ui/components/company-website';
import { readCompanyWebsite } from '@painter-os-bts/public-content/company-website';
import { readJournalArticlePage } from '../../../lib/articles';
export const dynamic = 'force-dynamic';
export default async function CompanyPage({params}:{params:Promise<{workspace:string}>}) {
  const { workspace } = await params;
  const result = await readCompanyWebsite(process.env.NEXT_PUBLIC_CONVEX_URL, workspace);
  if (result.state === 'unavailable') notFound();
  const blog = result.website.content.blogEnabled ? (await readJournalArticlePage(workspace, null, notFound)).page : [];
  return <CompanyWebsite content={result.website.content} media={result.website.media} workspaceId={workspace} blog={blog}/>;
}
