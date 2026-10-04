import test from 'node:test';import assert from 'node:assert/strict';
let migration={};try{migration=await import('../build/shared/migration.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
function audit(x){assert.equal(typeof migration.auditLegacyRelations,'function');return migration.auditLegacyRelations(x);}
test('v040 migration: single-element arrays yield a proposal without changing source',()=>{
 const source={co_contact:[{identifier:'c',relations:{client:['id']}}]};const before=JSON.stringify(source);
 const r=audit(source);assert.equal(r.safeToEnableStrictRelations,false);assert.equal(r.issues[0].proposedValue,'id');assert.equal(JSON.stringify(source),before);
});
test('v040 migration: multi-target single relations require human resolution',()=>{
 const r=audit({co_contact:[{identifier:'c',relations:{client:['a','b']}}]});assert.equal(r.issues[0].code,'MULTIPLE_TARGETS_FOR_SINGLE_RELATION');assert.equal(r.issues[0].canNormalizeWithoutSelectingTarget,false);
});
test('v040 migration: ordinary many relations remain intact',()=>{
 const r=audit({co_job:[{identifier:'j',relations:{subcontractors:['a','b']}}]});assert.equal(r.safeToEnableStrictRelations,true);
});
test('v040 migration: unknown table and malformed input reject instead of being skipped',()=>{
 assert.throws(()=>audit({_ai_agent:[]}),/UNSUPPORTED_BLUEPRINT/);assert.throws(()=>audit({co_contact:{}}),/INVALID_EXPORT/);
});
