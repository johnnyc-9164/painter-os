import {anyApi} from 'convex/server';
import {v} from 'convex/values';
import {mutation, query} from './runtime';
import {admitIntake} from './intakeAdmission';
import {intakeDigest, intakeSubmissionReference} from './intakeCrypto';
import {persistPainterState} from './painterStore';
import {emptyState} from '../../domain/src/engine';
import {createLeadAggregate, PUBLIC_INTAKE_LEAD_ID_PREFIX} from '../../domain/src/lead-aggregate';
import {validateIntakeSettings} from '../intake-contract';
import {CONTACT_RETENTION_DAYS, publicSubmissionFingerprintPayload, validateContactIntakeSettings, validatePublicContactSubmission} from '../public-lead-contract';

const internal = anyApi;
const proofState = v.union(v.literal('received'),v.literal('deletion_pending'),v.literal('deleted'),v.literal('converted_preserved'));
const proof = v.object({state: proofState, reference: v.string()});
const denied = v.object({state: v.literal('denied'), reason: v.union(v.literal('unavailable'),v.literal('policy_changed'),v.literal('request_conflict'),v.literal('receipt_expired'),v.literal('global_limit'),v.literal('tenant_limit')), retryAfterMs: v.optional(v.number())});
const submission = v.object({
  requestKey: v.string(), contactPolicyRevision: v.number(), guidanceRevision: v.number(), consent: v.literal(true),
  contact: v.object({name:v.string(),email:v.optional(v.string()),phone:v.optional(v.string())}),
  project: v.object({postalCode:v.string(),projectType:v.union(v.literal('interior'),v.literal('exterior'),v.literal('commercial'),v.literal('other')),scope:v.string(),timeline:v.string()}),
});

/** Specialized anonymous capability, not a role or general command dispatcher.
 * Policy, quota, effect receipt and canonical lead creation share one transaction. */
export const submit = mutation({
  args: {workspaceId: v.string(), submission}, returns: v.union(proof,denied),
  handler: async (ctx,args) => {
    const input = validatePublicContactSubmission(args.submission);
    const tenantId = ctx.db.normalizeId('painterWorkspaces',args.workspaceId);
    if (!tenantId || !await ctx.db.get(tenantId)) return {state:'denied' as const,reason:'unavailable' as const};
    const reference = await intakeSubmissionReference(String(tenantId),input.requestKey);
    const payloadDigest = await intakeDigest(publicSubmissionFingerprintPayload(String(tenantId),input));
    const existing = await ctx.db.query('painterPublicLeadReceipts').withIndex('by_tenant_request',q=>q.eq('tenantId',tenantId).eq('requestHash',reference)).unique();
    // Proof survives policy revocation and deletion; it never re-admits a lead.
    if (existing) {
      if (existing.payloadDigest !== payloadDigest) return {state:'denied' as const,reason:'request_conflict' as const};
      return {state:existing.state,reference};
    }
    const [contact,guidance] = await Promise.all([
      ctx.db.query('painterContactIntakePolicies').withIndex('by_tenant',q=>q.eq('tenantId',tenantId)).unique(),
      ctx.db.query('painterIntakeConfigs').withIndex('by_tenant',q=>q.eq('tenantId',tenantId)).unique(),
    ]);
    if (!contact?.enabled || !guidance?.enabled) return {state:'denied' as const,reason:'unavailable' as const};
    validateContactIntakeSettings({enabled:contact.enabled,consentText:contact.consentText,acknowledgeRetention:contact.acknowledgeRetention});
    validateIntakeSettings({enabled:guidance.enabled,servicePostalCodes:guidance.servicePostalCodes,supportedProjectTypes:guidance.supportedProjectTypes,consentText:guidance.consentText});
    if (input.contactPolicyRevision !== contact.revision || input.guidanceRevision !== guidance.revision) return {state:'denied' as const,reason:'policy_changed' as const};
    const admission = await admitIntake(ctx,{workspaceId:tenantId,requestKey:reference,payloadDigest});
    if (admission.state === 'denied') return {state:'denied' as const,reason:admission.reason,...('retryAfterMs' in admission?{retryAfterMs:admission.retryAfterMs}:{})};
    const now = Date.now(), dueAt = now + CONTACT_RETENTION_DAYS * 86_400_000;
    const leadId = `${PUBLIC_INTAKE_LEAD_ID_PREFIX}${reference}`;
    // Only this indexed aggregate is read; anonymous intake never loads a tenant snapshot.
    const collision = await ctx.db.query('painterEntities').withIndex('by_tenant_entity',q=>q.eq('tenantId',tenantId).eq('entityId',leadId)).unique();
    if (collision) throw new Error('ID_COLLISION');
    const receiptId = await ctx.db.insert('painterPublicLeadReceipts',{tenantId,requestHash:reference,payloadDigest,leadEntityId:leadId,contactPolicyRevision:contact.revision,guidanceRevision:guidance.revision,consentedAt:now,dueAt,state:'received'});
    const entity = createLeadAggregate({id:leadId,tenantId:String(tenantId),now:new Date(now).toISOString(),input:{...input.contact,source:'consented_public_intake',notes:JSON.stringify(input.project)}});
    const state = emptyState();
    state.entities.push(entity);
    state.events.push({id:`${reference}:received`,type:'lead.received',entityId:leadId,actorId:'anonymous-intake',occurredAt:new Date(now).toISOString(),payload:{schemaVersion:1,revision:1}});
    await persistPainterState(ctx,tenantId,emptyState(),state);
    await ctx.scheduler.runAfter(dueAt-now,internal.intakePrivacy.expire,{receiptId});
    return {state:'received' as const,reference};
  },
});

/** Bearer reference proof contains no identity/contact/project/lead ID. It can
 * reconcile an unknown transport outcome even when the policy is now closed. */
export const status = query({
  args: {workspaceId:v.string(),requestKey:v.string()}, returns:v.union(proof,v.object({state:v.literal('unavailable')})),
  handler: async (ctx,args) => {
    if (!/^[A-Za-z0-9_-]{32,80}$/.test(args.requestKey)) throw new Error('INVALID_CONTACT_REFERENCE');
    const tenantId=ctx.db.normalizeId('painterWorkspaces',args.workspaceId);
    if (!tenantId) return {state:'unavailable' as const};
    const reference=await intakeSubmissionReference(String(tenantId),args.requestKey);
    const receipt=await ctx.db.query('painterPublicLeadReceipts').withIndex('by_tenant_request',q=>q.eq('tenantId',tenantId).eq('requestHash',reference)).unique();
    return receipt?{state:receipt.state,reference}:{state:'unavailable' as const};
  },
});
