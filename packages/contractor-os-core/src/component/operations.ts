/** Indexed, tenant-scoped reads. Balances are derived from transactionally maintained totals. */
import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { paginator } from 'convex-helpers/server/pagination';
import { query } from './_generated/server.js';
import schema from './schema.js';
import { checkRead, checkPage } from './domainRuntime.js';
import { boundedString } from '../shared/port.js';
import { minorUnits, dollars } from '../shared/businessPolicy.js';
import { jobFinancialsResult, invoiceBalanceResult, historyResult, listResult } from './operationValidators.js';
const number = (n: unknown) => { if (typeof n !== 'number')
    throw new ConvexError('AMOUNT_NOT_INITIALIZED'); return minorUnits(n); };
export const jobFinancials = query({
    args: { tenantId: v.string(), identifier: v.string() }, returns: jobFinancialsResult,
    handler: async (ctx, args) => {
        checkRead(args.tenantId);
        boundedString(args.identifier, 'INVALID_IDENTIFIER');
        const job = await ctx.db.query('co_job').withIndex('by_tenant_identifier', q => q.eq('tenantId', args.tenantId).eq('identifier', args.identifier)).unique();
        if (!job)
            return null;
        const contract = number(job.properties.contract_amount), billed = number(job.properties.billed_to_date), collected = number(job.properties.collected_to_date);
        return { identifier: job.identifier, revision: job.revision, currency: 'USD' as const, contractAmount: dollars(contract), billedToDate: dollars(billed), collectedToDate: dollars(collected), outstandingBalance: dollars(billed - collected), billedReceivable: dollars(billed - collected), remainingContractBalance: dollars(contract - collected), unbilledContractAmount: dollars(contract - billed) };
    },
});
export const invoiceBalance = query({
    args: { tenantId: v.string(), identifier: v.string() }, returns: invoiceBalanceResult,
    handler: async (ctx, args) => {
        checkRead(args.tenantId);
        boundedString(args.identifier, 'INVALID_IDENTIFIER');
        const invoice = await ctx.db.query('co_invoice').withIndex('by_tenant_identifier', q => q.eq('tenantId', args.tenantId).eq('identifier', args.identifier)).unique();
        if (!invoice)
            return null;
        const amount = number(invoice.properties.amount), paid = number(invoice.properties.amount_paid);
        return { identifier: invoice.identifier, revision: invoice.revision, currency: 'USD' as const, amount: dollars(amount), amountPaid: dollars(paid), balanceDue: invoice.properties.status === 'voided' ? 0 : dollars(amount - paid), status: invoice.properties.status ?? 'draft' };
    },
});
export const history = query({
    args: { tenantId: v.string(), paginationOpts: paginationOptsValidator }, returns: historyResult,
    handler: async (ctx, args) => {
        checkRead(args.tenantId);
        checkPage(args.paginationOpts.numItems);
        const result = await paginator(ctx.db, schema).query('domainEvents').withIndex('by_tenant', q => q.eq('tenantId', args.tenantId)).order('desc').paginate(args.paginationOpts);
        return { page: result.page.map(r => ({ id: r._id, blueprint: r.blueprint, identifier: r.identifier, actorId: r.actorId, requestKey: r.requestKey, type: r.type, beforeJson: r.beforeJson, afterJson: r.afterJson, occurredAt: r.occurredAt, command: r.command ?? null, evidenceJson: r.evidenceJson ?? null, policyVersion: r.policyVersion ?? null })), isDone: result.isDone, continueCursor: result.continueCursor };
    },
});
export const listJobs = query({
    args: { tenantId: v.string(), paginationOpts: paginationOptsValidator }, returns: listResult,
    handler: async (ctx, args) => {
        checkRead(args.tenantId);
        checkPage(args.paginationOpts.numItems);
        const result = await paginator(ctx.db, schema).query('co_job').withIndex('by_tenant', q => q.eq('tenantId', args.tenantId)).order('desc').paginate(args.paginationOpts);
        return { page: result.page.map(r => ({ id: r._id, identifier: r.identifier, title: r.title, state: r.properties.status ?? 'pre_construction', revision: r.revision, updatedAt: r.updatedAt })), isDone: result.isDone, continueCursor: result.continueCursor };
    },
});
export const listLeads = query({
    args: { tenantId: v.string(), paginationOpts: paginationOptsValidator }, returns: listResult,
    handler: async (ctx, args) => {
        checkRead(args.tenantId);
        checkPage(args.paginationOpts.numItems);
        const result = await paginator(ctx.db, schema).query('co_lead').withIndex('by_tenant', q => q.eq('tenantId', args.tenantId)).order('desc').paginate(args.paginationOpts);
        return { page: result.page.map(r => ({ id: r._id, identifier: r.identifier, title: r.title, state: r.properties.stage ?? 'new', revision: r.revision, updatedAt: r.updatedAt })), isDone: result.isDone, continueCursor: result.continueCursor };
    },
});
