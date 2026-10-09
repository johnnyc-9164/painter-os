import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const { assessQualification, validateIntakeSettings } = createRequire(import.meta.url)('../packages/backend/intake-contract.ts') as typeof import('../packages/backend/intake-contract.ts');
const settings = {enabled: true, servicePostalCodes: ['55401', '00501'], supportedProjectTypes: ['interior' as const], consentText: 'Contact permission'};
const answers = {postalCode: '55401', projectType: 'interior', scope: 'Two rooms', timeline: 'Next month'};
test('advice uses exact configured US ZIP and project type without creating qualified leads or booking', () => {
  assert.deepEqual(assessQualification(settings, answers), {outcome: 'eligible_for_follow_up', appointmentStatus: 'not_booked'});
  const publicPolicy = {...settings, companyName: 'Acme', revision: 1};
  assert.deepEqual(assessQualification(publicPolicy, answers), {outcome: 'eligible_for_follow_up', appointmentStatus: 'not_booked'});
  assert.equal(assessQualification(settings, {...answers, postalCode: '00501'}).outcome, 'eligible_for_follow_up');
  assert.equal(assessQualification(settings, {...answers, postalCode: '55402'}).outcome, 'outside_service_area');
  assert.equal(assessQualification(settings, {...answers, projectType: 'exterior'}).outcome, 'unsupported_project');
  assert.equal(assessQualification(settings, {...answers, projectType: 'other'}).outcome, 'unsupported_project');
  assert.equal(assessQualification(settings, {...answers, scope: ''}).outcome, 'needs_review');
  assert.equal(assessQualification({...settings, enabled: false}, answers).outcome, 'needs_review');
  assert.equal(assessQualification(settings, {}).outcome, 'needs_review');
});
test('bounded schema rejects private contacts and arbitrary business authority', () => {
  for (const key of ['email', 'name', 'phone', 'action', 'role', 'userId', 'workspaceId']) assert.throws(() => assessQualification(settings, {...answers, [key]: 'x'}), /UNKNOWN_FIELD/);
  assert.throws(() => assessQualification(settings, {...answers, postalCode: '55401-1234'}), /INVALID_INTAKE_ANSWERS/);
  assert.throws(() => assessQualification(settings, {...answers, scope: 'x'.repeat(2001)}), /INVALID_INTAKE_ANSWERS/);
  assert.throws(() => validateIntakeSettings({...settings, servicePostalCodes: Array(201).fill('55401')}), /INVALID_INTAKE_CONFIG/);
  assert.throws(() => validateIntakeSettings({...settings, consentText: ' '}), /INTAKE_POLICY_REQUIRED/);
});
test('canonical policy deduplicates and orders lists without changing caller objects', () => {
  const input = {...settings, servicePostalCodes: ['55401', '00501', '55401'], supportedProjectTypes: ['commercial', 'interior', 'commercial']};
  const original = JSON.stringify(input);
  assert.deepEqual(validateIntakeSettings(input), {...settings, servicePostalCodes: ['00501', '55401'], supportedProjectTypes: ['interior', 'commercial']});
  assert.equal(JSON.stringify(input), original);
});
