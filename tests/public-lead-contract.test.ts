import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const {CONTACT_RETENTION_DAYS,CONTACT_RETENTION_DISCLOSURE,validateContactIntakeSettings,validatePublicContactSubmission,publicSubmissionFingerprintPayload}=createRequire(import.meta.url)('../packages/backend/public-lead-contract.ts') as typeof import('../packages/backend/public-lead-contract');
const submission={requestKey:'01234567890123456789012345678901',contactPolicyRevision:2,guidanceRevision:3,consent:true,contact:{name:' Visitor ',email:' visitor@example.test '},project:{postalCode:'00501',projectType:'interior',scope:' Walls ',timeline:' Fall '}};

test('contact opt-in separately requires retention acknowledgement and keeps fixed disclosure',()=>{
  assert.deepEqual(validateContactIntakeSettings({enabled:false,consentText:'',acknowledgeRetention:false}),{enabled:false,consentText:'',acknowledgeRetention:false});
  for(const value of [{enabled:true,consentText:'Contact me',acknowledgeRetention:false},{enabled:true,consentText:' ',acknowledgeRetention:true}]) assert.throws(()=>validateContactIntakeSettings(value),/CONTACT_POLICY_ACKNOWLEDGEMENT_REQUIRED/);
  assert.equal(CONTACT_RETENTION_DAYS,30);
  assert.match(CONTACT_RETENTION_DISCLOSURE,/Unprocessed requests.*30 days/);
  assert.match(CONTACT_RETENTION_DISCLOSURE,/customer record separately/);
  assert.throws(()=>validateContactIntakeSettings({enabled:true,consentText:'Consent',acknowledgeRetention:true,retentionDays:365}),/UNKNOWN_FIELD:retentionDays/);
});

test('digest bytes normalize bounded consented input without caller field ordering or whitespace',()=>{
  const normalized=validatePublicContactSubmission(submission);
  assert.equal(normalized.contact.name,'Visitor');assert.equal(normalized.project.postalCode,'00501');
  const reordered={project:{timeline:'Fall',scope:'Walls',projectType:'interior',postalCode:'00501'},contact:{email:'visitor@example.test',name:'Visitor'},consent:true,guidanceRevision:3,contactPolicyRevision:2,requestKey:submission.requestKey};
  assert.equal(publicSubmissionFingerprintPayload('workspace',submission),publicSubmissionFingerprintPayload('workspace',reordered));
  assert.notEqual(publicSubmissionFingerprintPayload('workspace',submission),publicSubmissionFingerprintPayload('other',submission));
  assert.notEqual(publicSubmissionFingerprintPayload('workspace',submission),publicSubmissionFingerprintPayload('workspace',{...submission,contactPolicyRevision:4}));
  assert.equal(submission.contact.name,' Visitor ');
});

test('consent, policy revision, contact method and project bounds fail closed',()=>{
  for(const value of [{...submission,consent:false},{...submission,guidanceRevision:0},{...submission,contactPolicyRevision:1.5},{...submission,requestKey:'short'},{...submission,contact:{name:'Visitor'}},{...submission,contact:{name:'Visitor',email:'invalid'}},{...submission,contact:{name:'Visitor',phone:' '.repeat(41)}},{...submission,project:{...submission.project,scope:'x'.repeat(2001)}},{...submission,project:{...submission.project,postalCode:'501'}},{...submission,project:{...submission.project,projectType:'plumbing'}}]) assert.throws(()=>validatePublicContactSubmission(value));
  assert.equal(validatePublicContactSubmission({...submission,contact:{name:'Visitor',phone:'555'},project:{...submission.project,projectType:'other'}}).contact.phone,'555');
});

test('transport cannot supply business authority, digest, raw address or hidden project instructions',()=>{
  for(const field of ['role','actorId','tenantId','payloadDigest','receiptFingerprint','source','customerId','status']) assert.throws(()=>validatePublicContactSubmission({...submission,[field]:'forged'}),new RegExp(`UNKNOWN_FIELD:${field}`));
  assert.throws(()=>validatePublicContactSubmission({...submission,contact:{...submission.contact,address:'Private street'}}),/UNKNOWN_FIELD:address/);
  assert.throws(()=>validatePublicContactSubmission({...submission,project:{...submission.project,action:'lead.qualify'}}),/UNKNOWN_FIELD:action/);
});
