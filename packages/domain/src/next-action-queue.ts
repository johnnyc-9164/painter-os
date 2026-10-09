import type { Actor, Entity } from './contracts';
import { canCommand, visibleEntities } from './engine';
import { PUBLIC_INTAKE_LEAD_ID_PREFIX } from './lead-aggregate';

export interface NextActionProposal {
  key: string;
  kind: 'lead_follow_up' | 'estimate_review';
  source: { id: string; type: 'lead' | 'estimate'; revision: number; updatedAt: string };
  facts: { title: string; status: string };
  dueAt: string;
  rationale: string;
  requiresApproval: true;
  draft: { action: 'task.create'; input: { title: string; notes: string; dueAt: string } };
}

const day = 24 * 60 * 60 * 1000;
function timestamp(value: string): number | undefined {
  // Require a timezone and a real calendar date; Date.parse alone normalizes February 30.
  if (typeof value !== 'string') return;
  if (!/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(value)) return;
  const [year, month, date] = value.slice(0, 10).split('-').map(Number);
  if (new Date(Date.UTC(year!, month! - 1, date!)).toISOString().slice(0, 10) !== value.slice(0, 10)) return;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

/** Read-only proposals. Actor must come from the host's trusted membership resolver.
 * No command is executed; the host must rederive/check source revisions on approval.
 */
export function nextActionQueue(actor: Actor, entities: Entity[], now: string): NextActionProposal[] {
  const time = timestamp(now);
  if (time === undefined) throw new Error('INVALID_QUEUE_NOW');
  if (!canCommand(actor, 'task.create')) return [];
  const visible = visibleEntities({ entities, events: [], receipts: {} }, actor);
  const proposals: NextActionProposal[] = [];
  for (const entity of visible) {
    if (entity.type !== 'lead' && entity.type !== 'estimate') continue;
    // A task title/receipt would otherwise copy unconverted visitor PII outside
    // its retention aggregate. Conversion is an explicit company decision first.
    if (entity.type === 'lead' && entity.id.startsWith(PUBLIC_INTAKE_LEAD_ID_PREFIX)) continue;
    if (!canCommand(actor, `${entity.type}.update`)) continue;
    const status = entity.data.status;
    const title = entity.data.title ?? entity.data.name;
    if (typeof title !== 'string' || !title.trim() || title.length > 100000) continue;
    if (!Number.isSafeInteger(entity.revision) || entity.revision < 1) continue;
    const updated = timestamp(entity.updatedAt);
    if (updated === undefined || updated > time) continue;
    const lead = entity.type === 'lead';
    if (lead ? !['new', 'contacted'].includes(String(status)) : !['draft', 'changes_requested'].includes(String(status))) continue;
    const due = updated + (lead ? day : 0);
    if (due > time) continue;
    // JSON encoding keeps arbitrary source IDs unambiguous. Stable across revisions.
    const marker = `Painter next action source: ${JSON.stringify([entity.type, entity.id])}`;
    if (visible.some(task => task.type === 'task' && task.data.status === 'open'
      && typeof task.data.notes === 'string' && task.data.notes.split('\n').includes(marker))) continue;
    const kind = lead ? 'lead_follow_up' : 'estimate_review';
    const dueAt = new Date(due).toISOString();
    const rationale = lead
      ? 'Lead remains new or contacted at least 24 hours after its last update. Review whether follow-up is needed.'
      : 'Estimate is a draft or has requested changes. Review its scope and pricing before any send decision.';
    const taskTitle = `${lead ? 'Review lead follow-up' : 'Review estimate'}: ${title}`;
    if (taskTitle.length > 100000) continue;
    proposals.push({
      key: JSON.stringify([entity.tenantId, entity.type, entity.id, entity.revision, kind]),
      kind, source: { id: entity.id, type: entity.type, revision: entity.revision, updatedAt: entity.updatedAt },
      facts: { title, status: String(status) }, dueAt, rationale, requiresApproval: true,
      draft: { action: 'task.create', input: { title: taskTitle, notes: `${marker}\n${rationale}`, dueAt } },
    });
  }
  return proposals.sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.key.localeCompare(b.key));
}
