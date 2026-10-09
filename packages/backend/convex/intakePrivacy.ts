import {anyApi, internalMutationGeneric, type GenericMutationCtx, type MutationBuilder} from 'convex/server';
import {v} from 'convex/values';
import {mutation, type DataModel, type Id} from './runtime';
import {resolvePainterMembership} from './painter';
import {intakeCommandReceiptKey, intakeDigest} from './intakeCrypto';
import {deletedIntakeCommandResult, intakeAuditMetadata} from './intakePrivacyProjection';

const internalMutation = internalMutationGeneric as MutationBuilder<DataModel, 'internal'>;
const internal = anyApi;
export const INTAKE_PRIVACY_BATCH = 25;
const resultValidator = v.object({state: v.union(v.literal('received'),v.literal('deletion_pending'),v.literal('deleted'),v.literal('converted_preserved'),v.literal('unavailable')), processed: v.number()});
type CleanupState = 'received'|'deletion_pending'|'deleted'|'converted_preserved'|'unavailable';

/** One bounded step. New/contacted/lost/edited remain unprocessed: only a verified
 * owner/office-admin customer transfer changes the fixed original deadline. */
export async function cleanupIntakeReceipt(ctx: GenericMutationCtx<DataModel>, receiptId: Id<'painterPublicLeadReceipts'>, force: boolean): Promise<{state: CleanupState; processed: number}> {
  const receipt = await ctx.db.get(receiptId);
  if (!receipt) return {state: 'unavailable', processed: 0};
  if (receipt.state === 'deleted') return {state: 'deleted', processed: 0};
  const lead = await ctx.db.query('painterEntities').withIndex('by_tenant_entity', q=>q.eq('tenantId',receipt.tenantId).eq('entityId',receipt.leadEntityId)).unique();
  if (receipt.state === 'converted_preserved') {
    const customer = receipt.customerId ? await ctx.db.query('painterEntities').withIndex('by_tenant_entity', q=>q.eq('tenantId',receipt.tenantId).eq('entityId',receipt.customerId!)).unique() : null;
    if (!receipt.transferredBy || receipt.transferredAt === undefined || !lead || lead.data.customerId !== receipt.customerId || customer?.type !== 'customer') throw new Error('INTAKE_RETENTION_TRANSFER_UNVERIFIED');
    return {state: 'converted_preserved', processed: 0};
  }
  if (lead && (lead.data.customerId || lead.data.status === 'qualified')) throw new Error('INTAKE_RETENTION_TRANSFER_UNVERIFIED');
  if (receipt.state === 'received') {
    if (!force && receipt.dueAt > Date.now()) return {state: 'received', processed: 0};
    // Remove the sole contact aggregate before asynchronous redaction. Command
    // provenance is marked in this same transaction, preventing new writes.
    if (lead) await ctx.db.delete(lead._id);
    await ctx.db.patch(receipt._id, {state: 'deletion_pending', cleanupPhase: 'events', cleanupCursor: undefined});
  }
  const phase = receipt.cleanupPhase ?? 'events';
  let processed = 0;
  if (phase === 'events') {
    const page = await ctx.db.query('painterEvents').withIndex('by_tenant_entity', q=>q.eq('tenantId',receipt.tenantId).eq('entityId',receipt.leadEntityId)).paginate({cursor: receipt.cleanupCursor ?? null, numItems: INTAKE_PRIVACY_BATCH});
    for (const event of page.page) {
      const {eventId, tenantId: _tenantId, ...fields} = event;
      await ctx.db.patch(event._id, {payload: intakeAuditMetadata({...fields,id:eventId},receipt.requestHash)});
      processed++;
    }
    await ctx.db.patch(receipt._id, {cleanupPhase: page.isDone ? 'receipts' : 'events', cleanupCursor: page.isDone ? undefined : page.continueCursor});
  } else {
    const links = await ctx.db.query('painterIntakeReceiptLinks').withIndex('by_lead_receipt', q=>q.eq('leadReceiptId',receipt._id)).take(INTAKE_PRIVACY_BATCH + 1);
    for (const link of links.slice(0, INTAKE_PRIVACY_BATCH)) {
      const command = await ctx.db.get(link.commandReceiptId);
      if (command) {
        if (command.tenantId !== receipt.tenantId) throw new Error('INTAKE_RECEIPT_WORKSPACE_MISMATCH');
        await ctx.db.patch(command._id, {
          requestKey: command.requestKey.startsWith('intake.command:') ? command.requestKey : await intakeCommandReceiptKey(String(receipt.tenantId),command.requestKey),
          fingerprint: command.fingerprint.startsWith('sha256:') ? command.fingerprint : `sha256:${await intakeDigest(command.fingerprint)}`,
          result: deletedIntakeCommandResult(),
        });
      }
      await ctx.db.delete(link._id);
      processed++;
    }
    if (links.length <= INTAKE_PRIVACY_BATCH) {
      await ctx.db.patch(receipt._id, {state: 'deleted', cleanupPhase: undefined, cleanupCursor: undefined});
      return {state: 'deleted', processed};
    }
  }
  await ctx.scheduler.runAfter(0, internal.intakePrivacy.continueCleanup, {receiptId});
  return {state: 'deletion_pending', processed};
}

export const continueCleanup = internalMutation({args: {receiptId: v.id('painterPublicLeadReceipts')}, returns: resultValidator, handler: (ctx,args)=>cleanupIntakeReceipt(ctx,args.receiptId,false)});
export const expire = internalMutation({args: {receiptId: v.id('painterPublicLeadReceipts')}, returns: resultValidator, handler: (ctx,args)=>cleanupIntakeReceipt(ctx,args.receiptId,false)});

/** Bounded recovery complements per-request scheduled expiry; no public purge scope. */
export const purgeDue = internalMutation({
  args: {}, returns: v.object({processed: v.number(), more: v.boolean()}),
  handler: async ctx => {
    const rows = await ctx.db.query('painterPublicLeadReceipts').withIndex('by_state_due', q=>q.eq('state','received').lte('dueAt',Date.now())).take(INTAKE_PRIVACY_BATCH + 1);
    for (const row of rows.slice(0, INTAKE_PRIVACY_BATCH)) await cleanupIntakeReceipt(ctx,row._id,false);
    const more = rows.length > INTAKE_PRIVACY_BATCH;
    if (more) await ctx.scheduler.runAfter(0, internal.intakePrivacy.purgeDue, {});
    return {processed: Math.min(rows.length,INTAKE_PRIVACY_BATCH), more};
  },
});

export const deleteRequest = mutation({
  args: {workspaceId: v.optional(v.id('painterWorkspaces')), reference: v.string()}, returns: resultValidator,
  handler: async (ctx,args) => {
    const {actor,workspace} = await resolvePainterMembership(ctx,args.workspaceId);
    if (actor.role !== 'owner') throw new Error('FORBIDDEN');
    if (!/^[a-f0-9]{64}$/.test(args.reference)) throw new Error('INVALID_CONTACT_REFERENCE');
    const receipt = await ctx.db.query('painterPublicLeadReceipts').withIndex('by_tenant_request', q=>q.eq('tenantId',workspace._id).eq('requestHash',args.reference)).unique();
    if (!receipt) return {state: 'unavailable' as const, processed: 0};
    const result = await cleanupIntakeReceipt(ctx,receipt._id,true);
    await ctx.db.insert('painterEvents',{tenantId:workspace._id,eventId:`${args.reference}:delete:${Date.now()}`,entityId:receipt.leadEntityId,type:'intake.delete_requested',actorId:actor.id,occurredAt:new Date().toISOString(),payload:{schemaVersion:1,state:result.state,contactDataRedacted:true}});
    return result;
  },
});
