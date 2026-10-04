import { v } from 'convex/values';
import { blueprint } from './validators.js';
export const jobFinancialsResult = v.union(v.null(), v.object({
    identifier: v.string(), revision: v.number(), currency: v.literal('USD'), contractAmount: v.number(),
    billedToDate: v.number(), collectedToDate: v.number(), outstandingBalance: v.number(), billedReceivable: v.number(), remainingContractBalance: v.number(), unbilledContractAmount: v.number(),
}));
export const invoiceBalanceResult = v.union(v.null(), v.object({
    identifier: v.string(), revision: v.number(), currency: v.literal('USD'), amount: v.number(), amountPaid: v.number(), balanceDue: v.number(), status: v.string(),
}));
export const historyResult = v.object({ page: v.array(v.object({
        id: v.string(), blueprint, identifier: v.string(), actorId: v.string(), requestKey: v.string(), type: v.union(v.literal('record.created'), v.literal('record.updated')),
        beforeJson: v.union(v.string(), v.null()), afterJson: v.string(), occurredAt: v.number(), command: v.union(v.string(), v.null()),
        evidenceJson: v.union(v.string(), v.null()), policyVersion: v.union(v.string(), v.null()),
    })), isDone: v.boolean(), continueCursor: v.string() });
export const listResult = v.object({ page: v.array(v.object({
        id: v.string(), identifier: v.string(), title: v.union(v.string(), v.null()), state: v.string(), revision: v.number(), updatedAt: v.number(),
    })), isDone: v.boolean(), continueCursor: v.string() });
