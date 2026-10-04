import { type CalculationResult, type Scalar } from './calculations.js';
import { type ScorecardEvaluation } from './scorecards.js';
import type { Blueprint } from './model.js';
import type { StoredRecord } from './businessTypes.js';
/** Small on-demand snapshots. Larger sets fail visibly instead of returning truncated totals. */
export declare const PROJECTION_LIMITS: {
    readonly relatedPerPath: 50;
    readonly documentReads: 64;
};
export interface ProjectionReader {
    byId(blueprint: Blueprint, id: string): Promise<StoredRecord | null>;
    incoming(blueprint: Blueprint, relation: string, sourceId: string, limit: number): Promise<StoredRecord[]>;
}
export interface MirrorResult {
    path: string;
    status: 'computed' | 'unavailable';
    value: Scalar;
}
export interface AggregateResult {
    target: Blueprint;
    path: string;
    semantics: 'component_explicit_paths_v1';
    status: 'computed' | 'incomplete';
    value: number | null;
    issue: string | null;
}
export interface RecordProjection {
    blueprint: Blueprint;
    identifier: string;
    title: string | null;
    revision: number;
    evaluatedAt: number;
    calculations: Record<string, CalculationResult>;
    mirrors: Record<string, MirrorResult>;
    aggregates: Record<string, AggregateResult>;
    scorecards: ScorecardEvaluation[];
    warnings: string[];
}
/**
 * Explicitly scoped component projection, NOT an implementation of Port's all-path traversal.
 * Source filters/functions are unchanged. A read does not update business state or approve work.
 */
export declare function projectRecord(root: StoredRecord, reader: ProjectionReader, nowMs: number): Promise<RecordProjection>;
