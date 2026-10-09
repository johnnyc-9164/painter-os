import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PlatformApp } from '@painter-os-bts/platform/components/platform-app';
import type { PlatformSection } from '@painter-os-bts/platform/client';
import { contractorOrigin } from '../../../lib/contractor-origin';

export const metadata: Metadata = { title: 'Painter OS | Platform', robots: { index: false, follow: false } };
/** Explicit subtree prevents platform paths from falling through to the contractor dashboard. */
export default async function PlatformPage({ params, searchParams }: {
  params: Promise<{ section?: string[] }>;
  searchParams: Promise<{ cursor?: string | string[] }>;
}) {
  const segments = (await params).section ?? [];
  const query = await searchParams;
  const sections = ['workspaces', 'sites', 'health', 'access', 'activity', 'billing', 'login'];
  let section: PlatformSection = 'overview';
  let workspaceId: string | undefined;
  if (segments.length === 2 && segments[0] === 'workspaces') { section = 'detail'; workspaceId = segments[1]; }
  else if (segments.length === 1 && sections.includes(segments[0])) section = segments[0] as PlatformSection;
  else if (segments.length) notFound();
  const cursor = typeof query.cursor === 'string' ? query.cursor : undefined;
  return <PlatformApp key={`${segments.join('/')}:${cursor ?? ''}`} section={section} workspaceId={workspaceId} cursor={cursor} contractorHref={contractorOrigin(process.env.NEXT_PUBLIC_CONTRACTOR_APP_URL)}/>;
}
