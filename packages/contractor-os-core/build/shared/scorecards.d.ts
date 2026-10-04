import { type Json } from './port.js';
import type { Blueprint } from './model.js';
export type RuleResult = 'Passed' | 'Not passed' | 'Unknown';
export interface RuleEvaluation {
    identifier: string;
    title: string;
    level: string;
    result: RuleResult;
    issue: string | null;
}
export interface ScorecardEvaluation {
    identifier: string;
    status: 'evaluated' | 'definition_missing' | 'unsupported_query';
    source: 'prior_export_snapshot' | 'declaration_only';
    rulesTested: number;
    rulesPassed: number;
    percentPassed: number | null;
    rules: RuleEvaluation[];
    levels: {
        title: string;
        ruleCount: number;
        status: 'passed' | 'failed' | 'unknown' | 'untested';
    }[];
    authorizesAction: false;
}
/** Explicit supported subset. No JavaScript/JQ evaluation or implicit coercion. */
export declare function evaluateRuleQuery(input: unknown, properties: Record<string, Json>): {
    result: RuleResult;
    issue: string | null;
};
/** Advisory, per-record results. These do not mutate _rule_result or grant workflow authority. */
export declare function evaluateScorecards(blueprint: Blueprint, properties: Record<string, Json>): ScorecardEvaluation[];
