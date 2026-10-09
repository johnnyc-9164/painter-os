import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card } from '@painter-os-bts/ui/components/card';
import type { PlatformActivityPage } from '@painter-os-bts/backend/platform-contract';
function timestamp(value: number) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Not recorded' : date.toISOString();
}
export function PlatformActivity({ result, cursor }: { result: PlatformActivityPage & { state: 'ready' }; cursor?: string }) {
  return <>
    <p className="platform-notice">Access grant and revocation history only. Operator identities, proof references and tenant business events remain private.</p>
    <Card className="platform-card"><h2>Platform access history</h2>
      <div className="platform-table-region" role="region" aria-label="Platform access history" tabIndex={0}>
        <table className="platform-table"><caption className="sr-only">Current audit page, newest recorded first.</caption><thead><tr><th scope="col">Action</th><th scope="col">Recorded · UTC</th><th scope="col">Enabled before</th><th scope="col">Enabled after</th></tr></thead><tbody>{result.items.map(item => <tr key={item.id}><th scope="row">{item.action === 'bootstrap' ? 'Initial access grant' : 'Access revocation'}</th><td>{timestamp(item.occurredAt)}</td><td>{item.beforeEnabled ? 'Yes' : 'No'}</td><td>{item.afterEnabled ? 'Yes' : 'No'}</td></tr>)}</tbody></table>
      </div>
      {result.items.length === 0 && <p role="status">No platform access events on this page.</p>}
      <div className="platform-pagination"><p>{result.items.length} events on this page</p><div className="flex flex-wrap gap-3">{cursor && <Link className="platform-outline-link" href="/platform/activity">First page</Link>}{result.nextCursor ? <Link className="platform-outline-link" href={`/platform/activity?cursor=${encodeURIComponent(result.nextCursor)}`}>Next page<ArrowRight size={16} aria-hidden="true"/></Link> : <span className="platform-muted">End of access history</span>}</div></div>
    </Card>
  </>;
}
