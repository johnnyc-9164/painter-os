'use client';
import { useRef, useState } from 'react';
import type { Snapshot } from '@painter-os-bts/domain/contracts';
import { nextActionQueue, type NextActionProposal } from '@painter-os-bts/domain/next-action-queue';
import { Button } from '@painter-os-bts/ui/components/button';
import { CommandForm } from './painter-forms';

export function currentProposal(snapshot: Snapshot, key: string, now: string): NextActionProposal {
  const proposal = nextActionQueue(snapshot.actor, snapshot.entities, now).find(item => item.key === key);
  if (!proposal) throw new Error('This suggestion changed or already has an open task. Refresh and review the current queue.');
  return proposal;
}

export function NextActionPanel({ snapshot, loadSnapshot, createTask, now = () => new Date().toISOString() }: {
  snapshot: Snapshot;
  loadSnapshot: () => Promise<Snapshot>;
  createTask: (input: Record<string, unknown>) => Promise<unknown>;
  now?: () => string;
}) {
  const [selected, setSelected] = useState<NextActionProposal | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const lock = useRef(false);
  const queue = nextActionQueue(snapshot.actor, snapshot.entities, now());
  async function review(key: string) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError('');
    try { setSelected(currentProposal(await loadSnapshot(), key, now())); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to refresh suggestions.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function approve(input: Record<string, unknown>) {
    if (lock.current || !selected) return;
    lock.current = true; setBusy(true);
    try {
      const fresh = currentProposal(await loadSnapshot(), selected.key, now());
      // CommandForm only returns editable schema fields; keep the stable source marker.
      await createTask({ ...input, notes: fresh.draft.input.notes });
      setSelected(null);
    } finally { lock.current = false; setBusy(false); }
  }
  return <section className="card" aria-label="Next actions">
    <div className="section-head"><h2>Next actions</h2><span className="badge">{queue.length} suggestions</span></div>
    <p className="muted">Review a suggestion, then save a task if it is useful. Nothing runs automatically.</p>
    {queue.map(proposal => <div className="schedule-row" key={proposal.key}>
      <div><strong>{proposal.draft.input.title}</strong><p>{proposal.rationale}</p>
        <small>{proposal.source.type} · {proposal.facts.status} · Version {proposal.source.revision} · Due {new Date(proposal.dueAt).toLocaleString()}</small>
      </div><Button variant="outline" disabled={busy} onClick={() => void review(proposal.key)}>Review task</Button>
    </div>)}
    {!queue.length && <p className="muted">No suggestions for your current records and permissions.</p>}
    {error && <div className="error" role="alert">{error}</div>}
    {selected && <CommandForm spec={{action: 'task.create', title: 'Approve suggested task', initial: selected.draft.input}}
      entities={snapshot.entities} busy={busy} onClose={() => { if (!busy) setSelected(null); }} onSubmit={approve} />}
  </section>;
}
