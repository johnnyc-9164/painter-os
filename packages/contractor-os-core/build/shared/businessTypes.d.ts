import type { Blueprint } from './model.js';
import type { Json } from './port.js';
import type { RelationInput } from './domain.js';
import type { WorkflowInputs } from './workflowTypes.js';
export interface ExtraInputs {
    transition: {
        blueprint: Blueprint;
        identifier: string;
        to: string;
    };
    assign_subcontractor: {
        job: string;
        subcontractor: string;
    };
    submit_daily_report: {
        job: string;
        report_date: string;
        work_performed: string;
        crew_size: number;
        notes?: string;
    };
}
export type CommandInputs = WorkflowInputs & ExtraInputs;
export type CommandName = keyof CommandInputs;
export type BusinessCommand = {
    [K in CommandName]: {
        kind: K;
        input: CommandInputs[K];
    };
}[CommandName];
export interface RevisionPrecondition {
    blueprint: Blueprint;
    identifier: string;
    revision: number;
}
export interface Attestation {
    kind: string;
    reference: string;
    occurredAt: string;
    note?: string;
}
export interface BusinessArgs {
    requestKey: string;
    command: BusinessCommand;
    expected?: RevisionPrecondition[];
    evidence?: Attestation;
}
/** This envelope is added in the host after authentication, never accepted from a browser. */
export interface TrustedBusinessArgs extends BusinessArgs {
    tenantId: string;
    actorId: string;
    mayAttest: boolean;
}
export interface StoredRecord {
    id: string;
    blueprint: Blueprint;
    tenantId: string;
    identifier: string;
    title: string | null;
    properties: Record<string, Json>;
    relations: RelationInput;
    revision: number;
}
export type NewRecord = Omit<StoredRecord, 'id' | 'blueprint'>;
export interface Effect {
    blueprint: Blueprint;
    identifier: string;
    id: string;
    revision: number;
    eventId: string;
    operation: 'created' | 'updated';
}
export interface BusinessResult {
    policyVersion: string;
    requestKey: string;
    primary: Effect;
    effects: Effect[];
    replayed: boolean;
}
export interface BusinessEvent {
    tenantId: string;
    actorId: string;
    blueprint: Blueprint;
    identifier: string;
    requestKey: string;
    type: 'record.created' | 'record.updated';
    beforeJson: string | null;
    afterJson: string;
    occurredAt: number;
    command: string;
    evidenceJson: string | null;
    policyVersion: string;
}
/** ALL methods must participate in ONE transaction. Convex implements this in a single mutation. */
export interface BusinessStore {
    now: number;
    hasJobForContract(contractId: string): Promise<boolean>;
    load(blueprint: Blueprint, identifier: string): Promise<StoredRecord | null>;
    loadId(blueprint: Blueprint, id: string): Promise<StoredRecord | null>;
    create(blueprint: Blueprint, record: NewRecord, eventId: string): Promise<string>;
    save(record: StoredRecord, eventId: string): Promise<void>;
    event(event: BusinessEvent): Promise<string>;
    receipt(key: string): Promise<{
        signature: string;
        result: BusinessResult;
    } | null>;
    saveReceipt(key: string, value: {
        signature: string;
        result: BusinessResult;
    }): Promise<void>;
    evidenceUsed(kind: string, reference: string): Promise<boolean>;
    claimEvidence(kind: string, reference: string): Promise<void>;
}
