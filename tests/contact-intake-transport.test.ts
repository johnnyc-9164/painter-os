import assert from 'node:assert/strict';
import test from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const http = require('../apps/web/src/lib/contact-intake-http.ts') as typeof import('../apps/web/src/lib/contact-intake-http.ts');
const {createIntentKeys} = require('../apps/web/src/lib/command-intent.ts') as typeof import('../apps/web/src/lib/command-intent.ts');
const {CONTACT_RETENTION_DISCLOSURE} = require('../packages/backend/public-lead-contract.ts') as typeof import('../packages/backend/public-lead-contract.ts');
const settings = {enabled: true, consentText: 'Consent', acknowledgeRetention: true};
const row = {...settings, revision: 1, retentionDays: 30, retentionDisclosure: CONTACT_RETENTION_DISCLOSURE};
test('save binds only candidate, revision, key and canonical settings; enable needs consent and acknowledgement', () => {
  const input = {workspaceId: 'company', expectedRevision: 0, requestKey: 'intent', settings};
  assert.deepEqual(http.parseContactIntakeSave(input), input);
  for (const k of ['role', 'userId', 'tenantId']) assert.throws(() => http.parseContactIntakeSave({...input, [k]: 'owner'}), /UNKNOWN_FIELD/);
  assert.throws(() => http.parseContactIntakeSave({...input, expectedRevision: -1}), /INVALID_CONTACT_CONFIG_REQUEST/);
  assert.throws(() => http.parseContactIntakeSave({...input, settings: {...settings, acknowledgeRetention: false}}), /ACKNOWLEDGEMENT_REQUIRED/);
  assert.throws(() => http.parseContactIntakeSave({...input, settings: {...settings, consentText: '  '}}), /ACKNOWLEDGEMENT_REQUIRED/);
  assert.throws(() => http.parseContactIntakeSave({...input, settings: {...settings, consentText: 'x'.repeat(1001)}}), /INVALID_CONTACT_INTAKE/);
  assert.equal(http.parseContactIntakeSave({...input, settings: {...settings, consentText: 'x'.repeat(1000)}}).settings.consentText.length, 1000);
  // Disable is an explicit save and needs neither consent nor acknowledgement.
  assert.equal(http.parseContactIntakeSave({...input, settings: {enabled: false, consentText: '', acknowledgeRetention: false}}).settings.enabled, false);
});
test('strict decoders: absent is null, canonical 30-day disclosure required, extras rejected', () => {
  assert.equal(http.decodeContactRead({settings: null}), null);
  assert.deepEqual(http.decodeContactRead({settings: row}), {...settings, revision: 1});
  assert.throws(() => http.decodeContactRead({settings: {...row, updatedBy: 'private'}}), /INVALID_CONTACT_CONFIG_RESPONSE/);
  assert.throws(() => http.decodeContactRead({settings: {...row, retentionDisclosure: 'Kept 90 days'}}), /INVALID_CONTACT_CONFIG_RESPONSE/);
  assert.throws(() => http.decodeContactRead({settings: {...row, revision: 0}}), /INVALID_CONTACT_CONFIG_RESPONSE/);
  assert.deepEqual(http.decodeContactWrite({revision: 2, enabled: false, replayed: true}), {revision: 2, enabled: false, replayed: true});
  assert.throws(() => http.decodeContactWrite({revision: 2, enabled: false, replayed: true, actor: 'x'}), /INVALID_CONTACT_CONFIG_RESPONSE/);
});
test('failure classification: only 401/403 are confirmed denials; network/5xx stay unknown', () => {
  assert.equal(http.classifyContactFailure(409), 'conflict');
  assert.equal(http.classifyContactFailure(401), 'auth');
  assert.equal(http.classifyContactFailure(403), 'auth');
  assert.equal(http.classifyContactFailure(400), 'invalid');
  for (const s of [undefined, 500, 502, 503]) assert.equal(http.classifyContactFailure(s), 'unknown');
});
test('unknown outcome replays the same intent key; changed edits or a confirmed result mint a new one; disable is its own intent', () => {
  let n = 0; const journal = createIntentKeys(() => `k${++n}`);
  const cmd = (s: object, rev = 0) => ({action: 'contact_intake.configure', expectedRevision: rev, input: s}) as never;
  const first = journal.begin('contact-intake:c', cmd(settings));
  assert.equal(journal.begin('contact-intake:c', cmd(settings)).requestKey, first.requestKey);
  assert.notEqual(journal.begin('contact-intake:c', cmd({...settings, consentText: 'Edited'})).requestKey, first.requestKey);
  const disable = journal.begin('contact-intake:c', cmd({enabled: false, consentText: 'Consent', acknowledgeRetention: true}, 1));
  assert.notEqual(disable.requestKey, first.requestKey);
  journal.complete(first);
  assert.notEqual(journal.begin('contact-intake:c', cmd(settings)).requestKey, first.requestKey);
  // Authority change: a fresh journal cannot replay a stale key.
  assert.notEqual(createIntentKeys(() => 'fresh').begin('contact-intake:c', cmd(settings)).requestKey, first.requestKey);
});
