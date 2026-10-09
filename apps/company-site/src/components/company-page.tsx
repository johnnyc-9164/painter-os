import type { CompanyPages } from '@painter-os-bts/public-content/company-pages';
export default function CompanyPageView({ workspace, pages, section }: {workspace: string; pages: CompanyPages; section: 'profile' | 'services' | 'contact'}) {
  const base = `/company/${encodeURIComponent(workspace)}`;
  const current = pages[section]!;
  return <div className="company-page">
    <nav aria-label="Company pages">
      <a href={base} aria-current={section === 'profile' ? 'page' : undefined}>About</a>
      {pages.services && <a href={`${base}/services`} aria-current={section === 'services' ? 'page' : undefined}>Services</a>}
      {pages.contact && <a href={`${base}/contact`} aria-current={section === 'contact' ? 'page' : undefined}>Contact</a>}
      <a href={`/site/${encodeURIComponent(workspace)}`}>Journal</a>
    </nav>
    <h1>{current.title}</h1>
    <div className="company-copy">{current.content}</div>
    <p className="company-guide"><a href={`/estimate-request/${encodeURIComponent(workspace)}`}>Explore your painting project</a></p>
  </div>;
}
