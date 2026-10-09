import type { Actor, Entity, Snapshot } from './contracts';
import { visibleEntities } from './engine';

export interface ReviewFollowUpProposal {
  key: string;
  job: { id: string; revision: number; title: string };
  customer: { id: string; revision: number; name: string; hasContact: boolean };
  marker: string;
}
const bounded = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0 && value.length <= 10000;

/** Suggestions only. The host must resolve membership and execute its existing task writer. */
export function reviewFollowUps(actor: Actor, entities: Entity[]): ReviewFollowUpProposal[] {
  if (!['owner', 'office_admin'].includes(actor.role)) return [];
  const visible = visibleEntities({ entities, events: [], receipts: {} }, actor);
  return visible.flatMap(job => {
    if (job.type !== 'job' || job.data.status !== 'complete' || !bounded(job.data.title)
      || !Number.isSafeInteger(job.revision) || job.revision < 1) return [];
    const customer = visible.find(item => item.type === 'customer' && item.id === job.data.customerId);
    if (!customer || !bounded(customer.data.name) || !Number.isSafeInteger(customer.revision) || customer.revision < 1) return [];
    const marker = `Painter review follow-up source: ${JSON.stringify([actor.tenantId, job.id, customer.id])}`;
    if (visible.some(item => item.type === 'review' && item.data.jobId === job.id)
      || visible.some(item => item.type === 'task' && typeof item.data.notes === 'string'
        && item.data.notes.split('\n').includes(marker))) return [];
    return [{ key: JSON.stringify([actor.tenantId, job.id, job.revision, customer.id, customer.revision]),
      job: { id: job.id, revision: job.revision, title: job.data.title },
      customer: { id: customer.id, revision: customer.revision, name: customer.data.name,
        hasContact: bounded(customer.data.email) || bounded(customer.data.phone) }, marker }];
  }).sort((a, b) => a.key.localeCompare(b.key));
}

export function currentReviewFollowUp(snapshot: Snapshot, key: string): ReviewFollowUpProposal {
  const proposal = reviewFollowUps(snapshot.actor, snapshot.entities).find(item => item.key === key);
  if (!proposal) throw new Error('This job, customer or follow-up changed. Refresh and prepare the current draft.');
  return proposal;
}

export function initialReviewDraft(proposal: ReviewFollowUpProposal): string {
  return `Thank you for trusting us with ${proposal.job.title}. We welcome your honest feedback.\n\nReview link: [add your company review link]\n\nIf any work remains unresolved, please contact our team so we can help. You are welcome to leave a review either way.`;
}

/** Refresh directly before the existing command; this is not a transactional eligibility guarantee. */
export async function saveReviewFollowUpTask(key: string, draft: string,
  loadSnapshot: () => Promise<Snapshot>, createTask: (input: Record<string, unknown>) => Promise<unknown>): Promise<unknown> {
  if (!bounded(draft) || draft.includes('Painter review follow-up source:')) throw new Error('Enter a draft of 1–10,000 characters without a source marker.');
  const fresh = currentReviewFollowUp(await loadSnapshot(), key);
  return createTask({ title: `Prepare review follow-up: ${fresh.job.title}`, jobId: fresh.job.id,
    notes: `${fresh.marker}\nInternal draft only; no message sent and no delivery approval recorded.\n${draft}` });
}
