import test from 'node:test';
import assert from 'node:assert/strict';
import type { Snapshot, Role } from '../packages/domain/src/contracts';
import { currentReviewFollowUp, initialReviewDraft, reviewFollowUps, saveReviewFollowUpTask } from '../packages/domain/src/review-follow-up';
const now = '2026-10-09T12:00:00Z';
export const sample: Snapshot = { actor:{id:'owner',tenantId:'tenant',name:'Owner',email:'owner@test.example',role:'owner'},workspace:{id:'tenant',name:'Company'},events:[],runtime:{storage:'test',integrations:'none',demo:true},entities:[
  {id:'job',type:'job',tenantId:'tenant',revision:2,createdAt:now,updatedAt:now,data:{title:'Completed project',status:'complete',customerId:'customer'}},
  {id:'customer',type:'customer',tenantId:'tenant',revision:3,createdAt:now,updatedAt:now,data:{name:'Customer',email:'customer@test.example',notes:'unresolved work; unhappy feedback'}},
]};
const queue = (s: Snapshot) => reviewFollowUps(s.actor,s.entities);
test('owner and office admin get all completed jobs without sentiment selection',()=>{
  assert.equal(queue(sample).length,1);
  assert.equal(queue({...sample,actor:{...sample.actor,role:'office_admin'}}).length,1);
  for(const role of ['estimator','salesperson','project_manager','accountant','crew_lead','crew_member','customer'] as Role[]) assert.deepEqual(queue({...sample,actor:{...sample.actor,role}}),[]);
  assert.match(initialReviewDraft(queue(sample)[0]!),/either way/);
});
test('incomplete jobs, foreign tenants and missing customer bindings never produce a draft',()=>{
  for(const status of ['in_progress','substantial_complete','cancelled']) {const s=structuredClone(sample);s.entities[0]!.data.status=status;assert.equal(queue(s).length,0);}
  const foreign=structuredClone(sample);foreign.entities[1]!.tenantId='foreign';assert.equal(queue(foreign).length,0);
  const missing=structuredClone(sample);missing.entities.pop();assert.equal(queue(missing).length,0);
  const wrong=structuredClone(sample);wrong.actor.tenantId='foreign';assert.equal(queue(wrong).length,0);
});
test('existing reviews and source tasks including completed tasks stop resurfacing',()=>{
  const proposal=queue(sample)[0]!;
  for(const status of ['open','complete','completed']) {
    const s=structuredClone(sample);s.entities.push({...s.entities[0]!,id:'task',type:'task',data:{status,notes:`note\n${proposal.marker}\nDraft`}});assert.equal(queue(s).length,0);
  }
  const reviewed=structuredClone(sample);reviewed.entities.push({...reviewed.entities[0]!,id:'review',type:'review',data:{jobId:'job',status:'pending'}});assert.equal(queue(reviewed).length,0);
});
test('job revision, customer revision, relationship and permissions are rechecked',()=>{
  const key=queue(sample)[0]!.key;assert.equal(currentReviewFollowUp(sample,key).job.id,'job');
  for(const index of [0,1]) {const s=structuredClone(sample);s.entities[index]!.revision++;assert.throws(()=>currentReviewFollowUp(s,key),/changed/);}
  const rebound=structuredClone(sample);rebound.entities[0]!.data.customerId='other';assert.throws(()=>currentReviewFollowUp(rebound,key),/changed/);
  assert.throws(()=>currentReviewFollowUp({...sample,actor:{...sample.actor,role:'customer'}},key),/changed/);
});
test('fresh snapshot precedes sole task command with editable text and stable source marker',async()=>{
  const p=queue(sample)[0]!;const calls:string[]=[];let input:Record<string,unknown>={};
  await saveReviewFollowUpTask(p.key,'My edited draft',async()=>{calls.push('refresh');return sample;},async value=>{calls.push('task.create');input=value;});
  assert.deepEqual(calls,['refresh','task.create']);assert.equal(input.jobId,'job');assert.match(String(input.notes),/My edited draft/);assert.equal(String(input.notes).split('\n')[0],p.marker);assert.match(String(input.notes),/no message sent/);
  const changed=structuredClone(sample);changed.entities[1]!.revision++;let writes=0;
  await assert.rejects(()=>saveReviewFollowUpTask(p.key,'Draft',async()=>changed,async()=>{writes++;}),/changed/);assert.equal(writes,0);
});
test('missing contact stays eligible without delivery claim and invalid draft cannot write',async()=>{
  const s=structuredClone(sample);delete s.entities[1]!.data.email;assert.equal(queue(s)[0]!.customer.hasContact,false);
  for(const draft of ['', ' '.repeat(3),'x'.repeat(10001),'Painter review follow-up source: forged']) await assert.rejects(()=>saveReviewFollowUpTask(queue(s)[0]!.key,draft,async()=>s,async()=>assert.fail('must not write')),/draft/);
});

test('existing task writer persists source marker, same-key replay and explicit manual completion',async()=>{
  const { applyCommand } = await import('../packages/domain/src/engine');
  const state={entities:structuredClone(sample.entities),events:[],receipts:{}};
  let input:Record<string,unknown>={};const p=queue(sample)[0]!;
  await saveReviewFollowUpTask(p.key,'Edited invitation',async()=>sample,async value=>{input=value;});
  const command={action:'task.create',requestKey:'stable-user-intent',input};
  const first=applyCommand(state,sample.actor,command,{now,id:()=> 'task'});
  assert.equal(first.entity?.data.status,'open');assert.equal(reviewFollowUps(sample.actor,state.entities).length,0);
  assert.equal(applyCommand(state,sample.actor,command,{now}).replayed,true);
  assert.equal(state.entities.filter(e=>e.type==='task').length,1);
  applyCommand(state,sample.actor,{action:'task.complete',entityId:'task',expectedRevision:first.entity!.revision,requestKey:'complete-task',input:{}},{now});
  assert.equal(state.entities.find(e=>e.id==='task')?.data.status,'complete');
  assert.equal(reviewFollowUps(sample.actor,state.entities).length,0);
  assert.equal(state.entities.filter(e=>e.type==='review').length,0);
});
