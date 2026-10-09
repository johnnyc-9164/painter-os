import {v} from 'convex/values';
import {mutation, query} from './runtime';
import {resolvePainterMembership} from './painter';
import {intakeDigest} from './intakeCrypto';
import {validateIntakeSettings} from '../intake-contract';
import {CONTACT_RETENTION_DAYS, CONTACT_RETENTION_DISCLOSURE, validateContactIntakeSettings} from '../public-lead-contract';

const settingsFields = {enabled: v.boolean(), consentText: v.string(), acknowledgeRetention: v.boolean()};
const configured = v.object({revision: v.number(), enabled: v.boolean(), replayed: v.boolean()});

/** Separate explicit opt-in; existing guidance enablement grants no contact-write authority. */
export const configure = mutation({
  args: {workspaceId: v.optional(v.id('painterWorkspaces')), expectedRevision: v.number(), requestKey: v.string(), settings: v.object(settingsFields)},
  returns: configured,
  handler: async (ctx, args) => {
    const {actor, workspace} = await resolvePainterMembership(ctx, args.workspaceId);
    if (!['owner', 'office_admin'].includes(actor.role)) throw new Error('FORBIDDEN');
    if (!Number.isSafeInteger(args.expectedRevision) || args.expectedRevision < 0 || !args.requestKey.trim() || args.requestKey.length > 180) throw new Error('INVALID_CONTACT_CONFIG_REQUEST');
    const settings = validateContactIntakeSettings(args.settings);
    const requestKey = `contact.configure:${await intakeDigest(JSON.stringify([workspace._id, args.requestKey]))}`;
    const fingerprint = `sha256:${await intakeDigest(JSON.stringify([actor.id, actor.role, args.expectedRevision, settings]))}`;
    const receipt = await ctx.db.query('painterReceipts').withIndex('by_tenant_request', q=>q.eq('tenantId',workspace._id).eq('requestKey',requestKey)).unique();
    if (receipt) {
      if (receipt.fingerprint !== fingerprint) throw new Error('IDEMPOTENCY_KEY_CONFLICT');
      return {...receipt.result, replayed: true};
    }
    const existing = await ctx.db.query('painterContactIntakePolicies').withIndex('by_tenant', q=>q.eq('tenantId',workspace._id)).unique();
    const beforeRevision = existing?.revision ?? 0;
    if (beforeRevision !== args.expectedRevision) throw new Error('REVISION_CONFLICT');
    if (!Number.isSafeInteger(beforeRevision + 1)) throw new Error('INVALID_CONTACT_REVISION');
    const revision = beforeRevision + 1, updatedAt = Date.now();
    const value = {tenantId: workspace._id, ...settings, revision, updatedBy: actor.id, updatedAt};
    if (existing) await ctx.db.replace(existing._id, value); else await ctx.db.insert('painterContactIntakePolicies', value);
    const result = {revision, enabled: settings.enabled, replayed: false};
    await ctx.db.insert('painterReceipts', {tenantId: workspace._id, requestKey, fingerprint, result});
    await ctx.db.insert('painterEvents', {tenantId: workspace._id, eventId: requestKey, entityId: String(workspace._id), type: 'contact_intake.configure', actorId: actor.id, occurredAt: new Date(updatedAt).toISOString(), payload: {schemaVersion: 1, beforeRevision, revision, enabled: settings.enabled, retentionDays: CONTACT_RETENTION_DAYS}});
    return result;
  },
});

export const current = query({
  args: {workspaceId: v.optional(v.id('painterWorkspaces'))},
  returns: v.union(v.null(), v.object({...settingsFields, revision: v.number(), retentionDays: v.literal(CONTACT_RETENTION_DAYS), retentionDisclosure: v.string()})),
  handler: async (ctx, args) => {
    const {actor, workspace} = await resolvePainterMembership(ctx, args.workspaceId);
    if (!['owner', 'office_admin'].includes(actor.role)) throw new Error('FORBIDDEN');
    const row = await ctx.db.query('painterContactIntakePolicies').withIndex('by_tenant', q=>q.eq('tenantId',workspace._id)).unique();
    return row ? {...validateContactIntakeSettings({enabled: row.enabled, consentText: row.consentText, acknowledgeRetention: row.acknowledgeRetention}), revision: row.revision, retentionDays: CONTACT_RETENTION_DAYS, retentionDisclosure: CONTACT_RETENTION_DISCLOSURE} : null;
  },
});

export const publicPolicy = query({
  args: {workspaceId: v.string()},
  returns: v.union(v.object({state: v.literal('unavailable')}), v.object({state: v.literal('ready'), policy: v.object({companyName: v.string(), contactPolicyRevision: v.number(), guidanceRevision: v.number(), consentText: v.string(), retentionDays: v.literal(CONTACT_RETENTION_DAYS), retentionDisclosure: v.string()})})),
  handler: async (ctx, args) => {
    const tenantId = ctx.db.normalizeId('painterWorkspaces', args.workspaceId);
    if (!tenantId) return {state: 'unavailable' as const};
    const workspace = await ctx.db.get(tenantId);
    if (!workspace) return {state: 'unavailable' as const};
    const [contact, guidance] = await Promise.all([
      ctx.db.query('painterContactIntakePolicies').withIndex('by_tenant', q=>q.eq('tenantId',tenantId)).unique(),
      ctx.db.query('painterIntakeConfigs').withIndex('by_tenant', q=>q.eq('tenantId',tenantId)).unique(),
    ]);
    if (!contact?.enabled || !guidance?.enabled) return {state: 'unavailable' as const};
    validateContactIntakeSettings({enabled: contact.enabled, consentText: contact.consentText, acknowledgeRetention: contact.acknowledgeRetention});
    validateIntakeSettings({enabled: guidance.enabled, servicePostalCodes: guidance.servicePostalCodes, supportedProjectTypes: guidance.supportedProjectTypes, consentText: guidance.consentText});
    if (!Number.isSafeInteger(contact.revision) || contact.revision < 1 || !Number.isSafeInteger(guidance.revision) || guidance.revision < 1) throw new Error('INVALID_CONTACT_REVISION');
    return {state: 'ready' as const, policy: {companyName: workspace.name, contactPolicyRevision: contact.revision, guidanceRevision: guidance.revision, consentText: contact.consentText, retentionDays: CONTACT_RETENTION_DAYS, retentionDisclosure: CONTACT_RETENTION_DISCLOSURE}};
  },
});
