import { canonicalJson } from './port.js';
export const POLICY_VERSION = 'contractor-operations-v1';
export const INITIAL = {
    co_client: 'prospect', co_lead: 'new', co_site_visit: 'scheduled', co_scope: 'draft',
    co_proposal: 'draft', co_bid: 'preparing', co_contract: 'draft', co_job: 'pre_construction',
    co_subcontractor: 'prospect', co_change_order: 'draft', co_invoice: 'draft',
    co_daily_report: 'draft', co_campaign: 'draft', co_outreach: 'pending',
    co_automation_rule: 'draft', co_document: 'draft',
};
export const TRANSITIONS = {
    co_client: { prospect: ['active', 'archived'], active: ['on_hold', 'inactive'], on_hold: ['active', 'inactive'], inactive: ['active', 'archived'], archived: [] },
    co_lead: { new: ['qualifying', 'on_hold', 'lost'], qualifying: ['site_visit_scheduled', 'scope_in_progress', 'on_hold', 'lost'], site_visit_scheduled: ['scope_in_progress', 'on_hold', 'lost'], scope_in_progress: ['proposal_sent', 'on_hold', 'lost'], proposal_sent: ['bid_submitted', 'awarded', 'won', 'on_hold', 'lost'], bid_submitted: ['awarded', 'on_hold', 'lost'], awarded: ['won', 'on_hold', 'lost'], on_hold: ['qualifying', 'lost'], won: [], lost: [] },
    co_site_visit: { scheduled: ['completed', 'cancelled', 'rescheduled', 'no_show'], rescheduled: ['scheduled', 'cancelled'], completed: [], cancelled: [], no_show: ['rescheduled'] },
    co_scope: { draft: ['in_review'], in_review: ['draft', 'approved', 'rejected'], approved: ['superseded'], rejected: ['draft'], superseded: [] },
    co_proposal: { draft: ['in_review'], in_review: ['draft', 'sent'], sent: ['viewed', 'accepted', 'rejected', 'expired', 'revised'], viewed: ['accepted', 'rejected', 'expired', 'revised'], accepted: [], rejected: [], expired: [], revised: ['draft'] },
    co_bid: { preparing: ['submitted', 'withdrawn'], submitted: ['under_review', 'awarded', 'not_awarded', 'withdrawn'], under_review: ['awarded', 'not_awarded', 'withdrawn'], awarded: [], not_awarded: [], withdrawn: [] },
    co_contract: { draft: ['sent_for_signature', 'voided'], sent_for_signature: ['partially_signed', 'fully_executed', 'voided', 'expired'], partially_signed: ['fully_executed', 'voided', 'expired'], fully_executed: [], voided: [], expired: [] },
    co_job: { pre_construction: ['mobilizing', 'on_hold', 'cancelled'], mobilizing: ['active', 'on_hold', 'cancelled'], active: ['punch_list', 'on_hold', 'cancelled'], on_hold: ['mobilizing', 'active', 'cancelled'], punch_list: ['active', 'complete'], complete: ['closed'], closed: [], cancelled: [] },
    co_subcontractor: { prospect: ['prequalified', 'on_hold', 'blacklisted'], prequalified: ['active', 'on_hold', 'blacklisted'], active: ['on_hold', 'blacklisted'], on_hold: ['prequalified', 'blacklisted'], blacklisted: [] },
    co_change_order: { draft: ['submitted'], submitted: ['approved', 'rejected'], approved: ['executed'], rejected: [], executed: [] },
    co_invoice: { draft: ['sent', 'voided'], sent: ['viewed', 'overdue', 'voided'], viewed: ['overdue', 'voided'], overdue: ['voided'], partial_payment: ['overdue'], paid: [], voided: [] },
    co_daily_report: { draft: ['submitted'], submitted: ['approved'], approved: [] },
    co_campaign: { draft: ['active', 'archived'], active: ['paused', 'completed'], paused: ['active', 'completed', 'archived'], completed: ['archived'], archived: [] },
    co_outreach: { pending: ['sent', 'opted_out'], sent: ['delivered', 'opened', 'replied', 'no_response', 'opted_out'], delivered: ['opened', 'replied', 'no_response', 'opted_out'], opened: ['replied', 'no_response', 'opted_out'], no_response: ['replied', 'opted_out'], replied: ['converted', 'opted_out'], converted: [], opted_out: [] },
    co_automation_rule: { draft: ['active', 'archived'], active: ['paused', 'archived'], paused: ['active', 'archived'], archived: [] },
    co_document: { draft: ['in_review', 'archived'], in_review: ['draft', 'approved'], approved: ['published', 'archived'], published: ['archived'], archived: [] },
};
export function lifecycleField(bp) { return bp === 'co_lead' ? 'stage' : 'status'; }
export function currentState(bp, p) { return String(p[lifecycleField(bp)] ?? INITIAL[bp] ?? ''); }
export function assertTransition(bp, from, to) {
    if (!TRANSITIONS[bp]?.[from]?.includes(to))
        throw new Error(`INVALID_TRANSITION: ${bp} ${from} -> ${to}`);
}
/** USD v1: source values stay dollars; all arithmetic takes place in safe integer cents. */
export function minorUnits(value) {
    if (!Number.isFinite(value))
        throw new Error('INVALID_MONEY');
    const n = Math.round(value * 100);
    if (!Number.isSafeInteger(n) || Math.abs(n) > 1000000000000 || Math.abs(value * 100 - n) > 0.00001)
        throw new Error('INVALID_MONEY_PRECISION');
    return n;
}
export function positiveMoney(value) {
    const n = minorUnits(value);
    if (n <= 0)
        throw new Error('POSITIVE_AMOUNT_REQUIRED');
    return n;
}
export function dollars(n) {
    if (!Number.isSafeInteger(n) || Math.abs(n) > 1000000000000)
        throw new Error('MONEY_LIMIT');
    return n / 100;
}
const MANAGED = {
    co_lead: ['stage'], co_contract: ['signed_at'], co_proposal: ['sent_at'], co_bid: ['submitted_at'],
    co_invoice: ['amount_paid', 'paid_date', 'issued_date'],
    co_job: ['contract_amount', 'billed_to_date', 'collected_to_date', 'actual_end_date'],
    co_change_order: ['submitted_at', 'approved_at'], co_outreach: ['sent_at'], co_pricing_rule: ['is_active'],
};
const FINANCIAL = ['co_scope', 'co_proposal', 'co_bid', 'co_contract', 'co_invoice', 'co_change_order'];
/** Prevent the maintenance API from bypassing workflow/evidence checks. Null = new record. */
export function guardMaintenance(bp, before, after, beforeRelations = {}, afterRelations = {}) {
    if (bp === 'co_payment')
        throw new Error('USE_WORKFLOW: payment records are append-only');
    const field = lifecycleField(bp);
    if (before === null) {
        if (after[field] !== undefined && after[field] !== INITIAL[bp])
            throw new Error('INITIAL_STATE_REQUIRED');
    }
    else if (before[field] !== after[field])
        throw new Error('USE_WORKFLOW: lifecycle field');
    for (const key of MANAGED[bp] ?? []) {
        if (key === field)
            continue;
        if (before === null) {
            if (after[key] !== undefined && after[key] !== 0 && after[key] !== false)
                throw new Error(`MANAGED_FIELD: ${key}`);
        }
        else if (canonicalJson(before[key] ?? null) !== canonicalJson(after[key] ?? null))
            throw new Error(`MANAGED_FIELD: ${key}`);
    }
    if (before !== null && ((FINANCIAL.includes(bp) && !['draft', 'preparing'].includes(currentState(bp, before))) || (bp === 'co_daily_report' && currentState(bp, before) !== 'draft') || (bp === 'co_pricing_rule' && before.is_active === true))) {
        const scrub = (p) => Object.fromEntries(Object.entries(p).filter(([k]) => k !== 'notes'));
        if (canonicalJson(scrub(before)) !== canonicalJson(scrub(after)) || canonicalJson(beforeRelations) !== canonicalJson(afterRelations))
            throw new Error('FINALIZED_RECORD_IMMUTABLE');
    }
    if (bp === 'co_job' && before === null)
        throw new Error('USE_WORKFLOW: create job from signed contract');
    if (bp === 'co_subcontractor' && canonicalJson(beforeRelations.jobs ?? null) !== canonicalJson(afterRelations.jobs ?? null))
        throw new Error('USE_WORKFLOW: subcontractor job relationships');
    if (before !== null) {
        const beforeLinks = beforeRelations, afterLinks = afterRelations;
        for (const key of ['client', 'lead', 'contact', 'proposal', 'scope', 'bid', 'contract', 'job']) {
            if (beforeLinks[key] != null && canonicalJson(beforeLinks[key]) !== canonicalJson(afterLinks[key] ?? null))
                throw new Error('RELATION_REASSIGNMENT_REQUIRES_MIGRATION');
        }
    }
    if (before !== null && bp === 'co_job' && canonicalJson(beforeRelations) !== canonicalJson(afterRelations))
        throw new Error('USE_WORKFLOW: job relationships');
    for (const [key, value] of Object.entries(after)) {
        if (typeof value === 'number' && (/_percent$/.test(key) || key === 'percent_complete') && (value < 0 || value > 100))
            throw new Error('INVALID_PERCENTAGE');
    }
}
