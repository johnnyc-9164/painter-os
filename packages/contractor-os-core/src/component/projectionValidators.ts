import { v } from 'convex/values';
import { blueprint } from './validators.js';
const scalar = v.union(v.string(), v.number(), v.boolean(), v.null());
const calculation = v.object({
  status: v.union(v.literal('computed'), v.literal('invalid_input'), v.literal('definition_missing')),
  value: scalar, issue: v.union(v.string(), v.null()),
});
const mirror = v.object({ path: v.string(), status: v.union(v.literal('computed'), v.literal('unavailable')), value: scalar });
const aggregate = v.object({
  target: blueprint, path: v.string(), semantics: v.literal('component_explicit_paths_v1'),
  status: v.union(v.literal('computed'), v.literal('incomplete')), value: v.union(v.number(), v.null()), issue: v.union(v.string(), v.null()),
});
const scorecard = v.object({
  identifier: v.string(), status: v.union(v.literal('evaluated'), v.literal('definition_missing'), v.literal('unsupported_query')),
  source: v.union(v.literal('prior_export_snapshot'), v.literal('declaration_only')),
  rulesTested: v.number(), rulesPassed: v.number(), percentPassed: v.union(v.number(), v.null()),
  rules: v.array(v.object({
    identifier: v.string(), title: v.string(), level: v.string(),
    result: v.union(v.literal('Passed'), v.literal('Not passed'), v.literal('Unknown')), issue: v.union(v.string(), v.null()),
  })),
  levels: v.array(v.object({
    title: v.string(), ruleCount: v.number(),
    status: v.union(v.literal('passed'), v.literal('failed'), v.literal('unknown'), v.literal('untested')),
  })),
  authorizesAction: v.literal(false),
});
export const projectionResult = v.union(v.null(), v.object({
  blueprint, identifier: v.string(), title: v.union(v.string(), v.null()), revision: v.number(), evaluatedAt: v.number(),
  calculations: v.record(v.string(), calculation), mirrors: v.record(v.string(), mirror),
  aggregates: v.record(v.string(), aggregate), scorecards: v.array(scorecard), warnings: v.array(v.string()),
}));
export const projectionArgs = { blueprint, identifier: v.string(), asOf: v.optional(v.number()) };
