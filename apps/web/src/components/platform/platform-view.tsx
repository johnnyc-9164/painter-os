'use client';
import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, Building2, CheckCircle2, Cloud, FileClock, Folder, GitFork, HeartPulse, Home, Info, Layers, LockKeyhole, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '@painter-os-bts/ui/components/button';
import { Card } from '@painter-os-bts/ui/components/card';
import type { PlatformActivityPage, WorkspacePage, WorkspaceSummary } from '@painter-os-bts/backend/platform-contract';
import type { PlatformResult, PlatformSection } from '../../lib/platform-client';
import { PlatformActivity } from './platform-activity';
import { PlatformSignIn } from './platform-sign-in';

const navigation = [
  { section: 'overview', label: 'Overview', href: '/platform', icon: Home },
  { section: 'workspaces', label: 'Workspaces', href: '/platform/workspaces', icon: Folder },
  { section: 'sites', label: 'Sites', href: '/platform/sites', icon: Layers },
  { section: 'health', label: 'Health', href: '/platform/health', icon: HeartPulse },
  { section: 'access', label: 'Access', href: '/platform/access', icon: ShieldCheck },
  { section: 'activity', label: 'Activity', href: '/platform/activity', icon: FileClock },
] as const;
const heading: Record<PlatformSection, [string, string]> = {
  overview: ['Platform overview', 'A clear view of this deployment and its workspaces.'],
  workspaces: ['Workspaces', 'Read-only inventory, with private operational records kept tenant-scoped.'],
  detail: ['Workspace details', 'Identity and read-only metadata from the workspace inventory.'],
  sites: ['Sites', 'Published sites and domain connections.'],
  health: ['Health', 'Verified observations of the services behind Painter OS.'],
  access: ['Platform access', 'Permissions for the current signed-in account.'],
  activity: ['Platform activity', 'Redacted platform access grant and revocation history.'],
  billing: ['Platform billing', 'Subscription and entitlement information.'],
  login: ['Platform sign in', 'Use your existing Painter OS account with platform access.'],
};
function Panel({ title, children, icon }: { title: string; children: ReactNode; icon?: ReactNode }) {
  return <Card className="platform-card"><div className="platform-card-heading"><h2>{title}</h2>{icon}</div>{children}</Card>;
}
function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'warning' }) {
  return <div className={`platform-notice platform-notice-${tone}`}><Info size={19} aria-hidden="true"/><p>{children}</p></div>;
}
function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(date);
}
function Summary({ workspace }: { workspace: WorkspaceSummary }) {
  return <>
    <Link className="platform-text-link" href="/platform/workspaces"><ArrowLeft size={17} aria-hidden="true"/>Back to workspaces</Link>
    <Panel title={workspace.name} icon={<Building2 aria-hidden="true"/>}>
      <dl className="platform-facts"><div><dt>Workspace ID</dt><dd className="platform-id">{workspace.id}</dd></div><div><dt>Created · UTC</dt><dd>{dateLabel(workspace.createdAt)}</dd></div><div><dt>Demo workspace</dt><dd>{workspace.demo ? 'Yes' : 'No'}</dd></div></dl>
    </Panel>
    <div className="grid gap-5 md:grid-cols-2"><Panel title="Published site" icon={<Layers aria-hidden="true"/>}><p>Open this workspace’s existing public article route. Custom domain and site binding information is unavailable.</p><Link className="platform-text-link" href={`/site/${encodeURIComponent(workspace.id)}`}>View published site<ArrowRight size={17} aria-hidden="true"/></Link></Panel><Panel title="Private operations" icon={<LockKeyhole aria-hidden="true"/>}><p>Customer records, team details, estimates and invoices remain in the contractor workspace. This view provides no impersonation or operational access.</p></Panel></div>
  </>;
}
export function PlatformView({ section, result, cursor, onRetry, onSignOut, signOutError }: {
  section: PlatformSection; result: PlatformResult; cursor?: string; onRetry(): void; onSignOut(): Promise<void>; signOutError?: string;
}) {
  const [title, subtitle] = heading[section];
  const authenticated = result.state === 'ready' || result.state === 'denied';
  let content: ReactNode;
  if (result.state === 'loading') content = <Panel title="Checking platform access" icon={<ShieldCheck aria-hidden="true"/>}><p role="status">Loading the current permission and platform data…</p></Panel>;
  else if (result.state === 'unauthenticated') content = <div className="platform-auth"><Panel title="Platform sign in" icon={<LockKeyhole aria-hidden="true"/>}><p>Sign in with your existing account. A verified account and an active platform grant are required.</p><PlatformSignIn onSignedIn={onRetry}/><Link className="platform-text-link" href="/dashboard">Go to contractor sign in<ArrowRight size={17} aria-hidden="true"/></Link></Panel></div>;
  else if (result.state === 'denied') content = <div className="platform-auth"><Panel title="Platform access required" icon={<LockKeyhole aria-hidden="true"/>}><p role="status">This account does not have active, verified platform access. Workspace ownership does not grant platform permission.</p><p>Contact your deployment operator if you need access, or sign out to use another account.</p><div className="flex flex-wrap gap-3"><Button onClick={onRetry}>Check access again</Button><Button variant="outline" onClick={() => void onSignOut()}>Sign out</Button></div><Link className="platform-text-link" href="/dashboard">Go to contractor workspace<ArrowRight size={17} aria-hidden="true"/></Link></Panel></div>;
  else if (result.state === 'unavailable') content = <Panel title="Platform unavailable" icon={<Cloud aria-hidden="true"/>}><p role="alert">{result.reason === 'local_runtime' ? 'Platform administration is unavailable in local mode. Local contractor accounts cannot grant platform access.' : result.reason === 'not_configured' ? 'Platform administration is not configured for this deployment.' : cursor && (section === 'workspaces' || section === 'activity') ? 'This page could not be loaded. Start from the first page, or retry when your connection is available.' : section === 'activity' ? 'The platform service could not be reached. Your permission and access history have not been confirmed.' : 'The platform service could not be reached. Your permissions and workspace inventory have not been confirmed.'}</p><div className="flex flex-wrap gap-3"><Button variant="outline" onClick={onRetry}>Try again</Button>{cursor && (section === 'workspaces' || section === 'activity') && <Link className="platform-primary-link" href={section === 'activity' ? '/platform/activity' : '/platform/workspaces'}>Start from first page</Link>}{signOutError && <Button variant="outline" onClick={() => void onSignOut()}>Retry sign out</Button>}</div></Panel>;
  else if (result.state === 'invalid_request' && section === 'activity') content = <Panel title="This activity link is invalid"><Link className="platform-text-link" href="/platform/activity">Start from first page</Link></Panel>;
  else if (result.state === 'invalid_request') content = <Panel title="This inventory link is invalid"><p>Open the workspace inventory again to start a fresh page.</p><Link className="platform-text-link" href="/platform/workspaces">Back to workspaces<ArrowRight size={17} aria-hidden="true"/></Link></Panel>;
  else if (result.state === 'not_found') content = <Panel title="Workspace not found"><p>This workspace may have been removed. Refresh the inventory to see current records.</p><Link className="platform-text-link" href="/platform/workspaces">Back to workspaces<ArrowRight size={17} aria-hidden="true"/></Link></Panel>;
  else if (section === 'activity' && 'items' in result) content = <PlatformActivity result={result as PlatformActivityPage & { state: 'ready' }} cursor={cursor}/>;
  else if (section === 'workspaces' && 'items' in result) content = <>
    <Notice>Workspace identity fields only. Each page is checked against your current platform permission.</Notice>
    <Panel title="Workspace inventory" icon={<Folder aria-hidden="true"/>}>
      <div className="platform-table-region" role="region" aria-label="Workspace inventory" tabIndex={0}>
        <table className="platform-table"><caption className="sr-only">Current inventory page. At most 20 workspaces per page, newest created first.</caption><thead><tr><th scope="col">Workspace</th><th scope="col">Workspace ID</th><th scope="col">Created · UTC</th><th scope="col">Demo</th></tr></thead><tbody>{(result as WorkspacePage & { state: 'ready' }).items.map(workspace => <tr key={workspace.id}><th scope="row"><Link href={`/platform/workspaces/${encodeURIComponent(workspace.id)}`}>{workspace.name}<ArrowRight size={16} aria-hidden="true"/></Link></th><td className="platform-id">{workspace.id}</td><td>{dateLabel(workspace.createdAt)}</td><td>{workspace.demo ? 'Yes' : 'No'}</td></tr>)}</tbody></table>
      </div>
      {result.items.length === 0 && <div className="platform-empty"><Folder size={30} aria-hidden="true"/><h3>No workspaces</h3><p>{cursor ? 'There are no records on this page. Return to the first page for the latest inventory.' : 'No workspace records exist in this deployment yet.'}</p></div>}
      <div className="platform-pagination"><p>{result.items.length} {result.items.length === 1 ? 'workspace' : 'workspaces'} on this page</p><div className="flex flex-wrap gap-3">{cursor && <Link className="platform-outline-link" href="/platform/workspaces"><ArrowLeft size={16} aria-hidden="true"/>First page</Link>}{result.nextCursor ? <Link className="platform-outline-link" href={`/platform/workspaces?cursor=${encodeURIComponent(result.nextCursor)}`}>Next page<ArrowRight size={16} aria-hidden="true"/></Link> : <span className="platform-muted">End of inventory</span>}</div></div>
    </Panel>
    <div className="grid gap-5 md:grid-cols-2"><Panel title="Identity fields only" icon={<Info aria-hidden="true"/>}><p>Name, ID, creation date and demo flag. Private owner and member information is not included.</p></Panel><Panel title="Read-only permission" icon={<LockKeyhole aria-hidden="true"/>}><p>No workspace edits, customer data, impersonation or billing actions are available here.</p></Panel></div>
  </>;
  else if (section === 'detail' && 'workspace' in result) content = <Summary workspace={result.workspace}/>;
  else if (section === 'overview') content = <>
    <Notice>Read-only platform access is active for this deployment.</Notice>
    <div className="grid gap-5 md:grid-cols-2"><Panel title="Workspace inventory" icon={<Folder aria-hidden="true"/>}><p>Browse redacted workspace records and open their identity details.</p><Link className="platform-primary-link" href="/platform/workspaces">View workspaces<ArrowRight size={17} aria-hidden="true"/></Link><div className="platform-metric"><span>Workspace count</span><strong>—</strong><p>A deployment-wide count is unavailable. Inventory pages show only the records loaded.</p></div></Panel><Panel title="Access readiness" icon={<LockKeyhole aria-hidden="true"/>}><span className="platform-status"><CheckCircle2 size={17} aria-hidden="true"/>Platform access active</span><p>Verified account with an active grant. Workspace ownership alone does not provide this permission.</p><Link className="platform-text-link" href="/platform/access">Review access<ArrowRight size={17} aria-hidden="true"/></Link></Panel></div>
    <Panel title="Connected administration"><p>Navigate this deployment’s resources and see where information is still unavailable.</p><div className="platform-resources">{navigation.filter(item => ['sites', 'health', 'activity', 'workspaces'].includes(item.section)).map(item => <Link key={item.section} href={item.href}><item.icon aria-hidden="true"/><span><strong>{item.label}</strong><small>{item.section === 'workspaces' ? 'Identity and read-only metadata' : item.section === 'activity' ? 'Redacted platform access history' : 'Information not yet connected'}</small></span><ArrowRight size={17} aria-hidden="true"/></Link>)}</div></Panel>
    <div className="grid gap-5 md:grid-cols-2"><Panel title="This deployment" icon={<Cloud aria-hidden="true"/>}><p>Operator permission applies only to the current deployment. Hosting ownership has not been recorded.</p></Panel><Panel title="Customer-owned forks" icon={<GitFork aria-hidden="true"/>}><p>Independent deployments keep their own identity and data. This grant does not provide access to a separate fork.</p></Panel></div>
  </>;
  else if (section === 'access') content = <>
    <Notice>Your current session is verified and has active platform access.</Notice><Panel title="Current permissions" icon={<ShieldCheck aria-hidden="true"/>}><ul className="platform-permissions"><li><CheckCircle2 aria-hidden="true"/>Read redacted workspace inventory</li><li><CheckCircle2 aria-hidden="true"/>Read workspace identity details</li><li><CheckCircle2 aria-hidden="true"/>Check your own platform permission</li><li><CheckCircle2 aria-hidden="true"/>Read redacted platform access history</li></ul><p>Grant, revoke, user verification and tenant impersonation controls are not available in this dashboard.</p><Link className="platform-text-link" href="/platform/workspaces">View workspaces<ArrowRight size={17} aria-hidden="true"/></Link></Panel>
  </>;
  else if (section === 'login') content = <Panel title="You have platform access" icon={<CheckCircle2 aria-hidden="true"/>}><p>Your current account can open the read-only dashboard.</p><Link className="platform-primary-link" href="/platform">Open platform overview<ArrowRight size={17} aria-hidden="true"/></Link></Panel>;
  else content = <>
    <Notice tone="warning">This information is unavailable. No live status or activity is implied.</Notice>
    <Panel title={`${title} is not connected`} icon={<Info aria-hidden="true"/>}><p>{section === 'sites' ? 'Verified site bindings and custom domain records are not available. A workspace detail links to its existing public article route.' : section === 'health' ? 'No live service probes or timestamped health observations have been connected to this dashboard.' : section === 'activity' ? 'The platform audit history has not been connected for display. Tenant business events remain private to their workspaces.' : 'A SaaS billing and entitlement provider has not been connected. Contractor invoices are separate business records.'}</p><Link className="platform-text-link" href="/platform/workspaces">View workspace inventory<ArrowRight size={17} aria-hidden="true"/></Link></Panel>
  </>;
  return <div className="platform-shell">
    <a className="platform-skip-link" href="#platform-main">Skip to content</a>
    <aside className="platform-sidebar"><Link className="platform-brand" href="/platform"><span className="platform-brand-mark" aria-hidden="true"><i/><i/></span><span>Painter OS<small>PLATFORM</small></span></Link><nav aria-label="Platform navigation">{navigation.map(item => <Link key={item.section} className={section === item.section || (section === 'detail' && item.section === 'workspaces') ? 'platform-nav-active' : ''} aria-current={section === item.section || (section === 'detail' && item.section === 'workspaces') ? 'page' : undefined} href={item.href}><item.icon size={20} aria-hidden="true"/>{item.label}</Link>)}</nav><div className="platform-sidebar-footer"><span>Read-only administration</span><Link href="/platform/billing">Billing availability<ArrowRight size={15} aria-hidden="true"/></Link><Link href="/dashboard">Contractor workspace<ArrowRight size={15} aria-hidden="true"/></Link></div></aside>
    <div className="platform-main-shell"><header className="platform-topbar"><nav aria-label="Breadcrumb"><Link href="/platform">Platform</Link><span aria-hidden="true">/</span><span>{section === 'detail' ? 'Workspace details' : title.replace('Platform ', '')}</span></nav><div className="flex items-center gap-3"><span className="platform-read-only">READ ONLY</span>{authenticated && <Button variant="ghost" onClick={() => void onSignOut()}><LogOut size={16} aria-hidden="true"/>Sign out</Button>}</div></header>
      <main id="platform-main" tabIndex={-1} className="platform-main"><div className="platform-heading"><h1>{title}</h1><p>{subtitle}</p></div>{signOutError && <p className="platform-error" role="alert">{signOutError}</p>}<div className="platform-content" aria-busy={result.state === 'loading'}>{content}</div><footer className="platform-footer"><span>Permission is checked on every platform read.</span><span>Painter OS / Platform</span></footer></main>
    </div>
  </div>;
}
