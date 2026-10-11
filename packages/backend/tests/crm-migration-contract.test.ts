import {expect, expectTypeOf, test} from 'vitest';
import {CRM_MIGRATION_LIMITS, OPERATION_TRANSITIONS, type OperationState, type MigrationOperation, type SourceNamespace} from '../crm-migration-contract';

test('terminal states have no exits and unknown resolves only to applied or denied', () => {
  expect((Object.keys(OPERATION_TRANSITIONS) as OperationState[]).sort()).toEqual(['applied', 'approved', 'denied', 'planned', 'unknown']);
  expect(OPERATION_TRANSITIONS.applied).toEqual([]);
  expect(OPERATION_TRANSITIONS.denied).toEqual([]);
  expect(OPERATION_TRANSITIONS.unknown).toEqual(['applied', 'denied']);
  expect(OPERATION_TRANSITIONS.planned).not.toContain('applied');
  expect(CRM_MIGRATION_LIMITS.operationsPerBatch).toBeLessThanOrEqual(CRM_MIGRATION_LIMITS.sessionOperationsMax);
});
test('contract types carry no provider-verified claim or raw diagnostics', () => {
  expectTypeOf<SourceNamespace['provenance']>().toEqualTypeOf<'manual_export_unverified'>();
  expectTypeOf<MigrationOperation['state']>().toEqualTypeOf<OperationState>();
  expectTypeOf<MigrationOperation>().not.toHaveProperty('providerError');
});
