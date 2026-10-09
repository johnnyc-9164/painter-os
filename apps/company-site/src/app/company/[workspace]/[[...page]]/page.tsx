import { notFound } from 'next/navigation';
import { readCompanyPages } from '@painter-os-bts/public-content/company-pages';
import CompanyPageView from '../../../../components/company-page';
export const dynamic = 'force-dynamic';
export default async function CompanyPage({ params }: { params: Promise<{workspace: string; page?: string[]}> }) {
  const { workspace, page } = await params;
  if (page && (page.length !== 1 || !['services', 'contact'].includes(page[0]))) notFound();
  const result = await readCompanyPages(process.env.NEXT_PUBLIC_CONVEX_URL, workspace, notFound);
  if (result.state === 'unavailable') notFound();
  const section = page?.[0] as 'services' | 'contact' | undefined;
  if (section && !result.pages[section]) notFound();
  return <CompanyPageView workspace={workspace} pages={result.pages} section={section ?? 'profile'}/>;
}
