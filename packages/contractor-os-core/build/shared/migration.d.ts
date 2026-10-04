import { type Blueprint } from './model.js';
export interface RelationMigrationIssue {
    blueprint: Blueprint;
    rowIndex: number;
    identifier: string | null;
    relation: string;
    code: string;
    canNormalizeWithoutSelectingTarget: boolean;
    proposedValue: string | null;
}
/** Offline preflight only. Never picks one of multiple targets or writes a database. */
export declare function auditLegacyRelations(input: unknown): {
    recordsScanned: number;
    safeToEnableStrictRelations: boolean;
    issues: RelationMigrationIssue[];
    limitations: string;
};
