import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {applyCommand, commandFingerprint, emptyState} from '../packages/domain/src/engine';
import {createLeadAggregate} from '../packages/domain/src/lead-aggregate';
import type {Actor, Command} from '../packages/domain/src/contracts';
const actor:Actor={id:'owner',tenantId:'workspace',role:'owner',name:'Owner',email:'owner@example.test'};
const now='2026-10-09T13:00:00.000Z';
const command:Command={action:'lead.create',requestKey:'manual-lead',input:{name:' Visitor ',email:' person@example.test ',phone:' 555 ',address:' Street ',source:' Site ',notes:' Walls '}};
const hash=(value:string)=>`sha256:${createHash('sha256').update(value).digest('hex')}`;

test('manual lead creation preserves canonical shape, actor audit and replay',()=>{
  const state=emptyState();let n=0;
  const result=applyCommand(state,actor,command,{now,id:()=>`id-${++n}`});
  assert.deepEqual(result.entity,{id:'id-1',type:'lead',tenantId:'workspace',revision:1,createdAt:now,updatedAt:now,data:{title:'Visitor',name:'Visitor',status:'new',email:'person@example.test',phone:'555',address:'Street',source:'Site',notes:'Walls',customerId:null}});
  assert.equal(state.events[0]!.actorId,actor.id);
  assert.deepEqual(state.events[0]!.payload.after,result.entity!.data);
  assert.equal(state.events[0]!.payload.before,null);
  assert.equal(state.receipts[JSON.stringify([actor.tenantId,command.requestKey])]!.fingerprint,commandFingerprint(actor,command));
  const before=structuredClone(state);
  assert.deepEqual(applyCommand(state,actor,command),{...result,replayed:true});
  assert.deepEqual(state,before);
});

test('shared builder matches authenticated creation with trusted existing customer linkage',()=>{
  const state=emptyState();
  const customer=applyCommand(state,actor,{action:'customer.create',requestKey:'customer',input:{name:'Customer'}},{now,id:()=> 'customer-id'}).entity!;
  const linked={...command,input:{...command.input,customerId:customer.id}};
  let n=0;const entity=applyCommand(state,actor,linked,{now,id:()=>`linked-${++n}`}).entity!;
  assert.deepEqual(entity,createLeadAggregate({id:entity.id,tenantId:actor.tenantId,now,input:command.input,customerId:customer.id}));
  assert.throws(()=>createLeadAggregate({id:'x',tenantId:'workspace',now,input:{name:'Visitor',role:'owner'}}),/UNKNOWN_FIELD:role/);
});

test('invalid contact/link/collision remain atomic and unauthorized roles cannot create',()=>{
  for(const input of [{name:' '},{name:'Visitor',email:'bad'}, {...command.input,customerId:'foreign'},{name:'Visitor',status:'qualified'}]){
    const state=emptyState();assert.throws(()=>applyCommand(state,actor,{...command,input},{now}));assert.deepEqual(state,emptyState());
  }
  const state=emptyState();applyCommand(state,actor,command,{now,id:()=> 'same'});const before=structuredClone(state);
  assert.throws(()=>applyCommand(state,actor,{...command,requestKey:'other'},{now,id:()=> 'same'}),/ID_COLLISION/);assert.deepEqual(state,before);
  assert.throws(()=>applyCommand(emptyState(),{...actor,role:'crew_member'},command),/FORBIDDEN/);
});

test('host-only fingerprint transform gets canonical bytes and rejects forged transport overrides',()=>{
  const state=emptyState();const seen:string[]=[];
  const transformReceiptFingerprint=(value:string)=>{seen.push(value);return hash(value);};
  applyCommand(state,actor,command,{now,transformReceiptFingerprint});
  assert.equal(seen[0],commandFingerprint(actor,command));
  assert.equal(state.receipts[JSON.stringify([actor.tenantId,command.requestKey])]!.fingerprint,hash(seen[0]!));
  assert.equal(applyCommand(state,actor,command,{transformReceiptFingerprint}).replayed,true);
  assert.throws(()=>applyCommand(state,actor,{...command,input:{...command.input,name:'Changed'}},{transformReceiptFingerprint}),/IDEMPOTENCY_KEY_CONFLICT/);
  for(const field of ['fingerprint','receiptFingerprint','transformReceiptFingerprint']) {
    assert.throws(()=>applyCommand(emptyState(),actor,{...command,[field]:'forged'} as Command),new RegExp(`UNKNOWN_FIELD:${field}`));
    assert.throws(()=>applyCommand(emptyState(),actor,{...command,input:{...command.input,[field]:'forged'}}),new RegExp(`UNKNOWN_FIELD:${field}`));
  }
});
