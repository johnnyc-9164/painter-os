import type {GenericMutationCtx, GenericQueryCtx} from 'convex/server';
import type {DataModel, Id} from './runtime';
import type {State} from '../../domain/src/engine';
import type {Entity, Role} from '../../domain/src/contracts';
import {intakeCommandReceiptKey, intakeDigest} from './intakeCrypto';
import {intakeAuditMetadata} from './intakePrivacyProjection';

type IntakeReceipt = DataModel['painterPublicLeadReceipts']['document'];
type Transfer = {action: string; userId: string; role: Role};

async function loadCommandReceipt(ctx: GenericQueryCtx<DataModel>, tenantId: Id<'painterWorkspaces'>, requestKey?: string) {
  if (!requestKey) return [];
  const hashedKey = await intakeCommandReceiptKey(String(tenantId), requestKey);
  const [legacy, hashed] = await Promise.all([
    ctx.db.query('painterReceipts').withIndex('by_tenant_request', q=>q.eq('tenantId',tenantId).eq('requestKey',requestKey)).unique(),
    ctx.db.query('painterReceipts').withIndex('by_tenant_request', q=>q.eq('tenantId',tenantId).eq('requestKey',hashedKey)).unique(),
  ]);
  if (legacy && hashed) throw new Error('IDEMPOTENCY_KEY_CONFLICT');
  return legacy ? [legacy] : hashed ? [hashed] : [];
}

/** Existing authenticated snapshot boundary. Anonymous ingress passes a small
 * creation delta directly to persist and never calls this whole-tenant loader. */
export async function loadPainterState(ctx: GenericQueryCtx<DataModel>, tenantId: Id<'painterWorkspaces'>, requestKey?: string): Promise<State> {
  const [rows, events, receipts] = await Promise.all([
    ctx.db.query('painterEntities').withIndex('by_tenant', q=>q.eq('tenantId',tenantId)).collect(),
    ctx.db.query('painterEvents').withIndex('by_tenant', q=>q.eq('tenantId',tenantId)).collect(),
    loadCommandReceipt(ctx, tenantId, requestKey),
  ]);
  return {
    entities: rows.map(({_id, _creationTime, entityId, ...entity})=>({...entity, id: entityId, type: entity.type as Entity['type']})),
    events: events.map(({_id, _creationTime, tenantId: _tenantId, eventId, ...event})=>({...event, id: eventId})),
    // Only the current invocation uses raw addressing; persisted keys stay hashed.
    receipts: Object.fromEntries(receipts.map(receipt=>[JSON.stringify([tenantId,requestKey ?? receipt.requestKey]), {fingerprint: receipt.fingerprint, result: receipt.result}])),
  };
}

/** Sole painter aggregate writer, shared by authenticated commands and the
 * specialized anonymous lead capability. No shadow CRM entities are persisted. */
export async function persistPainterState(ctx: GenericMutationCtx<DataModel>, tenantId: Id<'painterWorkspaces'>, before: State, after: State, requestKey?: string, transfer?: Transfer, nativeKind?: 'estimate_slot'|'estimate_appointment') {
  const revisions = new Map(before.entities.map(entity=>[entity.id,entity.revision]));
  const changed = after.entities.filter(entity=>revisions.get(entity.id) !== entity.revision);
  const intakeLeads: IntakeReceipt[] = [];
  for (const entity of changed) {
    if (entity.type !== 'lead') continue;
    const receipt = await ctx.db.query('painterPublicLeadReceipts').withIndex('by_tenant_entity', q=>q.eq('tenantId',tenantId).eq('leadEntityId',entity.id)).unique();
    if (!receipt) continue;
    if (receipt.state === 'deleted' || receipt.state === 'deletion_pending') throw new Error('INTAKE_CONTACT_DELETED');
    intakeLeads.push(receipt);
    if (entity.data.customerId || entity.data.status === 'qualified') {
      if (receipt.state !== 'converted_preserved' && (!transfer || !['owner','office_admin'].includes(transfer.role) || !['lead.qualify','lead.update'].includes(transfer.action))) throw new Error('INTAKE_RETENTION_TRANSFER_REQUIRED');
      if (typeof entity.data.customerId !== 'string') throw new Error('INTAKE_TRANSFER_CUSTOMER_REQUIRED');
      const customer = after.entities.find(row=>row.id === entity.data.customerId && row.type === 'customer' && row.tenantId === String(tenantId));
      if (!customer) throw new Error('INTAKE_TRANSFER_CUSTOMER_REQUIRED');
      await ctx.db.patch(receipt._id, {state: 'converted_preserved', customerId: customer.id, transferredBy: transfer?.userId ?? receipt.transferredBy, transferredAt: receipt.transferredAt ?? Date.now()});
    }
  }
  for (const entity of changed) {
    const {id, ...fields} = entity;
    const row = await ctx.db.query('painterEntities').withIndex('by_tenant_entity', q=>q.eq('tenantId',tenantId).eq('entityId',id)).unique();
    const value = {...fields, tenantId, entityId: id};
    if (row) await ctx.db.replace(row._id, value); else await ctx.db.insert('painterEntities', value);
  }
  const eventIds = new Set(before.events.map(event=>event.id));
  for (const event of after.events) {
    if (eventIds.has(event.id)) continue;
    const {id, ...fields} = event;
    const intake = intakeLeads.find(receipt=>receipt.leadEntityId === event.entityId);
    let payload = fields.payload;
    if (intake) {
      const requestHash = await intakeDigest(JSON.stringify([String(tenantId),requestKey ?? event.payload.requestKey ?? intake.requestHash]));
      const customerId = changed.find(entity=>entity.id === event.entityId)?.data.customerId;
      payload = {...intakeAuditMetadata(event,requestHash), ...(transfer && customerId ? {retentionTransferred: true, customerId, transferredBy: transfer.userId} : {})};
    }
    await ctx.db.insert('painterEvents', {...fields, payload, tenantId, eventId: id});
  }
  for (const [key, receipt] of Object.entries(after.receipts)) {
    if (before.receipts[key]) continue;
    const decoded = JSON.parse(key) as [string,string];
    const originalKey = requestKey ?? decoded[1];
    const storedKey = intakeLeads.length ? await intakeCommandReceiptKey(String(tenantId),originalKey) : originalKey;
    const fingerprint = intakeLeads.length && !receipt.fingerprint.startsWith('sha256:') ? `sha256:${await intakeDigest(receipt.fingerprint)}` : receipt.fingerprint;
    const commandReceiptId = await ctx.db.insert('painterReceipts', {tenantId, requestKey: storedKey, fingerprint, result: receipt.result, ...(nativeKind ? {nativeKind} : {})});
    for (const intake of intakeLeads) await ctx.db.insert('painterIntakeReceiptLinks', {leadReceiptId: intake._id, commandReceiptId});
  }
}
