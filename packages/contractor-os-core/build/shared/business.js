/** Executable business operations. No network side effects; all writes use one transaction port. */
import { boundedString, canonicalJson, object, validateWorkflowInput } from './port.js';
import { definition, validateProperties, validateRelations } from './domain.js';
import { WORKFLOW_CONTRACTS } from './model.js';
import { POLICY_VERSION, assertTransition, currentState, lifecycleField, minorUnits, positiveMoney, dollars } from './businessPolicy.js';
export { minorUnits, guardMaintenance } from './businessPolicy.js';
const refKey = (bp, identifier) => `${bp}/${identifier}`;
const omit = (input, keys) => Object.fromEntries(Object.entries(input).filter(([key]) => !keys.includes(key)));
const pick = (input, keys) => Object.fromEntries(Object.entries(input).filter(([key]) => keys.includes(key)));
function one(row, key, required = true) {
    const value = row.relations[key];
    if (value === null || value === undefined) {
        if (required)
            throw new Error(`RELATION_REQUIRED: ${row.blueprint}.${key}`);
        return null;
    }
    if (Array.isArray(value))
        throw new Error(`AMBIGUOUS_RELATION: ${row.blueprint}.${key}`);
    return value;
}
function timestamp(value) { validateProperties('co_payment', { payment_date: value }); return Date.parse(value); }
function amount(row, key) {
    const value = row.properties[key];
    if (typeof value !== 'number')
        throw new Error(`AMOUNT_REQUIRED: ${key}`);
    return minorUnits(value);
}
function nonnegative(input, keys) {
    for (const key of keys) {
        const v = input[key];
        if (v !== undefined && (typeof v !== 'number' || v < 0 || !Number.isFinite(v)))
            throw new Error(`NONNEGATIVE_REQUIRED: ${key}`);
    }
}
export async function executeBusinessCommand(store, args) {
    boundedString(args.tenantId, 'INVALID_TENANT', 256);
    boundedString(args.actorId, 'INVALID_ACTOR', 2048);
    boundedString(args.requestKey, 'INVALID_REQUEST_KEY', 160);
    if (!object(args.command) || typeof args.command.kind !== 'string' || !object(args.command.input))
        throw new Error('INVALID_COMMAND');
    if (args.evidence) {
        if (!args.mayAttest)
            throw new Error('ATTESTATION_FORBIDDEN');
        boundedString(args.evidence.kind, 'INVALID_EVIDENCE_KIND', 80);
        boundedString(args.evidence.reference, 'EVIDENCE_REFERENCE_REQUIRED', 1024);
        if (timestamp(args.evidence.occurredAt) > store.now)
            throw new Error('FUTURE_EVIDENCE');
        if (args.evidence.note !== undefined && args.evidence.note.length > 4000)
            throw new Error('EVIDENCE_LIMIT');
    }
    if (!Number.isFinite(store.now))
        throw new Error('INVALID_CLOCK');
    const signature = canonicalJson({ actorId: args.actorId, mayAttest: args.mayAttest, command: args.command, expected: args.expected ?? [], evidence: args.evidence ?? null });
    if (new TextEncoder().encode(signature).byteLength > 100000)
        throw new Error('COMMAND_LIMIT');
    const prior = await store.receipt(args.requestKey);
    if (prior) {
        if (prior.signature !== signature)
            throw new Error('IDEMPOTENCY_KEY_CONFLICT');
        return { ...prior.result, replayed: true };
    }
    const kind = args.command.kind;
    const input = Object.hasOwn(WORKFLOW_CONTRACTS, kind) ? validateWorkflowInput(kind, args.command.input) : JSON.parse(canonicalJson(args.command.input));
    const expected = new Map();
    if ((args.expected?.length ?? 0) > 20)
        throw new Error('PRECONDITION_LIMIT');
    for (const r of args.expected ?? []) {
        definition(r.blueprint);
        boundedString(r.identifier, 'INVALID_IDENTIFIER');
        if (!Number.isSafeInteger(r.revision) || r.revision < 1)
            throw new Error('INVALID_REVISION');
        const k = refKey(r.blueprint, r.identifier);
        if (expected.has(k))
            throw new Error('DUPLICATE_PRECONDITION');
        expected.set(k, r.revision);
    }
    const effects = [];
    let primary;
    function checked(row, bp) {
        if (!row || row.tenantId !== args.tenantId || row.blueprint !== bp)
            throw new Error('ENTITY_NOT_FOUND');
        validateProperties(bp, row.properties);
        validateRelations(bp, row.relations);
        return row;
    }
    async function lineage(row) {
        const clientId = one(row, 'client', false);
        if (!clientId)
            return row;
        for (const key of ['contact', 'lead', 'proposal', 'bid', 'contract', 'job']) {
            const relation = definition(row.blueprint).relations[key];
            if (!relation || !Object.hasOwn(definition(relation.target).relations, 'client'))
                continue;
            const targetId = one(row, key, false);
            if (!targetId)
                continue;
            const target = checked(await store.loadId(relation.target, targetId), relation.target);
            if (one(target, 'client') !== clientId)
                throw new Error('CLIENT_MISMATCH');
        }
        return row;
    }
    async function load(bp, identifier) { boundedString(identifier, 'INVALID_IDENTIFIER'); return lineage(checked(await store.load(bp, identifier), bp)); }
    async function byId(bp, id) { return lineage(checked(await store.loadId(bp, id), bp)); }
    async function linked(row, key, bp) { return byId(bp, one(row, key)); }
    async function validateLinks(bp, relations) {
        validateRelations(bp, relations);
        for (const [key, value] of Object.entries(relations))
            for (const id of value === null ? [] : Array.isArray(value) ? value : [value])
                await byId(definition(bp).relations[key].target, id);
    }
    function precondition(row) {
        const revision = expected.get(refKey(row.blueprint, row.identifier));
        if (revision === undefined)
            throw new Error(`PRECONDITION_REQUIRED: ${row.blueprint}/${row.identifier}`);
        if (revision !== row.revision)
            throw new Error('REVISION_CONFLICT');
    }
    function str(key) { const value = input[key]; boundedString(value, `REQUIRED_INPUT: ${key}`, 512); return value; }
    function num(key) {
        const value = input[key];
        if (typeof value !== 'number' || !Number.isFinite(value))
            throw new Error(`REQUIRED_NUMBER: ${key}`);
        return value;
    }
    function attestation(requiredKind) {
        if (!args.mayAttest)
            throw new Error('ATTESTATION_FORBIDDEN');
        const ev = args.evidence;
        if (!ev || ev.kind !== requiredKind)
            throw new Error(`ATTESTATION_REQUIRED: ${requiredKind}`);
        boundedString(ev.reference, 'EVIDENCE_REFERENCE_REQUIRED', 1024);
        const occurred = timestamp(ev.occurredAt);
        if (occurred > store.now)
            throw new Error('FUTURE_EVIDENCE');
        if (ev.note !== undefined && ev.note.length > 4000)
            throw new Error('EVIDENCE_LIMIT');
        return ev;
    }
    async function sameClient(row, client) {
        if (one(row, 'client') !== client.id)
            throw new Error('CLIENT_MISMATCH');
    }
    async function contactRelations(client) {
        if (input.contact === undefined)
            return {};
        const contact = await load('co_contact', str('contact'));
        await sameClient(contact, client);
        return { contact: contact.id };
    }
    const entitySnapshot = (r) => ({ identifier: r.identifier, title: r.title, properties: r.properties, relations: r.relations, revision: r.revision });
    async function write(before, bp, identifier, title, properties, relations) {
        boundedString(identifier, 'INVALID_IDENTIFIER');
        if (title !== null && title.length > 512)
            throw new Error('INVALID_TITLE');
        validateProperties(bp, properties);
        await validateLinks(bp, relations);
        if (before) {
            precondition(before);
            if (effects.some(e => e.id === before.id))
                throw new Error('DUPLICATE_EFFECT');
        }
        else if (await store.load(bp, identifier))
            throw new Error('ENTITY_EXISTS');
        const revision = (before?.revision ?? 0) + 1;
        if (!Number.isSafeInteger(revision))
            throw new Error('REVISION_LIMIT');
        const after = { tenantId: args.tenantId, identifier, title, properties, relations, revision };
        const eventId = await store.event({ tenantId: args.tenantId, actorId: args.actorId, blueprint: bp, identifier, requestKey: args.requestKey, type: before ? 'record.updated' : 'record.created',
            beforeJson: before ? canonicalJson(entitySnapshot(before)) : null, afterJson: canonicalJson(after), occurredAt: store.now, command: kind, evidenceJson: args.evidence ? canonicalJson({ ...args.evidence, source: 'manual_attestation', recordedBy: args.actorId }) : null, policyVersion: POLICY_VERSION });
        let id;
        if (before) {
            id = before.id;
            await store.save({ ...before, ...after }, eventId);
        }
        else
            id = await store.create(bp, after, eventId);
        const effect = { blueprint: bp, identifier, id, revision, eventId, operation: before ? 'updated' : 'created' };
        effects.push(effect);
        return effect;
    }
    async function update(row, properties, relations = row.relations) { return write(row, row.blueprint, row.identifier, row.title, { ...row.properties, ...properties }, relations); }
    async function create(bp, identifier, title, properties, relations = {}) { return write(null, bp, identifier, title, properties, relations); }
    async function advance(lead, to, extra = {}) { assertTransition('co_lead', currentState('co_lead', lead.properties), to); return update(lead, { ...extra, stage: to }); }
    function id(prefix) { return `${prefix}-${args.requestKey}`; }
    async function signedContract(contract) {
        if (contract.properties.status !== 'fully_executed' || typeof contract.properties.signed_at !== 'string')
            throw new Error('SIGNED_CONTRACT_REQUIRED');
        timestamp(contract.properties.signed_at);
        positiveMoney(dollars(amount(contract, 'amount')));
    }
    async function jobLinks(job) { const client = await linked(job, 'client', 'co_client'), contract = await linked(job, 'contract', 'co_contract'); await sameClient(contract, client); await signedContract(contract); return { client, contract }; }
    async function invoiceLinks(invoice) {
        const job = await linked(invoice, 'job', 'co_job'), { client, contract } = await jobLinks(job);
        await sameClient(invoice, client);
        if (one(invoice, 'contract') !== contract.id)
            throw new Error('CONTRACT_MISMATCH');
        return { job, client, contract };
    }
    for (const r of args.expected ?? [])
        precondition(await load(r.blueprint, r.identifier));
    switch (kind) {
        case 'co_create_lead': {
            const client = await load('co_client', str('client'));
            if (input.stage !== 'new')
                throw new Error('INITIAL_STATE_REQUIRED');
            nonnegative(input, ['estimated_value']);
            primary = await create('co_lead', id('lead'), str('title'), omit(input, ['title', 'client', 'contact']), { client: client.id, ...await contactRelations(client) });
            break;
        }
        case 'co_schedule_site_visit': {
            const lead = await load('co_lead', str('lead'));
            const client = await linked(lead, 'client', 'co_client');
            timestamp(str('visit_date'));
            if (timestamp(str('visit_date')) <= store.now)
                throw new Error('VISIT_MUST_BE_FUTURE');
            assertTransition('co_lead', currentState('co_lead', lead.properties), 'site_visit_scheduled');
            precondition(lead);
            primary = await create('co_site_visit', id('visit'), `Site Visit — ${lead.identifier}`, { ...omit(input, ['lead']), status: 'scheduled' }, { lead: lead.id, client: client.id, ...(one(lead, 'contact', false) ? { contact: one(lead, 'contact') } : {}) });
            await advance(lead, 'site_visit_scheduled');
            break;
        }
        case 'co_advance_lead': {
            const lead = await load('co_lead', str('lead')), to = str('new_stage');
            if (!['qualifying', 'on_hold', 'lost'].includes(to))
                throw new Error('USE_SPECIALIZED_WORKFLOW');
            if (to === 'lost' && (typeof input.followup_notes !== 'string' || !input.followup_notes.trim()))
                throw new Error('LOST_REASON_REQUIRED');
            primary = await advance(lead, to, pick(input, ['followup_notes', 'next_followup_date']));
            break;
        }
        case 'co_create_scope': {
            const lead = await load('co_lead', str('lead'));
            await linked(lead, 'client', 'co_client');
            nonnegative(input, ['estimated_hours', 'estimated_labor_cost', 'estimated_materials_cost']);
            if (currentState('co_lead', lead.properties) !== 'scope_in_progress') {
                assertTransition('co_lead', currentState('co_lead', lead.properties), 'scope_in_progress');
                precondition(lead);
            }
            primary = await create('co_scope', `scope-${lead.identifier}-v${str('version')}`, `Scope — ${lead.identifier}`, { ...omit(input, ['lead']), status: 'draft' }, { lead: lead.id });
            if (currentState('co_lead', lead.properties) !== 'scope_in_progress')
                await advance(lead, 'scope_in_progress');
            break;
        }
        case 'co_create_proposal': {
            const lead = await load('co_lead', str('lead')), client = await load('co_client', str('client')), scope = await load('co_scope', str('scope'));
            await sameClient(lead, client);
            if (one(scope, 'lead') !== lead.id)
                throw new Error('LEAD_MISMATCH');
            if (scope.properties.status !== 'approved')
                throw new Error('APPROVED_SCOPE_REQUIRED');
            positiveMoney(num('amount'));
            if (input.expires_at !== undefined && timestamp(str('expires_at')) <= store.now)
                throw new Error('EXPIRY_MUST_BE_FUTURE');
            primary = await create('co_proposal', `proposal-${lead.identifier}-v${str('version')}`, `Proposal — ${lead.identifier}`, { ...omit(input, ['lead', 'client', 'scope']), status: 'draft', currency: 'USD' }, { client: client.id, lead: lead.id, scope: scope.id });
            break;
        }
        case 'co_submit_bid': {
            const ev = attestation('bid_submitted'), proposal = await load('co_proposal', str('proposal')), lead = await load('co_lead', str('lead')), client = await load('co_client', str('client'));
            await sameClient(proposal, client);
            await sameClient(lead, client);
            if (one(proposal, 'lead') !== lead.id)
                throw new Error('LEAD_MISMATCH');
            if (!['sent', 'viewed', 'accepted'].includes(String(proposal.properties.status)))
                throw new Error('READY_PROPOSAL_REQUIRED');
            if (proposal.properties.currency !== 'USD')
                throw new Error('CURRENCY_NOT_SUPPORTED');
            if (positiveMoney(num('amount')) !== amount(proposal, 'amount'))
                throw new Error('PROPOSAL_AMOUNT_MISMATCH');
            if (input.submission_deadline !== undefined && timestamp(ev.occurredAt) > timestamp(str('submission_deadline')))
                throw new Error('BID_SUBMITTED_AFTER_DEADLINE');
            assertTransition('co_lead', currentState('co_lead', lead.properties), 'bid_submitted');
            precondition(lead);
            primary = await create('co_bid', input.bid_number ? `bid-${str('bid_number')}` : id('bid'), `Bid — ${lead.identifier}`, { ...omit(input, ['proposal', 'lead', 'client']), status: 'submitted', submitted_at: ev.occurredAt }, { proposal: proposal.id, lead: lead.id, client: client.id });
            await advance(lead, 'bid_submitted');
            break;
        }
        case 'co_convert_bid_to_contract': {
            attestation('bid_awarded');
            const bid = await load('co_bid', str('bid')), client = await load('co_client', str('client'));
            await sameClient(bid, client);
            if (!['submitted', 'under_review', 'awarded'].includes(String(bid.properties.status)))
                throw new Error('BID_NOT_AWARDABLE');
            const lead = await linked(bid, 'lead', 'co_lead');
            await sameClient(lead, client);
            positiveMoney(dollars(amount(bid, 'amount')));
            if (num('retainage_percent') < 0 || num('retainage_percent') > 100)
                throw new Error('INVALID_PERCENTAGE');
            if (input.start_date !== undefined && input.end_date !== undefined && timestamp(str('end_date')) < timestamp(str('start_date')))
                throw new Error('INVALID_DATE_RANGE');
            if (bid.properties.status !== 'awarded')
                precondition(bid);
            if (lead.properties.stage !== 'awarded') {
                assertTransition('co_lead', currentState('co_lead', lead.properties), 'awarded');
                precondition(lead);
            }
            primary = await create('co_contract', `contract-${bid.identifier}`, `Contract — ${bid.identifier}`, { ...omit(input, ['bid', 'client', 'contact']), status: 'draft', amount: dollars(amount(bid, 'amount')) }, { bid: bid.id, client: client.id, ...await contactRelations(client) });
            if (bid.properties.status !== 'awarded')
                await update(bid, { status: 'awarded' });
            if (lead.properties.stage !== 'awarded')
                await advance(lead, 'awarded');
            break;
        }
        case 'co_mark_contract_signed': {
            const ev = attestation('contract_signed'), contract = await load('co_contract', str('contract'));
            if (!['draft', 'sent_for_signature', 'partially_signed'].includes(String(contract.properties.status)))
                throw new Error('CONTRACT_NOT_SIGNABLE');
            await linked(contract, 'client', 'co_client');
            positiveMoney(dollars(amount(contract, 'amount')));
            if (typeof input.contract_doc_url !== 'string' || !input.contract_doc_url)
                throw new Error('SIGNED_DOCUMENT_REQUIRED');
            primary = await update(contract, { ...omit(input, ['contract']), status: 'fully_executed', signed_at: ev.occurredAt });
            break;
        }
        case 'co_create_job': {
            const contract = await load('co_contract', str('contract')), client = await load('co_client', str('client'));
            await signedContract(contract);
            await sameClient(contract, client);
            if (await store.hasJobForContract(contract.id))
                throw new Error('CONTRACT_ALREADY_HAS_JOB');
            const bidId = one(contract, 'bid', false);
            let lead = null;
            if (bidId) {
                const bid = await byId('co_bid', bidId);
                await sameClient(bid, client);
                lead = await linked(bid, 'lead', 'co_lead');
                await sameClient(lead, client);
                if (lead.properties.stage !== 'won') {
                    assertTransition('co_lead', currentState('co_lead', lead.properties), 'won');
                    precondition(lead);
                }
            }
            primary = await create('co_job', `job-${str('job_number')}`, `Job #${str('job_number')}`, { ...omit(input, ['contract', 'client']), status: 'pre_construction', contract_amount: dollars(amount(contract, 'amount')), billed_to_date: 0, collected_to_date: 0, percent_complete: 0 }, { contract: contract.id, client: client.id, ...(bidId ? { bid: bidId } : {}), ...(one(contract, 'contact', false) ? { contact: one(contract, 'contact') } : {}) });
            if (lead && lead.properties.stage !== 'won')
                await advance(lead, 'won');
            break;
        }
        case 'co_create_invoice': {
            const job = await load('co_job', str('job')), client = await load('co_client', str('client')), { contract } = await jobLinks(job);
            await sameClient(job, client);
            if (['closed', 'cancelled'].includes(String(job.properties.status)))
                throw new Error('JOB_NOT_BILLABLE');
            if (input.contract !== undefined && (await load('co_contract', str('contract'))).id !== contract.id)
                throw new Error('CONTRACT_MISMATCH');
            positiveMoney(num('amount'));
            timestamp(str('due_date'));
            primary = await create('co_invoice', `inv-${str('invoice_number')}`, `Invoice #${str('invoice_number')}`, { ...omit(input, ['job', 'client', 'contract']), status: 'draft', amount_paid: 0 }, { job: job.id, client: client.id, contract: contract.id });
            break;
        }
        case 'co_record_payment': {
            const ev = attestation('payment_received');
            if (await store.evidenceUsed(ev.kind, ev.reference))
                throw new Error('EVIDENCE_ALREADY_USED');
            const invoice = await load('co_invoice', str('invoice')), client = await load('co_client', str('client')), { job } = await invoiceLinks(invoice);
            await sameClient(invoice, client);
            if (!['sent', 'viewed', 'partial_payment', 'overdue'].includes(String(invoice.properties.status)))
                throw new Error('INVOICE_NOT_PAYABLE');
            if (timestamp(str('payment_date')) > store.now)
                throw new Error('FUTURE_PAYMENT');
            const paid = positiveMoney(num('amount')), old = amount(invoice, 'amount_paid'), total = amount(invoice, 'amount');
            if (old < 0 || old > total)
                throw new Error('INVALID_INVOICE_BALANCE');
            if (paid > total - old)
                throw new Error('OVERPAYMENT');
            if (amount(job, 'collected_to_date') + paid > amount(job, 'billed_to_date'))
                throw new Error('JOB_BALANCE_INCONSISTENT');
            precondition(invoice);
            precondition(job);
            primary = await create('co_payment', id('pay'), `Payment — ${invoice.identifier}`, omit(input, ['invoice', 'client']), { invoice: invoice.id, client: client.id });
            await update(invoice, { amount_paid: dollars(old + paid), status: old + paid === total ? 'paid' : 'partial_payment', ...(old + paid === total ? { paid_date: str('payment_date') } : {}) });
            await update(job, { collected_to_date: dollars(amount(job, 'collected_to_date') + paid) });
            await store.claimEvidence(ev.kind, ev.reference);
            break;
        }
        case 'transition': {
            const bp = str('blueprint');
            definition(bp);
            const row = await load(bp, str('identifier')), to = str('to'), from = currentState(bp, row.properties);
            assertTransition(bp, from, to);
            if (bp === 'co_lead')
                throw new Error('USE_SPECIALIZED_WORKFLOW');
            let props = { [lifecycleField(bp)]: to };
            if (bp === 'co_scope' && to === 'approved') {
                attestation('scope_approved');
                if (typeof row.properties.description !== 'string' || !row.properties.description.trim())
                    throw new Error('SCOPE_DESCRIPTION_REQUIRED');
            }
            if (bp === 'co_proposal' && ['sent', 'viewed', 'accepted', 'rejected'].includes(to)) {
                const ev = attestation(`proposal_${to}`);
                const lead = await linked(row, 'lead', 'co_lead'), client = await linked(row, 'client', 'co_client'), scope = await linked(row, 'scope', 'co_scope');
                await sameClient(lead, client);
                if (one(scope, 'lead') !== lead.id)
                    throw new Error('LEAD_MISMATCH');
                if (to === 'sent') {
                    if (scope.properties.status !== 'approved')
                        throw new Error('APPROVED_SCOPE_REQUIRED');
                    positiveMoney(dollars(amount(row, 'amount')));
                    if (row.properties.currency !== 'USD')
                        throw new Error('CURRENCY_NOT_SUPPORTED');
                    if (row.properties.expires_at && timestamp(String(row.properties.expires_at)) < timestamp(ev.occurredAt))
                        throw new Error('PROPOSAL_EXPIRED');
                    props.sent_at = ev.occurredAt;
                    await advance(lead, 'proposal_sent');
                }
            }
            if (bp === 'co_bid' && ['submitted', 'awarded'].includes(to))
                throw new Error('USE_SPECIALIZED_WORKFLOW');
            if (bp === 'co_contract') {
                if (to === 'fully_executed')
                    throw new Error('USE_SPECIALIZED_WORKFLOW');
                if (['sent_for_signature', 'partially_signed'].includes(to))
                    attestation(`contract_${to}`);
            }
            if (bp === 'co_job') {
                await jobLinks(row);
                if (to === 'complete')
                    props = { ...props, percent_complete: 100, actual_end_date: new Date(store.now).toISOString() };
                if (to === 'closed' && amount(row, 'billed_to_date') !== amount(row, 'collected_to_date'))
                    throw new Error('OUTSTANDING_BALANCE');
                if (to === 'closed' && amount(row, 'billed_to_date') !== amount(row, 'contract_amount'))
                    throw new Error('UNBILLED_CONTRACT_BALANCE');
                if (to === 'cancelled' && (amount(row, 'billed_to_date') !== 0 || amount(row, 'collected_to_date') !== 0))
                    throw new Error('POSTED_JOB_CANNOT_CANCEL');
            }
            if (bp === 'co_invoice') {
                const { job } = await invoiceLinks(row);
                const paid = amount(row, 'amount_paid'), total = amount(row, 'amount');
                if (to === 'sent') {
                    const ev = attestation('invoice_issued');
                    if (['closed', 'cancelled'].includes(String(job.properties.status)))
                        throw new Error('JOB_NOT_BILLABLE');
                    positiveMoney(dollars(total));
                    const billed = amount(job, 'billed_to_date');
                    if (billed + total > amount(job, 'contract_amount'))
                        throw new Error('OVERBILLING');
                    props.issued_date = ev.occurredAt;
                    await update(job, { billed_to_date: dollars(billed + total) });
                }
                else if (to === 'voided') {
                    attestation('invoice_voided');
                    if (paid !== 0)
                        throw new Error('PAID_INVOICE_CANNOT_VOID');
                    if (from !== 'draft') {
                        if (amount(job, 'billed_to_date') < total)
                            throw new Error('JOB_BALANCE_INCONSISTENT');
                        await update(job, { billed_to_date: dollars(amount(job, 'billed_to_date') - total) });
                    }
                }
                else if (to === 'viewed')
                    attestation('invoice_viewed');
                else if (to === 'overdue' && (timestamp(String(row.properties.due_date)) >= store.now || paid >= total))
                    throw new Error('NOT_OVERDUE');
            }
            if (bp === 'co_change_order') {
                const job = await linked(row, 'job', 'co_job'), contract = await linked(row, 'contract', 'co_contract');
                if (['closed', 'cancelled'].includes(String(job.properties.status)))
                    throw new Error('JOB_NOT_CHANGEABLE');
                if (one(job, 'contract') !== contract.id)
                    throw new Error('CONTRACT_MISMATCH');
                await signedContract(contract);
                if (to === 'submitted')
                    props.submitted_at = new Date(store.now).toISOString();
                if (to === 'approved') {
                    const ev = attestation('change_order_approved');
                    props.approved_at = ev.occurredAt;
                }
                if (to === 'executed') {
                    attestation('change_order_executed');
                    const revised = amount(job, 'contract_amount') + amount(row, 'amount');
                    if (revised < 0 || revised < amount(job, 'billed_to_date'))
                        throw new Error('CHANGE_BELOW_BILLED_AMOUNT');
                    await update(job, { contract_amount: dollars(revised) });
                }
            }
            if (bp === 'co_outreach' && ['sent', 'delivered', 'opened', 'replied', 'converted', 'opted_out'].includes(to)) {
                const ev = attestation(`outreach_${to}`);
                if (to === 'sent') {
                    const campaign = await linked(row, 'campaign', 'co_campaign');
                    if (campaign.properties.status !== 'active')
                        throw new Error('CAMPAIGN_NOT_ACTIVE');
                    const client = await linked(row, 'client', 'co_client');
                    const contact = await linked(row, 'contact', 'co_contact');
                    await sameClient(contact, client);
                    props.sent_at = ev.occurredAt;
                }
            }
            if (bp === 'co_daily_report' && to === 'submitted')
                throw new Error('USE_SPECIALIZED_WORKFLOW');
            if (bp === 'co_daily_report' && to === 'approved')
                attestation('daily_report_approved');
            if (bp === 'co_document' && ['approved', 'published'].includes(to))
                attestation(`document_${to}`);
            if (bp === 'co_automation_rule' && to === 'active')
                throw new Error('AUTOMATION_EXECUTOR_NOT_CONFIGURED');
            primary = await update(row, props);
            break;
        }
        case 'assign_subcontractor': {
            const job = await load('co_job', str('job')), sub = await load('co_subcontractor', str('subcontractor'));
            await jobLinks(job);
            if (!['pre_construction', 'mobilizing', 'active', 'on_hold'].includes(String(job.properties.status)))
                throw new Error('JOB_NOT_ASSIGNABLE');
            if (!['prequalified', 'active'].includes(String(sub.properties.status)))
                throw new Error('SUBCONTRACTOR_NOT_READY');
            if (sub.properties.w9_on_file !== true || timestamp(String(sub.properties.insurance_expiry)) <= store.now || timestamp(String(sub.properties.license_expiry)) <= store.now)
                throw new Error('SUBCONTRACTOR_DOCUMENTS_NOT_CURRENT');
            const subs = job.relations.subcontractors ?? [], jobs = sub.relations.jobs ?? [];
            if (!Array.isArray(subs) || !Array.isArray(jobs))
                throw new Error('INVALID_CARDINALITY');
            if (subs.includes(sub.id) || jobs.includes(job.id))
                throw new Error('ALREADY_ASSIGNED');
            precondition(job);
            precondition(sub);
            primary = await update(job, {}, { ...job.relations, subcontractors: [...subs, sub.id] });
            await update(sub, {}, { ...sub.relations, jobs: [...jobs, job.id] });
            break;
        }
        case 'submit_daily_report': {
            const job = await load('co_job', str('job'));
            await jobLinks(job);
            if (!['mobilizing', 'active', 'punch_list'].includes(String(job.properties.status)))
                throw new Error('JOB_NOT_REPORTABLE');
            if (timestamp(str('report_date')) > store.now)
                throw new Error('FUTURE_REPORT');
            if (!Number.isSafeInteger(num('crew_size')) || num('crew_size') < 0)
                throw new Error('INVALID_CREW_SIZE');
            boundedString(input.work_performed, 'WORK_PERFORMED_REQUIRED', 16000);
            primary = await create('co_daily_report', id('report'), `Report — ${job.identifier}`, { ...omit(input, ['job']), status: 'submitted' }, { job: job.id });
            break;
        }
        default: throw new Error('UNKNOWN_COMMAND');
    }
    if (!primary)
        throw new Error('NO_COMMAND_RESULT');
    const result = { policyVersion: POLICY_VERSION, requestKey: args.requestKey, primary, effects, replayed: false };
    await store.saveReceipt(args.requestKey, { signature, result });
    return result;
}
