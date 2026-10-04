/** Drop-in host API. Connect your existing authentication provider; do not expose tenant/role arguments. */
import { v } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { query, mutation } from './_generated/server.js';
import { components } from './_generated/api.js';
import type { DataModel } from './_generated/dataModel.js';
import { ContractorBackend } from '../../src/backendClient.js';
import { commandInputs, commandOptions, businessCommand, businessResult } from '../../src/component/businessValidators.js';
import { jobFinancialsResult, invoiceBalanceResult, historyResult, listResult } from '../../src/component/operationValidators.js';
import { componentInfoResult } from '../../src/component/metaValidators.js';
const os = new ContractorBackend<DataModel>(components.contractorOs, async (ctx, identity) => {
    const row = await ctx.db.query('contractorOsMemberships').withIndex('by_identity', q => q.eq('tokenIdentifier', identity.tokenIdentifier)).unique();
    if (!row?.enabled)
        return null;
    return { tenantId: row.tenantId, permissions: row.role === 'admin' ? ['read', 'write', 'import', 'attest'] : row.role === 'operator' ? ['read', 'write'] : ['read'] };
});
export const execute = mutation({ args: { ...commandOptions, command: businessCommand }, returns: businessResult, handler: (ctx, args) => os.execute(ctx, args) });
export const co_create_lead = mutation({
    args: { ...commandOptions, input: commandInputs.co_create_lead }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'co_create_lead', input } }),
});
export const co_schedule_site_visit = mutation({
    args: { ...commandOptions, input: commandInputs.co_schedule_site_visit }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'co_schedule_site_visit', input } }),
});
export const co_advance_lead = mutation({
    args: { ...commandOptions, input: commandInputs.co_advance_lead }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'co_advance_lead', input } }),
});
export const co_create_scope = mutation({
    args: { ...commandOptions, input: commandInputs.co_create_scope }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'co_create_scope', input } }),
});
export const co_create_proposal = mutation({
    args: { ...commandOptions, input: commandInputs.co_create_proposal }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'co_create_proposal', input } }),
});
export const co_submit_bid = mutation({
    args: { ...commandOptions, input: commandInputs.co_submit_bid }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'co_submit_bid', input } }),
});
export const co_record_payment = mutation({
    args: { ...commandOptions, input: commandInputs.co_record_payment }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'co_record_payment', input } }),
});
export const co_create_job = mutation({
    args: { ...commandOptions, input: commandInputs.co_create_job }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'co_create_job', input } }),
});
export const co_convert_bid_to_contract = mutation({
    args: { ...commandOptions, input: commandInputs.co_convert_bid_to_contract }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'co_convert_bid_to_contract', input } }),
});
export const co_mark_contract_signed = mutation({
    args: { ...commandOptions, input: commandInputs.co_mark_contract_signed }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'co_mark_contract_signed', input } }),
});
export const co_create_invoice = mutation({
    args: { ...commandOptions, input: commandInputs.co_create_invoice }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'co_create_invoice', input } }),
});
export const transition = mutation({
    args: { ...commandOptions, input: commandInputs.transition }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'transition', input } }),
});
export const assign_subcontractor = mutation({
    args: { ...commandOptions, input: commandInputs.assign_subcontractor }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'assign_subcontractor', input } }),
});
export const submit_daily_report = mutation({
    args: { ...commandOptions, input: commandInputs.submit_daily_report }, returns: businessResult,
    handler: (ctx, { input, ...options }) => os.execute(ctx, { ...options, command: { kind: 'submit_daily_report', input } }),
});
export const componentInfo = query({ args: {}, returns: componentInfoResult, handler: (ctx) => os.componentInfo(ctx) });
export const history = query({ args: { paginationOpts: paginationOptsValidator }, returns: historyResult, handler: (ctx, args) => os.history(ctx, args.paginationOpts) });
export const jobFinancials = query({ args: { identifier: v.string() }, returns: jobFinancialsResult, handler: (ctx, args) => os.jobFinancials(ctx, args.identifier) });
export const invoiceBalance = query({ args: { identifier: v.string() }, returns: invoiceBalanceResult, handler: (ctx, args) => os.invoiceBalance(ctx, args.identifier) });
export const listJobs = query({ args: { paginationOpts: paginationOptsValidator }, returns: listResult, handler: (ctx, args) => os.listJobs(ctx, args.paginationOpts) });
export const listLeads = query({ args: { paginationOpts: paginationOptsValidator }, returns: listResult, handler: (ctx, args) => os.listLeads(ctx, args.paginationOpts) });

import { projectionArgs, projectionResult } from '../../src/component/projectionValidators.js';
export const inspectRecord = query({ args: projectionArgs, returns: projectionResult,
    handler: (ctx, args) => os.inspectRecord(ctx, args.blueprint, args.identifier, args.asOf) });
