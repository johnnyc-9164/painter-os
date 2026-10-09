'use client';
import { useRef, useState } from 'react';
import type { Snapshot } from '@painter-os-bts/domain/contracts';
import { currentReviewFollowUp, initialReviewDraft, reviewFollowUps, saveReviewFollowUpTask, type ReviewFollowUpProposal } from '@painter-os-bts/domain/review-follow-up';
import { Button } from '@painter-os-bts/ui/components/button';
import { Textarea } from '@painter-os-bts/ui/components/textarea';

export function ReviewFollowUpPanel({ snapshot, loadSnapshot, createTask }: {
  snapshot: Snapshot; loadSnapshot: () => Promise<Snapshot>;
  createTask: (input: Record<string, unknown>) => Promise<unknown>;
}) {
  const [selected, setSelected] = useState<ReviewFollowUpProposal | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const lock = useRef(false);
  if (!['owner', 'office_admin'].includes(snapshot.actor.role)) return null;
  const proposals = reviewFollowUps(snapshot.actor, snapshot.entities);
  async function prepare(key: string) {
    if (lock.current) return;
    lock.current = true; setBusy(true); setError(''); setSaved(false);
    try {
      const current = currentReviewFollowUp(await loadSnapshot(), key);
      setSelected(current); setDraft(initialReviewDraft(current));
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to refresh follow-up tasks.'); }
    finally { lock.current = false; setBusy(false); }
  }
  async function save() {
    if (lock.current || !selected) return;
    lock.current = true; setBusy(true); setError('');
    try { await saveReviewFollowUpTask(selected.key, draft, loadSnapshot, createTask); setSelected(null); setSaved(true); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Unable to save the task. Your draft remains here.'); }
    finally { lock.current = false; setBusy(false); }
  }
  return <section className="card" aria-label="Post-job review follow-up">
    <div className="section-head"><h2>Post-job follow-up</h2></div>
    <p className="muted">Prepare an internal task for a completed project. Save a draft here, then complete the task manually in Tasks. Saving never sends a message or records delivery approval.</p>
    {proposals.map(proposal => <div className="schedule-row" key={proposal.key}>
      <div><strong>{proposal.job.title}</strong><p>{proposal.customer.name}</p>
        <small>{proposal.customer.hasContact ? 'Customer contact is recorded; verify it before any manual outreach.' : 'No customer contact is recorded. Add or verify contact before any manual outreach.'}</small></div>
      <Button variant="outline" disabled={busy} onClick={() => void prepare(proposal.key)}>Prepare draft</Button>
    </div>)}
    {!proposals.length && <p className="muted">No completed projects need a new follow-up task. Existing review records and previously prepared tasks are excluded.</p>}
    {selected && <form onSubmit={event => { event.preventDefault(); void save(); }}>
      <h3>Draft for {selected.customer.name}</h3>
      <div className="form-grid"><label className="full"><span>Thank-you and review invitation draft</span><Textarea value={draft} maxLength={10000} required rows={8} disabled={busy} onChange={event => setDraft(event.target.value)} /></label></div>
      <p className="muted">Add your actual review link before sharing. Invite honest feedback consistently, including when work remains unresolved. No review response is inferred from task completion.</p>
      <div className="action-strip"><Button type="submit" disabled={busy || !draft.trim()}>{busy ? 'Saving…' : 'Save internal task'}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setSelected(null)}>Cancel draft</Button></div>
    </form>}
    {saved && <p role="status">Internal task saved. No message was sent. Complete it manually in Tasks when your follow-up work is done.</p>}
    {error && <div className="error" role="alert">{error}</div>}
  </section>;
}
