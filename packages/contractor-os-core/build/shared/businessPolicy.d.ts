/** Explicit v1 implementation policy. These transition graphs are NOT claimed to be Port exports. */
import type { Blueprint } from './model.js';
import type { Json } from './port.js';
export declare const POLICY_VERSION = "contractor-operations-v1";
export declare const INITIAL: Partial<Record<Blueprint, string>>;
export declare const TRANSITIONS: Partial<Record<Blueprint, Record<string, readonly string[]>>>;
export declare function lifecycleField(bp: Blueprint): 'stage' | 'status';
export declare function currentState(bp: Blueprint, p: Record<string, Json>): string;
export declare function assertTransition(bp: Blueprint, from: string, to: string): void;
/** USD v1: source values stay dollars; all arithmetic takes place in safe integer cents. */
export declare function minorUnits(value: number): number;
export declare function positiveMoney(value: number): number;
export declare function dollars(n: number): number;
/** Prevent the maintenance API from bypassing workflow/evidence checks. Null = new record. */
export declare function guardMaintenance(bp: Blueprint, before: Record<string, Json> | null, after: Record<string, Json>, beforeRelations?: unknown, afterRelations?: unknown): void;
