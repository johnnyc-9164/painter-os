import { v } from 'convex/values';
import { blueprint } from './validators.js';
import { workflowInputValidators } from './workflowInputs.js';
export const commandInputs = { ...workflowInputValidators,
    transition: v.object({ blueprint, identifier: v.string(), to: v.string() }),
    assign_subcontractor: v.object({ job: v.string(), subcontractor: v.string() }),
    submit_daily_report: v.object({ job: v.string(), report_date: v.string(), work_performed: v.string(), crew_size: v.number(), notes: v.optional(v.string()) }),
};
export const expected = v.array(v.object({ blueprint, identifier: v.string(), revision: v.number() }));
export const evidence = v.object({ kind: v.string(), reference: v.string(), occurredAt: v.string(), note: v.optional(v.string()) });
export const commandOptions = { requestKey: v.string(), expected: v.optional(expected), evidence: v.optional(evidence) };
export const trustedOptions = { ...commandOptions, tenantId: v.string(), actorId: v.string(), mayAttest: v.boolean() };
export const effect = v.object({ blueprint, identifier: v.string(), id: v.string(), revision: v.number(), eventId: v.string(), operation: v.union(v.literal('created'), v.literal('updated')) });
export const businessResult = v.object({ policyVersion: v.string(), requestKey: v.string(), primary: effect, effects: v.array(effect), replayed: v.boolean() });
export const businessCommand = v.union(v.object({ kind: v.literal('co_create_lead'), input: commandInputs.co_create_lead }), v.object({ kind: v.literal('co_schedule_site_visit'), input: commandInputs.co_schedule_site_visit }), v.object({ kind: v.literal('co_advance_lead'), input: commandInputs.co_advance_lead }), v.object({ kind: v.literal('co_create_scope'), input: commandInputs.co_create_scope }), v.object({ kind: v.literal('co_create_proposal'), input: commandInputs.co_create_proposal }), v.object({ kind: v.literal('co_submit_bid'), input: commandInputs.co_submit_bid }), v.object({ kind: v.literal('co_record_payment'), input: commandInputs.co_record_payment }), v.object({ kind: v.literal('co_create_job'), input: commandInputs.co_create_job }), v.object({ kind: v.literal('co_convert_bid_to_contract'), input: commandInputs.co_convert_bid_to_contract }), v.object({ kind: v.literal('co_mark_contract_signed'), input: commandInputs.co_mark_contract_signed }), v.object({ kind: v.literal('co_create_invoice'), input: commandInputs.co_create_invoice }), v.object({ kind: v.literal('transition'), input: commandInputs.transition }), v.object({ kind: v.literal('assign_subcontractor'), input: commandInputs.assign_subcontractor }), v.object({ kind: v.literal('submit_daily_report'), input: commandInputs.submit_daily_report }));
