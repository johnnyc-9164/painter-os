import { type Blueprint } from './model.js';
export type Json = null | boolean | number | string | Json[] | {
    [key: string]: Json;
};
export type Permission = 'read' | 'import' | 'write' | 'attest';
export interface Identity {
    tokenIdentifier: string;
}
export interface Membership {
    tenantId: string;
    permissions: readonly Permission[];
}
export interface TrustedScope {
    tenantId: string;
    actorId: string;
}
export interface ParsedEntity {
    blueprint: Blueprint;
    identifier: string;
    title: string | null;
    snapshotJson: string;
}
export interface Link {
    relation: string;
    position: number;
    targetIdentifier: string;
    targetBlueprint: string | null;
}
export declare const LIMITS: Readonly<{
    batchBytes: 250000;
    recordBytes: 100000;
    batchRecords: 25;
    linksPerRecord: 100;
    pageSize: 100;
    depth: 20;
}>;
export declare function object(value: unknown): value is Record<string, unknown>;
export declare function boundedString(value: unknown, code: string, max?: number): asserts value is string;
export declare function canonicalJson(value: unknown): string;
export declare function parseEntity(value: unknown): ParsedEntity;
export declare function entityKey(blueprint: string, identifier: string): string;
export declare function parseBatch(text: string): {
    records: ParsedEntity[];
    duplicates: number;
};
/** Existing rows MUST be fetched inside the same trusted tenant by the adapter. */
export declare function planImports(records: ParsedEntity[], existing: ParsedEntity[]): {
    create: ParsedEntity[];
    unchanged: number;
};
export declare function linksOf(entity: ParsedEntity): Link[];
export declare function resolveCandidates<T extends {
    tenantId: string;
    blueprint: string;
    identifier: string;
}>(tenantId: string, targetBlueprint: string | null, targetIdentifier: string, candidates: T[]): {
    status: 'missing' | 'ambiguous' | 'resolved';
    target: T | null;
};
/** Shape validation only: no workflow execution, business approval or transition enforcement. */
export declare function validateWorkflowInput(name: string, input: unknown): Record<string, Json>;
/** identity must come from the host's verified ctx.auth, not from request arguments. */
export declare function requireScope(identity: Identity | null, permission: Permission, membership: Membership | null): TrustedScope;
