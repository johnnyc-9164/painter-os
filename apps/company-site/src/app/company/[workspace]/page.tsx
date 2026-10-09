import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { CompanyWebsite } from '@painter-os-bts/ui/components/company-website';
import { readCompanyWebsite } from '@painter-os-bts/public-content/company-website';
import { readJournalArticlePage } from '../../../lib/articles';
import { readCompanyIntake } from '../../../lib/intake';
export const dynamic = 'force-dynamic';
export async function generateMetadata({params}:{params:Promise<{workspace:string}>}):Promise<Metadata> {
  const {workspace}=await params;
  const result=await readCompanyWebsite(process.env.NEXT_PUBLIC_CONVEX_URL,workspace);
  if(result.state==='unavailable') return {title:'Company website unavailable',description:undefined};
  const {content}=result.website;
  return {title:content.companyName,description:content.hero.summary || content.tagline || undefined};
}
export default async function CompanyPage({params}:{params:Promise<{workspace:string}>}) {
  const { workspace } = await params;
  const result = await readCompanyWebsite(process.env.NEXT_PUBLIC_CONVEX_URL, workspace);
  if (result.state === 'unavailable') notFound();
  const blog = result.website.content.blogEnabled ? (await readJournalArticlePage(workspace, null, notFound)).page : [];
  const intake = await readCompanyIntake(workspace);
  return <CompanyWebsite content={result.website.content} media={result.website.media} workspaceId={workspace} blog={blog} projectGuidanceEnabled={intake.state === 'ready'}/>;
}
