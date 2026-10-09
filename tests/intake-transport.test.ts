import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const {parseIntakeSave, decodeIntakeRead, decodeIntakeWrite} = require('../apps/web/src/lib/intake-http.ts') as typeof import('../apps/web/src/lib/intake-http.ts');
const {decodePublicIntake} = require('../packages/backend/intake-contract.ts') as typeof import('../packages/backend/intake-contract.ts');
const settings = {enabled: true, servicePostalCodes: ['55401'], supportedProjectTypes: ['interior'], consentText: 'Future consent'};
test('settings transport binds only company candidate, revision and canonical settings', () => {
  const input = {workspaceId: 'company', expectedRevision: 0, requestKey: 'intent', settings};
  assert.deepEqual(parseIntakeSave(input), input);
  for (const key of ['role', 'userId', 'action', 'ownerId']) assert.throws(() => parseIntakeSave({...input, [key]: 'owner'}), /UNKNOWN_FIELD/);
  assert.throws(() => parseIntakeSave({...input, expectedRevision: -1}), /INVALID_INTAKE_REQUEST/);
  assert.throws(() => parseIntakeSave({...input, workspaceId: ''}), /INVALID_INTAKE_REQUEST/);
});
test('strict decoders reject extra private metadata, disabled-ready claims and malformed results', () => {
  assert.deepEqual(decodeIntakeRead({settings: null}), null);
  assert.deepEqual(decodeIntakeRead({settings: {...settings, revision: 1}}), {...settings, revision: 1});
  assert.throws(() => decodeIntakeRead({settings: {...settings, revision: 1, updatedBy: 'private'}}), /INVALID_INTAKE_RESPONSE/);
  assert.deepEqual(decodeIntakeWrite({revision: 1, enabled: true, replayed: false}), {revision: 1, enabled: true, replayed: false});
  assert.throws(() => decodeIntakeWrite({revision: 1, enabled: true, replayed: false, ownerId: 'private'}), /INVALID_INTAKE_RESPONSE/);
  assert.deepEqual(decodePublicIntake({state: 'unavailable'}), {state: 'unavailable'});
  const result = {state: 'ready', intake: {...settings, companyName: 'Company', revision: 1}};
  assert.deepEqual(decodePublicIntake(result), result);
  assert.throws(() => decodePublicIntake({state: 'ready', intake: {...result.intake, enabled: false}}), /INVALID_INTAKE_RESPONSE/);
  assert.throws(() => decodePublicIntake({state: 'ready', intake: {...result.intake, ownerId: 'private'}}), /INVALID_INTAKE_RESPONSE/);
});
