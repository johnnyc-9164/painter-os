import type { Blueprint } from './model.js';
export type Scalar = string | number | boolean | null;
export type CalculationResult = {
    status: 'computed' | 'invalid_input' | 'definition_missing';
    value: Scalar;
    issue: string | null;
};
/** Explicit time makes historical snapshots and tests repeatable. No hidden wall clock. */
export declare function validateAsOf(nowMs: number): void;
/**
 * Whitelisted translations of the 16 supplied contractor JQ formulas.
 * The strings in the manifest are provenance, never executed with eval/new Function.
 * Financial results here are source/display calculations, not billing mutations.
 */
export declare function evaluateCalculation(blueprint: Blueprint, name: string, input: unknown, nowMs: number): CalculationResult;
