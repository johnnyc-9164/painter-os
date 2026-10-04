import { definition, validateRelations } from './domain.js';
import { BLUEPRINTS, type Blueprint } from './model.js';
import { canonicalJson, object } from './port.js';

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
export function auditLegacyRelations(input: unknown) {
  if (!object(input)) throw new Error('INVALID_EXPORT');
  canonicalJson(input);
  let recordsScanned = 0;
  const issues: RelationMigrationIssue[] = [];
  for (const [name, rows] of Object.entries(input)) {
    if (!(BLUEPRINTS as readonly string[]).includes(name)) throw new Error(`UNSUPPORTED_BLUEPRINT:${name}`);
    if (!Array.isArray(rows)) throw new Error('INVALID_EXPORT');
    const blueprint = name as Blueprint;
    for (const [rowIndex, row] of rows.entries()) {
      recordsScanned++;
      if (!object(row) || !object(row.relations)) throw new Error('INVALID_EXPORT');
      const identifier = typeof row.identifier === 'string' ? row.identifier : null;
      for (const [relation, value] of Object.entries(row.relations)) {
        const rel = definition(blueprint).relations[relation];
        if (rel?.cardinality === 'one' && Array.isArray(value)) {
          const ids = [...new Set(value)];
          const strings = ids.every(x => typeof x === 'string' && x.length > 0);
          issues.push({ blueprint, rowIndex, identifier, relation,
            code: ids.length > 1 ? 'MULTIPLE_TARGETS_FOR_SINGLE_RELATION' : 'LEGACY_SINGLE_RELATION_ARRAY',
            canNormalizeWithoutSelectingTarget: strings && ids.length <= 1,
            proposedValue: strings && ids.length === 1 ? ids[0] as string : null });
          continue;
        }
        try { validateRelations(blueprint, { [relation]: value }); }
        catch (error) {
          issues.push({ blueprint, rowIndex, identifier, relation,
            code: error instanceof Error ? error.message : 'INVALID_RELATION', canNormalizeWithoutSelectingTarget: false, proposedValue: null });
        }
      }
    }
  }
  return { recordsScanned, safeToEnableStrictRelations: issues.length === 0, issues,
    limitations: 'Relation-shape check only. It does not verify target existence, tenant ownership, full property schemas, or apply any migration.' };
}
