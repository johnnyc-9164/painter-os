import {test} from 'node:test';
import assert from 'node:assert/strict';
import {applyCommand,emptyState} from '../packages/domain/src/engine';
import {actionContract} from '../packages/domain/src/contracts';
import type {Actor,AuditEvent} from '../packages/domain/src/contracts';
import type {PainterTransitionPayload} from '../docs/contracts/compatibility';

// Issue #186: emitted approval, schedule and payment events versus the frozen PainterTransitionPayload v1
// (docs/contracts/issue-2-freeze.md). Domain-only; no schema or writer changes.
const owner:Actor={id:'owner',tenantId:'workspace',role:'owner',name:'Owner',email:'owner@example.test'};
const customerActor:Actor={...owner,id:'customer-1',role:'customer',email:'customer@example.test'};
const knownActions=new Set<string>(Object.values(actionContract).flat());
const required=['schemaVersion','tenantId','requestKey','action','revision','customerId','jobId','occurredAt','before','after'];
const optional=['paymentId','invoiceId','amountCents'];

function isObject(v:unknown):v is Record<string,unknown>{return typeof v==='object'&&v!==null&&!Array.isArray(v);}
/** Runtime check mirroring the PainterTransitionPayload interface; returns the typed payload or throws. */
function validatePayload(event:AuditEvent,tenantId:string):PainterTransitionPayload{
  const p=event.payload;
  const keys=Object.keys(p);
  for(const k of required)assert.ok(keys.includes(k),`${event.type}: missing ${k}`);
  for(const k of keys)assert.ok(required.includes(k)||optional.includes(k),`${event.type}: unexpected key ${k}`);
  assert.equal(p.schemaVersion,1);
  assert.equal(p.tenantId,tenantId);
  assert.equal(typeof p.requestKey,'string');assert.ok((p.requestKey as string).length>0);
  assert.ok(knownActions.has(p.action as string),`unknown action ${String(p.action)}`);
  assert.ok(Number.isSafeInteger(p.revision)&&(p.revision as number)>=1);
  assert.ok(p.customerId===null||typeof p.customerId==='string');
  assert.ok(p.jobId===null||typeof p.jobId==='string');
  assert.equal(typeof p.occurredAt,'string');
  assert.ok(!Number.isNaN(Date.parse(p.occurredAt as string)));
  assert.equal(p.occurredAt,event.occurredAt);
  assert.ok(p.before===null||isObject(p.before));
  assert.ok(isObject(p.after));
  if(p.paymentId!==undefined)assert.equal(typeof p.paymentId,'string');
  if(p.invoiceId!==undefined)assert.equal(typeof p.invoiceId,'string');
  if(p.amountCents!==undefined)assert.ok(Number.isSafeInteger(p.amountCents)&&(p.amountCents as number)>0&&(p.amountCents as number)<=1e12);
  return p as unknown as PainterTransitionPayload;
}

function lifecycle(){
  const state=emptyState();let n=0;
  const run=(action:string,input:Record<string,unknown>={},entityId?:string,actor=owner,requestKey=`req-${++n}`)=>applyCommand(state,actor,{action,input,requestKey,...(entityId?{entityId}:{})},{now:`2026-06-01T12:00:${String(n%60).padStart(2,'0')}Z`});
  const customer=run('customer.create',{name:'Customer',email:'customer@example.test'}).entity!;
  const rejected=run('estimate.create',{customerId:customer.id,title:'Rejected',lineItems:[{description:'Walls',quantity:1,unitPrice:100}],depositPercent:25}).entity!;
  run('estimate.send',{},rejected.id);run('estimate.requestChanges',{notes:'Revise'},rejected.id,customerActor);run('estimate.update',{title:'Revised'},rejected.id);run('estimate.send',{},rejected.id);run('estimate.reject',{},rejected.id,customerActor);
  const estimate=run('estimate.create',{customerId:customer.id,title:'Paint',lineItems:[{description:'Walls',quantity:1,unitPrice:100}],depositPercent:25}).entity!;
  run('estimate.send',{},estimate.id);run('estimate.approve',{},estimate.id,customerActor);
  const job=run('job.create',{estimateId:estimate.id}).entity!;
  const deposit=run('invoice.create',{jobId:job.id,title:'Deposit',kind:'deposit'}).entity!;run('invoice.issue',{},deposit.id);
  run('payment.record',{invoiceId:deposit.id,amount:10,reference:'p1',method:'wire'});
  run('payment.record',{invoiceId:deposit.id,amount:15,reference:'p2',method:'wire'});
  const slot=run('schedule.create',{jobId:job.id,crew:'A',startAt:'2026-06-10T08:00:00Z',endAt:'2026-06-10T12:00:00Z'}).entity!;
  run('schedule.reschedule',{startAt:'2026-06-11T08:00:00Z',endAt:'2026-06-11T12:00:00Z'},slot.id);
  run('schedule.cancel',{},slot.id);
  return {state,run,job,deposit,slot,customer,estimate,rejected};
}
const group=(action:string)=>action.split('.')[0];

test('every emitted approval, schedule and payment transition validates as PainterTransitionPayload v1',()=>{
  const f=lifecycle();
  const seen=new Set<string>();
  for(const event of f.state.events){
    const payload=validatePayload(event,owner.tenantId);
    seen.add(payload.action);
    if(['estimate.approve','estimate.reject','estimate.requestChanges'].includes(payload.action))assert.equal(payload.customerId,f.customer.id);
    if(group(payload.action)==='payment')assert.ok(payload.paymentId&&payload.invoiceId&&payload.amountCents);
  }
  for(const action of ['estimate.approve','estimate.reject','estimate.requestChanges','schedule.create','schedule.reschedule','schedule.cancel','payment.record'])assert.ok(seen.has(action),`no event emitted for ${action}`);
  const named=new Set(f.state.events.map(e=>`${String(e.payload.action)}:${e.type}`));
  assert.ok(named.has('estimate.approve:EstimateApproved'));
  assert.ok(named.has('schedule.create:JobScheduled'));
  assert.ok(named.has('schedule.reschedule:JobScheduled'));
  assert.ok(named.has('payment.record:DepositReceived'));
});

test('transition payload revision advances by one per aggregate and ends at the entity revision',()=>{
  const f=lifecycle();
  const last=new Map<string,number>();
  for(const event of f.state.events){
    const p=validatePayload(event,owner.tenantId);
    const prev=last.get(event.entityId);
    if(p.before===null)assert.equal(prev,undefined,'creation event must be the first for its aggregate');
    else assert.ok(prev!==undefined,'update event before creation event');
    assert.equal(p.revision,(prev??0)+1,`${event.type}/${event.entityId}: revision must advance by exactly one`);
    last.set(event.entityId,p.revision);
  }
  for(const [id,revision] of last)assert.equal(f.state.entities.find(e=>e.id===id)!.revision,revision);
});

test('revision order per aggregate is preserved in the event log',()=>{
  const f=lifecycle();
  const byAggregate=new Map<string,number[]>();
  for(const event of f.state.events)byAggregate.set(event.entityId,[...(byAggregate.get(event.entityId)??[]),event.payload.revision as number]);
  for(const [id,revisions] of byAggregate){const sorted=[...revisions].sort((a,b)=>a-b);assert.deepEqual(revisions,sorted,id);assert.equal(new Set(revisions).size,revisions.length,id);}
  const times=f.state.events.map(e=>e.occurredAt);assert.deepEqual(times,[...times].sort());
  assert.equal(new Set(f.state.events.map(e=>e.id)).size,f.state.events.length);
  assert.deepEqual(byAggregate.get(f.slot.id),[1,2,3]);
});

/**
 * Reference consumer for the freeze rule: deduplicate per (source, tenantId, eventId, consumer).
 * No production consumer or event bus exists; this defines the contract a future consumer must satisfy.
 */
class ReferenceConsumer{
  readonly applied:{key:string;revision:number}[]=[];
  readonly lastRevision=new Map<string,number>();
  private readonly seen=new Set<string>();
  constructor(readonly name:string){}
  deliver(event:AuditEvent,source='painter-host'){
    const key=JSON.stringify([source,event.payload.tenantId,event.id,this.name]);
    if(this.seen.has(key))return 'duplicate' as const;
    this.seen.add(key);
    const revision=event.payload.revision as number;
    const aggregate=JSON.stringify([source,event.payload.tenantId,event.entityId]);
    if(revision<=(this.lastRevision.get(aggregate)??0))return 'stale' as const;
    this.applied.push({key,revision});this.lastRevision.set(aggregate,revision);return 'applied' as const;
  }
}

test('duplicate delivery keyed by (source, tenantId, eventId, consumer) is idempotent',()=>{
  const f=lifecycle();
  const consumer=new ReferenceConsumer('ledger');
  for(const event of f.state.events)assert.equal(consumer.deliver(structuredClone(event)),'applied');
  const snapshot=structuredClone({applied:consumer.applied,last:[...consumer.lastRevision]});
  for(const event of f.state.events)assert.equal(consumer.deliver(structuredClone(event)),'duplicate');
  assert.deepEqual({applied:consumer.applied,last:[...consumer.lastRevision]},snapshot);
  for(const event of [...f.state.events].reverse())consumer.deliver(structuredClone(event));
  assert.equal(consumer.applied.length,f.state.events.length);
  // A different consumer, source or tenant is a distinct key, so each still applies once.
  const first=f.state.events[0]!;
  assert.equal(new ReferenceConsumer('notifications').deliver(first),'applied');
  const other=new ReferenceConsumer('ledger');
  assert.equal(other.deliver(first,'contractor-os'),'applied');
  assert.equal(other.deliver({...first,payload:{...first.payload,tenantId:'other'}}),'applied');
});

test('consumers keep per-aggregate revision order when events arrive out of order',()=>{
  const f=lifecycle();
  const slotEvents=f.state.events.filter(e=>e.entityId===f.slot.id);
  assert.equal(slotEvents.length,3);
  const consumer=new ReferenceConsumer('schedule-view');
  assert.equal(consumer.deliver(slotEvents[2]!),'applied');
  assert.equal(consumer.deliver(slotEvents[0]!),'stale');
  assert.equal(consumer.deliver(slotEvents[1]!),'stale');
  assert.equal(consumer.lastRevision.get(JSON.stringify(['painter-host',owner.tenantId,f.slot.id])),3);
});

test('engine replay of approval, schedule and payment commands appends no event',()=>{
  const f=lifecycle();
  const count=f.state.events.length;
  const findKey=(action:string,entityId?:string)=>f.state.events.find(e=>e.payload.action===action&&(!entityId||e.entityId===entityId))!.payload.requestKey as string;
  const cases:[string,Record<string,unknown>,Actor,string|undefined][]=[
    ['estimate.approve',{},customerActor,f.estimate.id],
    ['payment.record',{invoiceId:f.deposit.id,amount:10,reference:'p1',method:'wire'},owner,undefined],
    ['schedule.cancel',{},owner,f.slot.id]
  ];
  for(const [action,input,actor,entityId] of cases){
    const result=applyCommand(f.state,actor,{action,input,requestKey:findKey(action,entityId),...(entityId?{entityId}:{})});
    assert.equal(result.replayed,true,action);
  }
  assert.equal(f.state.events.length,count);
});

test('event ids are tenant-prefixed strings unique across aggregates and reference real entities',()=>{
  const f=lifecycle();
  const ids=f.state.events.map(e=>e.id);
  assert.ok(ids.every(id=>typeof id==='string'&&id.startsWith(`${owner.tenantId}:`)));
  assert.equal(new Set(ids).size,ids.length);
  assert.ok(f.state.events.every(e=>f.state.entities.some(x=>x.id===e.entityId)));
});
