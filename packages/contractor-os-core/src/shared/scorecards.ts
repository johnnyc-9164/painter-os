import { DERIVED_MANIFEST } from './derivedManifest.js';
import { SCORECARD_SNAPSHOT } from './scorecardManifest.js';
import { canonicalJson, object, type Json } from './port.js';
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
  levels: { title: string; ruleCount: number; status: 'passed' | 'failed' | 'unknown' | 'untested' }[];
  authorizesAction: false;
}
const declarations = DERIVED_MANIFEST.scorecards as Partial<Record<Blueprint, readonly string[]>>;

/** Explicit supported subset. No JavaScript/JQ evaluation or implicit coercion. */
export function evaluateRuleQuery(input: unknown, properties: Record<string, Json>): { result: RuleResult; issue: string | null } {
  let nodes = 0;
  const run = (query: unknown, depth: number): boolean => {
    if (++nodes > 100 || depth > 8 || !object(query)) throw new Error('QUERY_LIMIT_OR_SHAPE');
    if ('combinator' in query) {
      if (!['and', 'or'].includes(String(query.combinator)) || !Array.isArray(query.conditions)
        || query.conditions.length < 1 || query.conditions.length > 100) throw new Error('INVALID_QUERY_GROUP');
      // Validate/evaluate every child, so unsupported syntax cannot hide behind a true OR branch.
      const results = query.conditions.map(child => run(child, depth + 1));
      return query.combinator === 'and' ? results.every(Boolean) : results.some(Boolean);
    }
    if (typeof query.property !== 'string' || query.property.startsWith('$') || query.property.includes('.')) {
      throw new Error('UNSUPPORTED_PROPERTY_PATH');
    }
    const value: Json = Object.hasOwn(properties, query.property) ? properties[query.property]! : null;
    switch (query.operator) {
      case 'isNotEmpty': return value !== null && value !== '' && !(Array.isArray(value) && value.length === 0)
        && !(object(value) && Object.keys(value).length === 0);
      case '=': return Object.hasOwn(query, 'value') && canonicalJson(value) === canonicalJson(query.value);
      case '!=': return Object.hasOwn(query, 'value') && canonicalJson(value) !== canonicalJson(query.value);
      case '>':
        return typeof value === 'number' && typeof query.value === 'number' && Number.isFinite(query.value) && value > query.value;
      case 'in':
        if (!Array.isArray(query.value)) throw new Error('INVALID_IN_OPERAND');
        return query.value.some(candidate => canonicalJson(candidate) === canonicalJson(value));
      default: throw new Error('UNSUPPORTED_QUERY_OPERATOR');
    }
  };
  try {
    canonicalJson(input); canonicalJson(properties);
    return { result: run(input, 0) ? 'Passed' : 'Not passed', issue: null };
  } catch (error) {
    return { result: 'Unknown', issue: error instanceof Error ? error.message : 'INVALID_QUERY' };
  }
}

/** Advisory, per-record results. These do not mutate _rule_result or grant workflow authority. */
export function evaluateScorecards(blueprint: Blueprint, properties: Record<string, Json>): ScorecardEvaluation[] {
  const names = Object.hasOwn(declarations, blueprint) ? declarations[blueprint]! : [];
  return names.map(identifier => {
    const card = SCORECARD_SNAPSHOT.scorecards.find(s => s.identifier === identifier && s.properties.blueprint === blueprint);
    const sourceRules = SCORECARD_SNAPSHOT.rules.filter(r => r.relations.scorecard.identifier === identifier);
    if (!card || sourceRules.length === 0) {
      return { identifier, status: 'definition_missing', source: 'declaration_only', rulesTested: 0,
        rulesPassed: 0, percentPassed: null, rules: [], levels: [], authorizesAction: false };
    }
    const rules: RuleEvaluation[] = sourceRules.map(rule => ({ identifier: rule.identifier, title: rule.title,
      level: rule.properties.level, ...evaluateRuleQuery(rule.properties.query, properties) }));
    const unknown = rules.some(r => r.result === 'Unknown');
    const passed = rules.filter(r => r.result === 'Passed').length;
    return {
      identifier, status: unknown ? 'unsupported_query' : 'evaluated', source: 'prior_export_snapshot',
      rulesTested: rules.filter(r => r.result !== 'Unknown').length, rulesPassed: passed,
      percentPassed: unknown ? null : Math.round(passed / rules.length * 10_000) / 100,
      rules,
      levels: card.properties.levels.map(level => {
        const group = rules.filter(r => r.level === level.title);
        return { title: level.title, ruleCount: group.length, status: group.length === 0 ? 'untested'
          : group.some(r => r.result === 'Unknown') ? 'unknown'
          : group.every(r => r.result === 'Passed') ? 'passed' : 'failed' };
      }),
      authorizesAction: false,
    };
  });
}
