import { DERIVED_MANIFEST } from './derivedManifest.js';
import { definition, validateProperties, validateRelations } from './domain.js';
import { evaluateCalculation, validateAsOf, type CalculationResult, type Scalar } from './calculations.js';
import { evaluateScorecards, type ScorecardEvaluation } from './scorecards.js';
import type { Blueprint } from './model.js';
import type { StoredRecord } from './businessTypes.js';

/** Small on-demand snapshots. Larger sets fail visibly instead of returning truncated totals. */
export const PROJECTION_LIMITS = { relatedPerPath: 50, documentReads: 64 } as const;
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
interface AggregateDefinition {
  target: Blueprint;
  func: 'count' | 'sum';
  property: string | null;
  filter: { property: string; equals: Scalar } | null;
  pathPolicy: { kind: 'incoming_single' | 'outgoing_many'; relation: string };
}
const mirrorDefinitions = DERIVED_MANIFEST.mirrors as Partial<Record<Blueprint, Record<string, string>>>;
const aggregateDefinitions = DERIVED_MANIFEST.aggregates as Partial<Record<Blueprint, Record<string, AggregateDefinition>>>;

/**
 * Explicitly scoped component projection, NOT an implementation of Port's all-path traversal.
 * Source filters/functions are unchanged. A read does not update business state or approve work.
 */
export async function projectRecord(root: StoredRecord, reader: ProjectionReader, nowMs: number): Promise<RecordProjection> {
  validateAsOf(nowMs);
  validateProperties(root.blueprint, root.properties);
  validateRelations(root.blueprint, root.relations);
  const out: RecordProjection = {
    blueprint: root.blueprint, identifier: root.identifier, title: root.title, revision: root.revision,
    evaluatedAt: nowMs, calculations: {}, mirrors: {}, aggregates: {},
    scorecards: evaluateScorecards(root.blueprint, root.properties), warnings: [],
  };
  let readCount = 0;
  const byIdCache = new Map<string, StoredRecord | null>();
  const incomingCache = new Map<string, { rows: StoredRecord[]; complete: boolean }>();
  const safe = (row: StoredRecord | null, bp: Blueprint) => row && row.tenantId === root.tenantId && row.blueprint === bp ? row : null;
  async function byId(bp: Blueprint, id: string): Promise<StoredRecord | null> {
    const key = `${bp}:${id}`;
    if (byIdCache.has(key)) return byIdCache.get(key)!;
    if (readCount >= PROJECTION_LIMITS.documentReads) { out.warnings.push('PROJECTION_READ_LIMIT'); return null; }
    readCount++;
    const row = safe(await reader.byId(bp, id), bp);
    byIdCache.set(key, row);
    return row;
  }
  async function mirror(path: string): Promise<MirrorResult> {
    const parts = path.split('.');
    let row: StoredRecord | null = root;
    for (const segment of parts.slice(0, -1)) {
      const rel = definition(row.blueprint).relations[segment];
      const id = row.relations[segment];
      if (!rel || rel.cardinality !== 'one' || typeof id !== 'string') return { path, status: 'unavailable', value: null };
      row = await byId(rel.target, id);
      if (!row) return { path, status: 'unavailable', value: null };
    }
    const field = parts.at(-1)!;
    const value = field === '$title' ? row.title : (Object.hasOwn(row.properties, field) ? row.properties[field] : null);
    if (value === null || value === undefined) return { path, status: 'unavailable', value: null };
    if (!['string', 'number', 'boolean'].includes(typeof value) || (typeof value === 'number' && !Number.isFinite(value))) {
      return { path, status: 'unavailable', value: null };
    }
    return { path, status: 'computed', value: value as Scalar };
  }
  for (const name of definition(root.blueprint).calculations) {
    out.calculations[name] = evaluateCalculation(root.blueprint, name, root.properties, nowMs);
  }
  for (const [name, path] of Object.entries(mirrorDefinitions[root.blueprint] ?? {})) out.mirrors[name] = await mirror(path);
  for (const [name, agg] of Object.entries(aggregateDefinitions[root.blueprint] ?? {})) {
    const base = { target: agg.target, path: `${agg.pathPolicy.kind}:${agg.pathPolicy.relation}`, semantics: 'component_explicit_paths_v1' as const };
    let rows: StoredRecord[] = [], complete = true;
    if (agg.pathPolicy.kind === 'incoming_single') {
      const key = `${agg.target}:${agg.pathPolicy.relation}:${root.id}`;
      let cached = incomingCache.get(key);
      if (!cached) {
        const limit = Math.min(PROJECTION_LIMITS.relatedPerPath, PROJECTION_LIMITS.documentReads - readCount - 1);
        if (limit < 1) cached = { rows: [], complete: false };
        else {
          const found = await reader.incoming(agg.target, agg.pathPolicy.relation, root.id, limit + 1);
          readCount += found.length;
          const valid = found.every(row => safe(row, agg.target) && row.relations[agg.pathPolicy.relation] === root.id);
          cached = { rows: found.slice(0, limit), complete: valid && found.length <= limit };
        }
        incomingCache.set(key, cached);
      }
      rows = cached.rows; complete = cached.complete;
    } else {
      const ids = root.relations[agg.pathPolicy.relation] ?? [];
      if (!Array.isArray(ids) || ids.length > PROJECTION_LIMITS.relatedPerPath) complete = false;
      else for (const id of ids) {
        const row = await byId(agg.target, id);
        if (row) rows.push(row); else complete = false;
      }
    }
    if (!complete) {
      out.aggregates[name] = { ...base, status: 'incomplete', value: null, issue: 'TARGET_UNAVAILABLE_OR_READ_LIMIT' };
      continue;
    }
    const unique = [...new Map(rows.map(row => [row.id, row])).values()];
    const matching = agg.filter ? unique.filter(row => row.properties[agg.filter!.property] === agg.filter!.equals) : unique;
    let value = matching.length;
    if (agg.func === 'sum') {
      value = 0;
      for (const row of matching) {
        const amount = row.properties[agg.property!];
        // Missing numeric fields are omitted, not treated as invalid counts or string-coerced.
        if (amount === null || amount === undefined) continue;
        if (typeof amount !== 'number' || !Number.isFinite(amount)) { complete = false; break; }
        value += amount;
      }
    }
    if (!Number.isFinite(value) || Math.abs(value) > Number.MAX_SAFE_INTEGER) complete = false;
    out.aggregates[name] = { ...base, status: complete ? 'computed' : 'incomplete', value: complete ? value : null,
      issue: complete ? null : 'NON_NUMERIC_OR_OUT_OF_RANGE' };
  }
  if (root.blueprint === 'co_pricing_rule') out.warnings.push('SOURCE_PROFIT_MARGIN_FORMULA_USES_MARKUP');
  if (root.blueprint === 'co_trade_spec' && ['painting', 'roofing'].includes(String(root.properties.trade))
    && root.properties.measurement_unit !== undefined && root.properties.measurement_unit !== 'sq_ft') {
    out.warnings.push('SOURCE_FORMULA_ASSUMES_SQUARE_FEET');
  }
  if (Object.keys(out.aggregates).length) out.warnings.push('EXPLICIT_PATHS_NOT_PORT_ALL_PATH_PARITY');
  out.warnings = [...new Set(out.warnings)];
  return out;
}
