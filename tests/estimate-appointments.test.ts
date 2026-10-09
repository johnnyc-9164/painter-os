import {test} from 'node:test';
import assert from 'node:assert/strict';
import {estimateSlotInstant,makeEstimateSlot,stageEstimateAppointment,ESTIMATE_APPOINTMENT_LIMITS,type AppointmentContext,type EstimateAppointmentState,type EstimateSlot} from '../packages/domain/src/estimate-appointments.ts';

const nowMs=Date.parse('2026-10-09T12:00:00Z');
const office={id:'office-a',tenantId:'company-a',role:'office_admin' as const};
function context(patch:Partial<AppointmentContext>={}):AppointmentContext{return {actor:office,nowMs,resource:{tenantId:'company-a',userId:'estimator-a',role:'estimator',enabled:true,identityExists:true},lead:{id:'lead-a',tenantId:'company-a',revision:4,status:'qualified',customerId:'customer-a'},customer:{id:'customer-a',tenantId:'company-a',revision:2},...patch};}
function slot(patch:Partial<Parameters<typeof makeEstimateSlot>[1]>={}):EstimateSlot{return makeEstimateSlot(context(),{id:'slot-a',revision:1,resourceId:'estimator-a',status:'offered',localStart:'2026-10-12T09:00',timeZone:'America/Chicago',offset:'-05:00',durationMinutes:60,bufferBeforeMinutes:15,bufferAfterMinutes:15,...patch});}
const empty=():EstimateAppointmentState=>({appointments:[],receipts:[]});
function propose(state=empty(),currentSlot=slot(),appointmentId='appointment-a',leadId='lead-a'){
 const ctx=context({resource:{...context().resource!,userId:currentSlot.resourceId},slot:currentSlot,lead:{...context().lead!,id:leadId}});
 const command={kind:'propose' as const,appointmentId,requestKey:`propose-${appointmentId}`,leadId,leadRevision:4,customerId:'customer-a',customerRevision:2,slotId:currentSlot.id,slotRevision:currentSlot.revision};
 return {...stageEstimateAppointment(state,ctx,command),ctx,command};
}
function approve(proposal:ReturnType<typeof propose>,state=proposal.state){return stageEstimateAppointment(state,proposal.ctx,{kind:'approve',appointmentId:proposal.appointment.id,expectedRevision:proposal.appointment.revision,requestKey:`approve-${proposal.appointment.id}`});}

test('native proposal is unbooked, contact-free and office approval is internal-only with no calendar/customer effect',()=>{
 const privateContext=context({lead:{...context().lead!,name:'Private contact',email:'private@example.test'} as AppointmentContext['lead'],slot:slot()});
 const p=propose();const created=stageEstimateAppointment(empty(),privateContext,p.command);assert.equal(created.appointment.status,'proposed');assert.equal(JSON.stringify(created).includes('private@example.test'),false);assert.equal(JSON.stringify(created).includes('Private contact'),false);
 const approved=approve(p);assert.equal(approved.appointment.status,'reserved_internal');assert.equal(approved.appointment.revision,2);assert.equal(approved.appointment.approvedBy,office.id);assert.equal(approved.nativeOnly,true);assert.equal(approved.customerNotified,false);assert.equal(approved.externalCalendarsChecked,false);assert.equal(p.state.appointments[0].status,'proposed');
});
test('one-off IANA/offset rules reject invalid dates, DST gaps and ambiguous missing offsets; both folds resolve explicitly',()=>{
 assert.equal(estimateSlotInstant('2026-11-01T01:30','America/Chicago','-05:00'),'2026-11-01T06:30:00.000Z');assert.equal(estimateSlotInstant('2026-11-01T01:30','America/Chicago','-06:00'),'2026-11-01T07:30:00.000Z');
 for(const offset of ['-06:00','-05:00'])assert.throws(()=>estimateSlotInstant('2026-03-08T02:30','America/Chicago',offset),/ZONE_OFFSET_MISMATCH/);
 for(const [local,zone,offset] of [['2026-02-30T09:00','UTC','+00:00'],['2026-10-12T25:00','UTC','+00:00'],['2026-10-12T09:00','CST','-06:00'],['2026-10-12T09:00','America/Chicago','-06:00'],['2026-10-12T09:00','UTC','-00:00'],['2026-10-12T09:00','UTC','+14:30'],['2026-11-01T01:30','America/Chicago',undefined]])assert.throws(()=>estimateSlotInstant(local!,zone!,offset as string));
 const spring=makeEstimateSlot({...context(),nowMs:Date.parse('2026-03-01T00:00Z')},{id:'spring',revision:1,resourceId:'estimator-a',status:'offered',localStart:'2026-03-08T01:30',timeZone:'America/Chicago',offset:'-06:00',durationMinutes:60,bufferBeforeMinutes:0,bufferAfterMinutes:0});assert.equal(spring.startAt,'2026-03-08T07:30:00.000Z');assert.equal(spring.endAt,'2026-03-08T08:30:00.000Z');
});
test('slot duration/buffers/future rules and prospective office/resource eligibility are explicit, not browser-local defaults',()=>{
 for(const patch of [{durationMinutes:0},{durationMinutes:241},{bufferBeforeMinutes:-1},{bufferAfterMinutes:121},{revision:1.5},{status:'unknown'},{resourceId:'other-resource'},{localStart:'2026-10-08T09:00'}])assert.throws(()=>slot(patch as Parameters<typeof slot>[0]));
 for(const role of ['customer','salesperson','project_manager','estimator','crew_member'] as const)assert.throws(()=>makeEstimateSlot(context({actor:{...office,role}}),{...slot(),tenantId:undefined,startAt:undefined,endAt:undefined} as unknown as Parameters<typeof makeEstimateSlot>[1]),/OFFICE_REQUIRED/);
 for(const patch of [{enabled:false},{identityExists:false},{tenantId:'company-b'},{role:'crew_member' as const}])assert.throws(()=>makeEstimateSlot(context({resource:{...context().resource!,...patch}}),{id:'slot-a',revision:1,resourceId:'estimator-a',status:'offered',localStart:'2026-10-12T09:00',timeZone:'America/Chicago',offset:'-05:00',durationMinutes:60,bufferBeforeMinutes:0,bufferAfterMinutes:0}),/RESOURCE_UNAVAILABLE/);
});
test('qualified customer-linked current tenant sources are required and fresh revisions gate approval',()=>{
 const p=propose();
 for(const patch of [{lead:{...p.ctx.lead!,status:'new' as const}},{lead:{...p.ctx.lead!,customerId:null}},{lead:{...p.ctx.lead!,tenantId:'company-b'}},{customer:{...p.ctx.customer!,tenantId:'company-b'}},{lead:{...p.ctx.lead!,revision:5}},{customer:{...p.ctx.customer!,revision:3}},{slot:{...p.ctx.slot!,revision:2}},{slot:{...p.ctx.slot!,status:'closed' as const}},{resource:{...p.ctx.resource!,enabled:false}},{resource:{...p.ctx.resource!,identityExists:false}}]){
  const before=JSON.stringify(p.state);assert.throws(()=>stageEstimateAppointment(p.state,{...p.ctx,...patch},{kind:'approve',appointmentId:p.appointment.id,expectedRevision:1,requestKey:'changed-approve'}));assert.equal(JSON.stringify(p.state),before);
 }
 const foreign={...p.ctx,actor:{...office,tenantId:'company-b'}};assert.throws(()=>stageEstimateAppointment(p.state,foreign,{kind:'cancel',appointmentId:p.appointment.id,expectedRevision:1,requestKey:'foreign-cancel'}),/NOT_FOUND/);
});
test('padded resource conflicts are half-open; adjacency, different resources and foreign tenants do not conflict',()=>{
 const first=approve(propose());
 const overlapping=propose(first.state,slot({id:'slot-b',localStart:'2026-10-12T10:00'}),'appointment-b','lead-b');assert.throws(()=>approve(overlapping),/RESOURCE_CONFLICT/);
 const adjacent=propose(first.state,slot({id:'slot-c',localStart:'2026-10-12T10:30'}),'appointment-c','lead-c');assert.equal(approve(adjacent).appointment.status,'reserved_internal');
 const otherSlot={...slot({id:'slot-d'}),resourceId:'estimator-b'};const other=propose(first.state,otherSlot,'appointment-d','lead-d');other.ctx.resource={...other.ctx.resource!,userId:'estimator-b'};assert.equal(approve(other).appointment.status,'reserved_internal');
 const foreignState={appointments:[{...first.appointment,tenantId:'company-b'}],receipts:[]};assert.equal(approve(propose(foreignState,slot({id:'slot-e'}),'appointment-e','lead-e')).appointment.status,'reserved_internal');
});
test('pure candidates alone are not atomic; serialized fresh conflict state admits only the first reservation',()=>{
 const a=propose();const b=propose(a.state,slot(),'appointment-b','lead-b');
 assert.equal(approve(a,b.state).appointment.status,'reserved_internal');assert.equal(approve(b,b.state).appointment.status,'reserved_internal'); // Same stale snapshot can stage both; future host OCC is mandatory.
 const committed=approve(a,b.state);assert.throws(()=>approve(b,committed.state),/RESOURCE_CONFLICT/);assert.equal(b.state.appointments.every(row=>row.status==='proposed'),true);
});
test('idempotency fingerprints bind actor and exact intent; confirmation replay after cancellation never rebooks',()=>{
 const p=propose();const confirmed=approve(p);const cancel={kind:'cancel' as const,appointmentId:p.appointment.id,expectedRevision:2,requestKey:'cancel-a'};const cancelled=stageEstimateAppointment(confirmed.state,context(),cancel);
 const replay=stageEstimateAppointment(cancelled.state,p.ctx,{kind:'approve',appointmentId:p.appointment.id,expectedRevision:1,requestKey:`approve-${p.appointment.id}`});assert.equal(replay.replayed,true);assert.equal(replay.appointment.status,'cancelled');assert.equal(replay.state.receipts.length,cancelled.state.receipts.length);
 assert.equal(stageEstimateAppointment(cancelled.state,context(),cancel).replayed,true);
 assert.throws(()=>stageEstimateAppointment(p.state,p.ctx,{...p.command,slotRevision:2}),/IDEMPOTENCY_CONFLICT/);assert.throws(()=>stageEstimateAppointment(p.state,{...p.ctx,actor:{...office,id:'another-office'}},p.command),/IDEMPOTENCY_CONFLICT/);
 assert.throws(()=>stageEstimateAppointment(cancelled.state,p.ctx,{kind:'approve',appointmentId:p.appointment.id,expectedRevision:3,requestKey:'new-approve'}),/INVALID_TRANSITION/);
 assert.throws(()=>stageEstimateAppointment(cancelled.state,{...p.ctx,actor:{...office,role:'customer'}},{kind:'approve',appointmentId:p.appointment.id,expectedRevision:1,requestKey:`approve-${p.appointment.id}`}),/OFFICE_REQUIRED/);
});
test('cancellation releases native capacity even after source/resource removal; failed reschedule retains original reservation',()=>{
 const first=approve(propose());const blocked=approve(propose(first.state,slot({id:'later',localStart:'2026-10-12T12:00'}),'appointment-b','lead-b'));
 const command={kind:'reschedule' as const,appointmentId:'appointment-a',expectedRevision:2,requestKey:'move-a',slotId:'later',slotRevision:1,leadRevision:4,customerRevision:2};const ctx=context({slot:slot({id:'later',localStart:'2026-10-12T12:00'})});const before=JSON.stringify(blocked.state);assert.throws(()=>stageEstimateAppointment(blocked.state,ctx,command),/RESOURCE_CONFLICT/);assert.equal(JSON.stringify(blocked.state),before);
 const destination=slot({id:'open',localStart:'2026-10-12T14:00'});const moved=stageEstimateAppointment(blocked.state,context({slot:destination}),{...command,slotId:'open'});assert.equal(moved.appointment.startAt,destination.startAt);assert.equal(moved.appointment.status,'reserved_internal');assert.equal(moved.appointment.revision,3);assert.equal(first.appointment.startAt,slot().startAt);
 const cancelled=stageEstimateAppointment(moved.state,{actor:office,nowMs},{kind:'cancel',appointmentId:'appointment-a',expectedRevision:3,requestKey:'cancel-removed'});assert.equal(cancelled.appointment.status,'cancelled');assert.equal(approve(propose(cancelled.state,destination,'replacement','lead-new')).appointment.status,'reserved_internal');
});
test('proposed reschedule stays unbooked, cannot retarget customer, and bounded/unknown input fails closed',()=>{
 const p=propose();const destination=slot({id:'later',localStart:'2026-10-12T12:00'});const command={kind:'reschedule' as const,appointmentId:p.appointment.id,expectedRevision:1,requestKey:'change-proposal',slotId:'later',slotRevision:1,leadRevision:4,customerRevision:2};assert.equal(stageEstimateAppointment(p.state,{...p.ctx,slot:destination},command).appointment.status,'proposed');
 assert.throws(()=>stageEstimateAppointment(p.state,{...p.ctx,slot:destination,lead:{...p.ctx.lead!,customerId:'other'}},command),/QUALIFIED_SOURCE_REQUIRED/);
 assert.throws(()=>stageEstimateAppointment(p.state,p.ctx,{...p.command,contactEmail:'private@example.test'} as unknown as Parameters<typeof stageEstimateAppointment>[2]),/UNKNOWN_FIELD/);
 assert.throws(()=>propose({appointments:Array.from({length:ESTIMATE_APPOINTMENT_LIMITS.appointments+1},()=>p.appointment),receipts:[]}),/STATE_LIMIT/);
 assert.throws(()=>stageEstimateAppointment(p.state,p.ctx,{kind:'cancel',appointmentId:p.appointment.id,expectedRevision:1.5,requestKey:'invalid-revision'}),/INVALID_REVISION/);
 assert.throws(()=>stageEstimateAppointment(p.state,p.ctx,{kind:'cancel',appointmentId:p.appointment.id,expectedRevision:2,requestKey:'stale-revision'}),/REVISION_CONFLICT/);
 assert.throws(()=>stageEstimateAppointment({appointments:[{...p.appointment,contactEmail:'private@example.test'}],receipts:[]} as unknown as EstimateAppointmentState,p.ctx,{kind:'cancel',appointmentId:p.appointment.id,expectedRevision:1,requestKey:'no-contact-copy'}),/UNKNOWN_FIELD/);
 assert.throws(()=>stageEstimateAppointment({appointments:[{...p.appointment,endAt:'invalid'}],receipts:[]},p.ctx,{kind:'cancel',appointmentId:p.appointment.id,expectedRevision:1,requestKey:'invalid-record'}),/INVALID_CONFLICT_RECORD/);
});

test('exhausted revisions reject every new transition without mutation while exact receipt replay remains valid',()=>{
 const p=propose();const revision=Number.MAX_SAFE_INTEGER-1;
 const state={appointments:[{...p.appointment,revision}],receipts:p.state.receipts};const before=JSON.stringify(state);
 for(const kind of ['approve','cancel','reschedule'] as const){
  const command=kind==='reschedule'?{kind,appointmentId:p.appointment.id,expectedRevision:revision,requestKey:'exhausted-'+kind,slotId:p.appointment.slotId,slotRevision:1,leadRevision:4,customerRevision:2}:{kind,appointmentId:p.appointment.id,expectedRevision:revision,requestKey:'exhausted-'+kind};
  assert.throws(()=>stageEstimateAppointment(state,p.ctx,command),/REVISION_EXHAUSTED/);assert.equal(JSON.stringify(state),before);
 }
 assert.equal(stageEstimateAppointment(state,p.ctx,p.command).replayed,true);assert.equal(JSON.stringify(state),before);
});
test('reschedule rejects another active same-tenant lead/slot proposal, excluding itself and cancelled targets',()=>{
 const a=propose();const destination=slot({id:'later',localStart:'2026-10-12T12:00'});
 const b=propose(a.state,destination,'appointment-b');
 const command={kind:'reschedule' as const,appointmentId:a.appointment.id,expectedRevision:1,requestKey:'duplicate-move',slotId:destination.id,slotRevision:1,leadRevision:4,customerRevision:2};
 const ctx={...a.ctx,slot:destination};const before=JSON.stringify(b.state);
 assert.throws(()=>stageEstimateAppointment(b.state,ctx,command),/DUPLICATE_PROPOSAL/);assert.equal(JSON.stringify(b.state),before);
 const cancelled=stageEstimateAppointment(b.state,b.ctx,{kind:'cancel',appointmentId:b.appointment.id,expectedRevision:1,requestKey:'cancel-duplicate'});
 const moved=stageEstimateAppointment(cancelled.state,ctx,command);assert.equal(moved.appointment.slotId,destination.id);
 const same=stageEstimateAppointment(moved.state,ctx,{...command,expectedRevision:2,requestKey:'same-slot'});assert.equal(same.appointment.status,'proposed');
 const foreign={appointments:b.state.appointments.map(row=>row.id===b.appointment.id?{...row,tenantId:'company-b'}:row),receipts:b.state.receipts};
 assert.equal(stageEstimateAppointment(foreign,ctx,command).appointment.slotId,destination.id);
});
