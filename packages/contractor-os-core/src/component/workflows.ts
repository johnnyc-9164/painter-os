/** Each command is ONE mutation, including all records, audit events, evidence claims and request receipt. */
import { mutation } from './_generated/server.js';
import type { MutationCtx } from './_generated/server.js';
import { ConvexError } from 'convex/values';
import { executeBusinessCommand } from '../shared/business.js';
import type { TrustedBusinessArgs, BusinessResult } from '../shared/businessTypes.js';
import { convexBusinessStore } from './businessStore.js';
import { commandInputs, trustedOptions, businessResult, businessCommand } from './businessValidators.js';
async function perform(ctx: MutationCtx, args: TrustedBusinessArgs): Promise<BusinessResult> {
    try {
        return await executeBusinessCommand(convexBusinessStore(ctx, args.tenantId), args);
    }
    catch (error) {
        if (error instanceof ConvexError)
            throw error;
        throw new ConvexError(error instanceof Error ? error.message : 'COMMAND_FAILED');
    }
}
// Public within the component means callable by the authenticated parent, not browser-direct.
export const execute = mutation({ args: { ...trustedOptions, command: businessCommand }, returns: businessResult, handler: perform });
export const co_create_lead = mutation({
    args: { ...trustedOptions, input: commandInputs.co_create_lead }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'co_create_lead', input } }),
});
export const co_schedule_site_visit = mutation({
    args: { ...trustedOptions, input: commandInputs.co_schedule_site_visit }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'co_schedule_site_visit', input } }),
});
export const co_advance_lead = mutation({
    args: { ...trustedOptions, input: commandInputs.co_advance_lead }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'co_advance_lead', input } }),
});
export const co_create_scope = mutation({
    args: { ...trustedOptions, input: commandInputs.co_create_scope }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'co_create_scope', input } }),
});
export const co_create_proposal = mutation({
    args: { ...trustedOptions, input: commandInputs.co_create_proposal }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'co_create_proposal', input } }),
});
export const co_submit_bid = mutation({
    args: { ...trustedOptions, input: commandInputs.co_submit_bid }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'co_submit_bid', input } }),
});
export const co_record_payment = mutation({
    args: { ...trustedOptions, input: commandInputs.co_record_payment }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'co_record_payment', input } }),
});
export const co_create_job = mutation({
    args: { ...trustedOptions, input: commandInputs.co_create_job }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'co_create_job', input } }),
});
export const co_convert_bid_to_contract = mutation({
    args: { ...trustedOptions, input: commandInputs.co_convert_bid_to_contract }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'co_convert_bid_to_contract', input } }),
});
export const co_mark_contract_signed = mutation({
    args: { ...trustedOptions, input: commandInputs.co_mark_contract_signed }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'co_mark_contract_signed', input } }),
});
export const co_create_invoice = mutation({
    args: { ...trustedOptions, input: commandInputs.co_create_invoice }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'co_create_invoice', input } }),
});
export const transition = mutation({
    args: { ...trustedOptions, input: commandInputs.transition }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'transition', input } }),
});
export const assign_subcontractor = mutation({
    args: { ...trustedOptions, input: commandInputs.assign_subcontractor }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'assign_subcontractor', input } }),
});
export const submit_daily_report = mutation({
    args: { ...trustedOptions, input: commandInputs.submit_daily_report }, returns: businessResult,
    handler: (ctx, { input, ...args }) => perform(ctx, { ...args, command: { kind: 'submit_daily_report', input } }),
});
