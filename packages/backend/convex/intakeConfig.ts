import { v } from 'convex/values';
import { mutation, query } from './runtime';
import { resolvePainterMembership } from './painter';
import { intakeSettingsFields, intakeSettingsValidator } from './intakeValidators';
import { validateIntakeSettings, type PublicIntakeResult } from '../intake-contract';

const configured = v.object({ revision: v.number(), enabled: v.boolean(), replayed: v.boolean() });

/** The sole intake configuration writer. Membership is resolved before any
 * policy/receipt access; browser IDs select a candidate but confer no authority. */
export const configure = mutation({
  args: { workspaceId: v.optional(v.id('painterWorkspaces')), expectedRevision: v.number(), requestKey: v.string(), settings: intakeSettingsValidator },
  returns: configured,
  handler: async (ctx, args) => {
    const {actor, workspace} = await resolvePainterMembership(ctx, args.workspaceId);
    if (!['owner', 'office_admin'].includes(actor.role)) throw new Error('FORBIDDEN');
    if (!Number.isSafeInteger(args.expectedRevision) || args.expectedRevision < 0 || !args.requestKey.trim() || args.requestKey.length > 180) throw new Error('INVALID_INTAKE_REQUEST');
    const settings = validateIntakeSettings(args.settings);
    const requestKey = `intake.configure:${args.requestKey}`;
    const fingerprint = JSON.stringify([actor.id, actor.role, args.expectedRevision, settings]);
    const receipt = await ctx.db.query('painterReceipts').withIndex('by_tenant_request', q => q.eq('tenantId', workspace._id).eq('requestKey', requestKey)).unique();
    if (receipt) {
      if (receipt.fingerprint !== fingerprint) throw new Error('IDEMPOTENCY_KEY_CONFLICT');
      return {...receipt.result, replayed: true};
    }
    const existing = await ctx.db.query('painterIntakeConfigs').withIndex('by_tenant', q => q.eq('tenantId', workspace._id)).unique();
    const beforeRevision = existing?.revision ?? 0;
    if (beforeRevision !== args.expectedRevision) throw new Error('REVISION_CONFLICT');
    if (!Number.isSafeInteger(beforeRevision + 1)) throw new Error('INVALID_INTAKE_REVISION');
    const revision = beforeRevision + 1, updatedAt = new Date().toISOString();
    const value = {tenantId: workspace._id, ...settings, revision, updatedBy: actor.id, updatedAt};
    if (existing) await ctx.db.replace(existing._id, value); else await ctx.db.insert('painterIntakeConfigs', value);
    const result = {revision, enabled: settings.enabled, replayed: false};
    await ctx.db.insert('painterReceipts', {tenantId: workspace._id, requestKey, fingerprint, result});
    await ctx.db.insert('painterEvents', {tenantId: workspace._id, eventId: JSON.stringify([workspace._id, requestKey]), entityId: String(workspace._id), type: 'intake.configure', actorId: actor.id, occurredAt: updatedAt, payload: {schemaVersion: 1, tenantId: actor.tenantId, beforeRevision, revision, enabled: settings.enabled}});
    return result;
  },
});

/** Private configuration read, using the same company-settings authority. */
export const current = query({
  args: {workspaceId: v.optional(v.id('painterWorkspaces'))},
  returns: v.union(v.null(), v.object({...intakeSettingsFields, revision: v.number()})),
  handler: async (ctx, args) => {
    const {actor, workspace} = await resolvePainterMembership(ctx, args.workspaceId);
    if (!['owner', 'office_admin'].includes(actor.role)) throw new Error('FORBIDDEN');
    const row = await ctx.db.query('painterIntakeConfigs').withIndex('by_tenant', q => q.eq('tenantId', workspace._id)).unique();
    return row ? {...validateIntakeSettings({enabled: row.enabled, servicePostalCodes: row.servicePostalCodes, supportedProjectTypes: row.supportedProjectTypes, consentText: row.consentText}), revision: row.revision} : null;
  },
});

/** Public read only. Unknown/deleted workspace, missing policy and disabled
 * intake share one unavailable result; no default company is selected. */
export const publicPolicy = query({
  args: {workspaceId: v.string()},
  returns: v.union(v.object({state: v.literal('unavailable')}), v.object({state: v.literal('ready'), intake: v.object({...intakeSettingsFields, companyName: v.string(), revision: v.number()})})),
  handler: async (ctx, args): Promise<PublicIntakeResult> => {
    const tenantId = ctx.db.normalizeId('painterWorkspaces', args.workspaceId);
    if (!tenantId) return {state: 'unavailable'};
    const workspace = await ctx.db.get(tenantId);
    if (!workspace) return {state: 'unavailable'};
    const row = await ctx.db.query('painterIntakeConfigs').withIndex('by_tenant', q => q.eq('tenantId', tenantId)).unique();
    if (!row?.enabled) return {state: 'unavailable'};
    const settings = validateIntakeSettings({enabled: row.enabled, servicePostalCodes: row.servicePostalCodes, supportedProjectTypes: row.supportedProjectTypes, consentText: row.consentText});
    if (!Number.isSafeInteger(row.revision) || row.revision < 1) throw new Error('INVALID_INTAKE_REVISION');
    return {state: 'ready', intake: {...settings, companyName: workspace.name, revision: row.revision}};
  },
});
