// Table-specific dispatch. Every type assertion follows runtime property/relation validation.
import type { MutationCtx, QueryCtx } from './_generated/server.js';
import type { Doc } from './_generated/dataModel.js';
import type { Infer } from 'convex/values';
import { ConvexError } from 'convex/values';
import { domainProperties, domainRelations } from './domainValidators.js';
import { validateProperties, validateRelations } from '../shared/domain.js';
import { checkLinks } from './domainRuntime.js';
import type { Blueprint } from '../shared/model.js';
import type { NewRecord, StoredRecord } from '../shared/businessTypes.js';
export function unpack(blueprint: Blueprint, row: Doc<Blueprint> | null, tenantId: string): StoredRecord | null {
    if (!row || row.tenantId !== tenantId)
        return null;
    return { id: row._id, blueprint, tenantId, identifier: row.identifier, title: row.title,
        properties: validateProperties(blueprint, row.properties), relations: validateRelations(blueprint, row.relations), revision: row.revision };
}
export async function readRecord(ctx: QueryCtx, tenantId: string, blueprint: Blueprint, identifier: string): Promise<StoredRecord | null> {
    switch (blueprint) {
        case 'co_client': return unpack(blueprint, await ctx.db.query('co_client').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_contact': return unpack(blueprint, await ctx.db.query('co_contact').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_lead': return unpack(blueprint, await ctx.db.query('co_lead').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_site_visit': return unpack(blueprint, await ctx.db.query('co_site_visit').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_scope': return unpack(blueprint, await ctx.db.query('co_scope').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_trade_spec': return unpack(blueprint, await ctx.db.query('co_trade_spec').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_pricing_rule': return unpack(blueprint, await ctx.db.query('co_pricing_rule').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_proposal': return unpack(blueprint, await ctx.db.query('co_proposal').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_bid': return unpack(blueprint, await ctx.db.query('co_bid').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_contract': return unpack(blueprint, await ctx.db.query('co_contract').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_job': return unpack(blueprint, await ctx.db.query('co_job').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_subcontractor': return unpack(blueprint, await ctx.db.query('co_subcontractor').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_change_order': return unpack(blueprint, await ctx.db.query('co_change_order').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_invoice': return unpack(blueprint, await ctx.db.query('co_invoice').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_payment': return unpack(blueprint, await ctx.db.query('co_payment').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_daily_report': return unpack(blueprint, await ctx.db.query('co_daily_report').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_campaign': return unpack(blueprint, await ctx.db.query('co_campaign').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_outreach': return unpack(blueprint, await ctx.db.query('co_outreach').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_automation_rule': return unpack(blueprint, await ctx.db.query('co_automation_rule').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
        case 'co_document': return unpack(blueprint, await ctx.db.query('co_document').withIndex('by_tenant_identifier', q => q.eq('tenantId', tenantId).eq('identifier', identifier)).unique(), tenantId);
    }
}
export async function insertRecord(ctx: MutationCtx, blueprint: Blueprint, r: NewRecord, eventId: string, now: number): Promise<string> {
    const lastEventId = ctx.db.normalizeId('domainEvents', eventId);
    if (!lastEventId)
        throw new ConvexError('INVALID_EVENT_ID');
    await checkLinks(ctx, r.tenantId, blueprint, r.relations);
    switch (blueprint) {
        case 'co_client': return ctx.db.insert('co_client', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_client>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_client>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_contact': return ctx.db.insert('co_contact', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_contact>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_contact>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_lead': return ctx.db.insert('co_lead', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_lead>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_lead>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_site_visit': return ctx.db.insert('co_site_visit', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_site_visit>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_site_visit>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_scope': return ctx.db.insert('co_scope', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_scope>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_scope>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_trade_spec': return ctx.db.insert('co_trade_spec', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_trade_spec>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_trade_spec>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_pricing_rule': return ctx.db.insert('co_pricing_rule', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_pricing_rule>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_pricing_rule>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_proposal': return ctx.db.insert('co_proposal', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_proposal>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_proposal>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_bid': return ctx.db.insert('co_bid', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_bid>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_bid>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_contract': return ctx.db.insert('co_contract', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_contract>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_contract>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_job': return ctx.db.insert('co_job', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_job>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_job>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_subcontractor': return ctx.db.insert('co_subcontractor', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_subcontractor>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_subcontractor>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_change_order': return ctx.db.insert('co_change_order', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_change_order>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_change_order>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_invoice': return ctx.db.insert('co_invoice', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_invoice>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_invoice>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_payment': return ctx.db.insert('co_payment', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_payment>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_payment>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_daily_report': return ctx.db.insert('co_daily_report', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_daily_report>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_daily_report>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_campaign': return ctx.db.insert('co_campaign', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_campaign>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_campaign>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_outreach': return ctx.db.insert('co_outreach', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_outreach>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_outreach>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_automation_rule': return ctx.db.insert('co_automation_rule', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_automation_rule>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_automation_rule>, createdAt: now, updatedAt: now, lastEventId });
        case 'co_document': return ctx.db.insert('co_document', { ...r, properties: validateProperties(blueprint, r.properties) as Infer<typeof domainProperties.co_document>, relations: validateRelations(blueprint, r.relations) as Infer<typeof domainRelations.co_document>, createdAt: now, updatedAt: now, lastEventId });
    }
}
export async function patchRecord(ctx: MutationCtx, r: StoredRecord, eventId: string, now: number): Promise<void> {
    const lastEventId = ctx.db.normalizeId('domainEvents', eventId);
    if (!lastEventId)
        throw new ConvexError('INVALID_EVENT_ID');
    await checkLinks(ctx, r.tenantId, r.blueprint, r.relations);
    switch (r.blueprint) {
        case 'co_client': {
            const id = ctx.db.normalizeId('co_client', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_client>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_client>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_contact': {
            const id = ctx.db.normalizeId('co_contact', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_contact>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_contact>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_lead': {
            const id = ctx.db.normalizeId('co_lead', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_lead>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_lead>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_site_visit': {
            const id = ctx.db.normalizeId('co_site_visit', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_site_visit>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_site_visit>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_scope': {
            const id = ctx.db.normalizeId('co_scope', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_scope>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_scope>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_trade_spec': {
            const id = ctx.db.normalizeId('co_trade_spec', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_trade_spec>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_trade_spec>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_pricing_rule': {
            const id = ctx.db.normalizeId('co_pricing_rule', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_pricing_rule>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_pricing_rule>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_proposal': {
            const id = ctx.db.normalizeId('co_proposal', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_proposal>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_proposal>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_bid': {
            const id = ctx.db.normalizeId('co_bid', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_bid>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_bid>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_contract': {
            const id = ctx.db.normalizeId('co_contract', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_contract>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_contract>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_job': {
            const id = ctx.db.normalizeId('co_job', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_job>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_job>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_subcontractor': {
            const id = ctx.db.normalizeId('co_subcontractor', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_subcontractor>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_subcontractor>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_change_order': {
            const id = ctx.db.normalizeId('co_change_order', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_change_order>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_change_order>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_invoice': {
            const id = ctx.db.normalizeId('co_invoice', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_invoice>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_invoice>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_payment': {
            const id = ctx.db.normalizeId('co_payment', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_payment>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_payment>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_daily_report': {
            const id = ctx.db.normalizeId('co_daily_report', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_daily_report>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_daily_report>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_campaign': {
            const id = ctx.db.normalizeId('co_campaign', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_campaign>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_campaign>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_outreach': {
            const id = ctx.db.normalizeId('co_outreach', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_outreach>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_outreach>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_automation_rule': {
            const id = ctx.db.normalizeId('co_automation_rule', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_automation_rule>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_automation_rule>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
        case 'co_document': {
            const id = ctx.db.normalizeId('co_document', r.id);
            if (!id)
                throw new ConvexError('INVALID_RECORD_ID');
            const previous = await ctx.db.get(id);
            if (!previous || previous.tenantId !== r.tenantId || previous.identifier !== r.identifier)
                throw new ConvexError('ENTITY_NOT_FOUND');
            await ctx.db.patch(id, { title: r.title, properties: validateProperties(r.blueprint, r.properties) as Infer<typeof domainProperties.co_document>, relations: validateRelations(r.blueprint, r.relations) as Infer<typeof domainRelations.co_document>, revision: r.revision, updatedAt: now, lastEventId });
            return;
        }
    }
}
