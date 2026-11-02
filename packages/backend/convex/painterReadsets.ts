import type {GenericQueryCtx} from 'convex/server';
import type {DataModel, Id} from './runtime';
import type {State} from '../../domain/src/engine';
import {entityTypes, type Actor, type AuditEvent, type Command, type EntityType} from '../../domain/src/contracts';
import {loadCommandReceipt, painterEntityFromRow, painterEventFromRow} from './painterStore';

/**
 * Bounded generic Painter reads (issue 159). Read side only: the sole writer is
 * persistPainterState. Native estimate history (slots/appointments) is served by
 * its own indexed/paged APIs and is never part of generic command or snapshot state;
 * audit history is a paginated projection; receipts are exact-key indexed lookups.
 * Nothing here truncates business state, prunes receipts or adds a second writer.
 */
type Ctx = GenericQueryCtx<DataModel>;
type Row = DataModel['painterEntities']['document'];
type TenantId = Id<'painterWorkspaces'>;

export const NATIVE_ENTITY_TYPES: readonly EntityType[] = ['estimate_slot', 'estimate_appointment'];
const isNative = (type: string) => NATIVE_ENTITY_TYPES.includes(type as EntityType);
export const GENERIC_ENTITY_TYPES: readonly EntityType[] = entityTypes.filter(type => !isNative(type));
/** Newest audit events returned inline by snapshot; older history uses the paginated activity query. */
export const SNAPSHOT_EVENT_LIMIT = 500;
export const ACTIVITY_PAGE_MAX = 200;
/** Reference keys the engine follows from a command or loaded entity to another entity. */
const REFERENCE_KEYS = ['customerId', 'leadId', 'estimateId', 'jobId', 'invoiceId', 'fileId'] as const;
const CLOSURE_ROUNDS = 4;

const str = (value: unknown): string | undefined => typeof value === 'string' && value.length > 0 && value.length <= 200 ? value : undefined;
function isoInstant(value: unknown): string | undefined {
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) return undefined;
  try { return new Date(value).toISOString(); } catch { return undefined; }
}

/** Authoritative command state: only entities the engine can read for this command,
 * found through indexes (ids, then references, then relation/uniqueness scans), plus the
 * one exact-key receipt. No events and no native history are loaded. */
export async function loadPainterCommandState(ctx: Ctx, tenantId: TenantId, command: Command, requestKey?: string): Promise<State> {
  const rows = new Map<string, Row>();
  const attempted = new Set<string>();
  const input = (command.input && typeof command.input === 'object' && !Array.isArray(command.input) ? command.input : {}) as Record<string, unknown>;
  const add = (found: Row[]) => { for (const row of found) if (!isNative(row.type)) rows.set(row.entityId, row); };
  async function ensure(id: unknown): Promise<Row | undefined> {
    const entityId = str(id);
    if (!entityId) return undefined;
    if (!attempted.has(entityId)) {
      attempted.add(entityId);
      const row = await ctx.db.query('painterEntities').withIndex('by_tenant_entity', q => q.eq('tenantId', tenantId).eq('entityId', entityId)).unique();
      if (row) add([row]);
    }
    return rows.get(entityId);
  }
  const byRelation = (type: EntityType, index: 'by_tenant_type_job_customer' | 'by_tenant_type_estimate_customer', field: 'data.jobId' | 'data.estimateId', id: unknown) => {
    const value = str(id);
    return value ? ctx.db.query('painterEntities').withIndex(index, (q: any) => q.eq('tenantId', tenantId).eq('type', type).eq(field, value)).collect() : Promise.resolve([] as Row[]);
  };
  const byType = (type: EntityType) => ctx.db.query('painterEntities').withIndex('by_tenant_type', q => q.eq('tenantId', tenantId).eq('type', type)).collect();

  const receipts = await loadCommandReceipt(ctx, tenantId, requestKey);
  // A replay re-projects the stored result against CURRENT entities, so the result's own ids are part of the readset.
  const replayed = receipts.flatMap(receipt => [receipt.result?.entity?.id, ...((receipt.result?.entities ?? []) as {id?: unknown}[]).map(entity => entity.id)]);
  await Promise.all([ensure(command.entityId), ...REFERENCE_KEYS.map(key => ensure(input[key])), ...replayed.map(ensure)]);
  let frontier = [...rows.values()];
  for (let round = 0; round < CLOSURE_ROUNDS && frontier.length; round++) {
    const before = new Set(rows.keys());
    await Promise.all(frontier.flatMap(row => REFERENCE_KEYS.map(key => ensure((row.data as Record<string, unknown>)[key]))));
    frontier = [...rows.values()].filter(row => !before.has(row.entityId));
  }

  const [group, verb] = command.action.split('.');
  const target = command.entityId ? rows.get(command.entityId) : undefined;
  const data = (target?.data ?? {}) as Record<string, unknown>;
  if (group === 'job' && verb === 'create') add(await byRelation('job', 'by_tenant_type_estimate_customer', 'data.estimateId', input.estimateId));
  else if (group === 'job' && verb === 'cancel') add(await byRelation('schedule', 'by_tenant_type_job_customer', 'data.jobId', command.entityId));
  else if (group === 'job' && verb === 'complete') add(await byRelation('field', 'by_tenant_type_job_customer', 'data.jobId', command.entityId));
  else if (group === 'schedule' && verb === 'cancel') add(await byRelation('schedule', 'by_tenant_type_job_customer', 'data.jobId', data.jobId));
  else if (group === 'schedule' && (verb === 'create' || verb === 'reschedule')) {
    // Crew conflicts are business state: every confirmed schedule starting before the candidate end is read, never a truncated sample.
    const end = isoInstant(input.endAt ?? data.endAt);
    if (end) add(await ctx.db.query('painterEntities').withIndex('by_tenant_type_status_start', q => q.eq('tenantId', tenantId).eq('type', 'schedule').eq('data.status', 'confirmed').lt('data.startAt', end)).collect());
  } else if (group === 'field' && verb === 'start') add(await byRelation('field', 'by_tenant_type_job_customer', 'data.jobId', input.jobId));
  else if (group === 'invoice' && verb === 'create') add(await byRelation('invoice', 'by_tenant_type_job_customer', 'data.jobId', input.jobId));
  else if (group === 'payment' && verb === 'record') {
    const reference = typeof input.reference === 'string' ? input.reference.trim() : '';
    if (reference) add(await ctx.db.query('painterEntities').withIndex('by_tenant_type_reference', q => q.eq('tenantId', tenantId).eq('type', 'payment').eq('data.reference', reference)).collect());
  } else if ((group === 'review' && verb === 'create') || (group === 'automation' && verb === 'run')) add(await byRelation('review', 'by_tenant_type_job_customer', 'data.jobId', input.jobId));
  else if (group === 'article' && (verb === 'create' || verb === 'update') && input.slug !== undefined) add(await byType('article'));
  else if (group === 'integration') add(await byType('integration'));

  // The deposit gate is transaction-authoritative, not a UI-only projection.
  // Bounded command readsets must include the indexed invoice/payment ledger
  // for the job before checking schedule, job start, field start or exceptions.
  const depositJobId =
    group === 'job' && ['start', 'overrideDeposit', 'revokeDepositOverride'].includes(verb ?? '')
      ? command.entityId
      : group === 'schedule' && ['create', 'reschedule'].includes(verb ?? '')
        ? input.jobId ?? data.jobId
        : group === 'field' && verb === 'start'
          ? input.jobId
          : undefined;
  if (depositJobId) {
    add(await byRelation('invoice', 'by_tenant_type_job_customer', 'data.jobId', depositJobId));
    add(await byRelation('payment', 'by_tenant_type_job_customer', 'data.jobId', depositJobId));
  }

  return {
    entities: [...rows.values()].map(painterEntityFromRow),
    events: [],
    receipts: Object.fromEntries(receipts.map(receipt => [JSON.stringify([tenantId, requestKey ?? receipt.requestKey]), {fingerprint: receipt.fingerprint, result: receipt.result}])),
  };
}

/** Read projection for the authenticated snapshot: generic business entities by type
 * (native history excluded; it has paged native APIs) and the newest audit events.
 * Role/customer filtering stays with the engine's visibleEntities and the caller. */
export async function loadPainterSnapshotState(ctx: Ctx, tenantId: TenantId): Promise<{state: State; eventsComplete: boolean}> {
  const [byType, newest] = await Promise.all([
    Promise.all(GENERIC_ENTITY_TYPES.map(type => ctx.db.query('painterEntities').withIndex('by_tenant_type', q => q.eq('tenantId', tenantId).eq('type', type)).collect())),
    ctx.db.query('painterEvents').withIndex('by_tenant', q => q.eq('tenantId', tenantId)).order('desc').take(SNAPSHOT_EVENT_LIMIT + 1),
  ]);
  const events = newest.slice(0, SNAPSHOT_EVENT_LIMIT).reverse();
  return {state: {entities: byType.flat().map(painterEntityFromRow), events: events.map(painterEventFromRow), receipts: {}}, eventsComplete: newest.length <= SNAPSHOT_EVENT_LIMIT};
}

const FULL_AUDIT_ROLES = ['owner', 'office_admin', 'accountant', 'project_manager'];
/** Same role projection the snapshot has always applied to audit payloads. */
export function projectAuditEvent(actor: Actor, event: AuditEvent): AuditEvent {
  return FULL_AUDIT_ROLES.includes(actor.role) ? event : {...event, payload: {schemaVersion: event.payload.schemaVersion, tenantId: actor.tenantId, action: event.payload.action, revision: event.payload.revision}};
}
