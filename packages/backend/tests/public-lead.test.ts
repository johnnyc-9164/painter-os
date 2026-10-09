import {afterEach,expect,it,vi} from 'vitest';
import {convexTest} from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import rateLimiterTest from '@convex-dev/rate-limiter/test';
import schema from '../convex/schema';
import {api} from '../convex/runtime';
import {INTAKE_ADMISSION} from '../intake-admission-contract';
import {intakeRateLimiter} from '../convex/intakeAdmission';
import {CONTACT_RETENTION_DAYS} from '../public-lead-contract';
import {nextActionQueue} from '../../domain/src/next-action-queue';
import type {Role} from '../../domain/src/contracts';
const modules={'./_generated/test-root-marker.ts':()=>Promise.resolve({}),'./painter.ts':()=>import('../convex/painter'),'./runtime.ts':()=>import('../convex/runtime'),'./intakeConfig.ts':()=>import('../convex/intakeConfig'),'./contactIntakeConfig.ts':()=>import('../convex/contactIntakeConfig'),'./publicLead.ts':()=>import('../convex/publicLead'),'./intakePrivacy.ts':()=>import('../convex/intakePrivacy')};
const contactSettings={enabled:true,consentText:'Contact me about this project.',acknowledgeRetention:true};
const guidanceSettings={enabled:true,consentText:'Guidance only.',servicePostalCodes:['00501'],supportedProjectTypes:['interior' as const]};
const submission=(n=1)=>({requestKey:`opaque_request_${String(n).padStart(32,'0')}`,contactPolicyRevision:1,guidanceRevision:1,consent:true,contact:{name:'PRIVATE-VISITOR',email:'private-contact@example.test'},project:{postalCode:'00501',projectType:'interior' as const,scope:'PRIVATE-SCOPE',timeline:'Fall'}});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();});
async function fixture(documentsRead?:number){
 vi.useFakeTimers();vi.setSystemTime(new Date('2026-10-09T14:00:00Z'));
 const t=convexTest({schema,modules,transactionLimits:documentsRead?{documentsRead,bytesRead:131072}:false});
 t.registerComponent('betterAuth',betterAuthTest.schema,{...betterAuthTest.modules,'./component/adapter.ts':()=>import('../../../node_modules/@convex-dev/better-auth/src/component/adapter'),'./component/_generated/test-root-marker.ts':()=>Promise.resolve({})});rateLimiterTest.register(t);
 const addIdentity=async(label:string)=>t.runInComponent('betterAuth',async ctx=>{const userId=await ctx.db.insert('user',{name:label,email:`${label}@example.test`,emailVerified:true,createdAt:1,updatedAt:1});const sessionId=await ctx.db.insert('session',{userId,token:`session-${label}`,expiresAt:Date.now()+90*86400000,createdAt:1,updatedAt:1});return {userId,sessionId};});
 const identity=await addIdentity('owner');const owner=t.withIdentity({subject:identity.userId,sessionId:identity.sessionId});const workspace=await owner.mutation(api.painter.createWorkspace,{name:'Synthetic intake company'});
 const addMember=async(label:string,role:Role)=>{const identity=await addIdentity(label);await t.run(ctx=>ctx.db.insert('painterMembers',{tenantId:workspace.id,userId:identity.userId,name:label,email:`${label}@example.test`,role,enabled:true}));return t.withIdentity({subject:identity.userId,sessionId:identity.sessionId});};
 const enable=async()=>{await owner.mutation(api.intakeConfig.configure,{workspaceId:workspace.id,expectedRevision:0,requestKey:'guidance',settings:guidanceSettings});await owner.mutation(api.contactIntakeConfig.configure,{workspaceId:workspace.id,expectedRevision:0,requestKey:'contact-policy',settings:contactSettings});};
 const submit=(n=1,value=submission(n))=>t.mutation(api.publicLead.submit,{workspaceId:String(workspace.id),submission:value});
 const row=async()=>t.run(ctx=>ctx.db.query('painterPublicLeadReceipts').withIndex('by_tenant_request',q=>q.eq('tenantId',workspace.id)).first());
 return {t,owner,workspace,identity,addMember,enable,submit,row};
}

it('actual Better Auth/current membership governs opt-in and owner deletion; guidance alone stays closed',async()=>{
 const f=await fixture();await f.owner.mutation(api.intakeConfig.configure,{workspaceId:f.workspace.id,expectedRevision:0,requestKey:'guidance',settings:guidanceSettings});
 expect(await f.submit()).toEqual({state:'denied',reason:'unavailable'});
 expect(await f.t.query(api.contactIntakeConfig.publicPolicy,{workspaceId:String(f.workspace.id)})).toEqual({state:'unavailable'});
 const args={workspaceId:f.workspace.id,expectedRevision:0,requestKey:'contact-policy',settings:contactSettings};
 await expect(f.t.mutation(api.contactIntakeConfig.configure,args)).rejects.toThrow('UNAUTHENTICATED');
 await expect(f.t.withIdentity({subject:'forged',sessionId:f.identity.sessionId}).mutation(api.contactIntakeConfig.configure,args)).rejects.toThrow('UNAUTHENTICATED');
 const sales=await f.addMember('sales','salesperson');await expect(sales.mutation(api.contactIntakeConfig.configure,args)).rejects.toThrow('FORBIDDEN');
 const office=await f.addMember('office','office_admin');expect(await office.mutation(api.contactIntakeConfig.configure,args)).toEqual({enabled:true,revision:1,replayed:false});
 const received=await f.submit();expect(received.state).toBe('received');
 await expect(office.mutation(api.intakePrivacy.deleteRequest,{workspaceId:f.workspace.id,reference:received.reference})).rejects.toThrow('FORBIDDEN');
 await f.t.run(async ctx=>{const member=await ctx.db.query('painterMembers').withIndex('by_tenant_user',q=>q.eq('tenantId',f.workspace.id).eq('userId',f.identity.userId)).unique();await ctx.db.patch(member!._id,{enabled:false});});
 await expect(f.owner.mutation(api.intakePrivacy.deleteRequest,{workspaceId:f.workspace.id,reference:received.reference})).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
});

it('new public DTO preserves guidance v1 and requires current contact consent revision',async()=>{
 const f=await fixture();await f.enable();
 const v1=await f.t.query(api.intakeConfig.publicPolicy,{workspaceId:String(f.workspace.id)});expect(Object.keys(v1.intake).sort()).toEqual(['companyName','consentText','enabled','revision','servicePostalCodes','supportedProjectTypes'].sort());
 const policy=await f.t.query(api.contactIntakeConfig.publicPolicy,{workspaceId:String(f.workspace.id)});expect(policy.policy.retentionDays).toBe(30);expect(policy.policy.retentionDisclosure).toContain('Unprocessed requests');
 expect(await f.submit(1,{...submission(),contactPolicyRevision:2})).toEqual({state:'denied',reason:'policy_changed'});
 await expect(f.t.mutation(api.publicLead.submit,{workspaceId:String(f.workspace.id),submission:{...submission(),role:'owner'}})).rejects.toThrow();
 await expect(f.t.mutation(api.publicLead.submit,{workspaceId:String(f.workspace.id),submission:{...submission(),consent:false}})).rejects.toThrow();
 expect(await f.row()).toBeNull();
});

it('direct anonymous calls enforce actual component quota, exact concurrency and indexed bounded reads',async()=>{
 const f=await fixture(60);await f.enable();
 await f.t.run(async ctx=>{for(let n=0;n<200;n++)await ctx.db.insert('painterEntities',{tenantId:f.workspace.id,entityId:`manual-${n}`,type:'lead',revision:1,createdAt:'2026-10-01',updatedAt:'2026-10-01',data:{name:`Unrelated ${n}`,status:'new'}});});
 const repeated=await Promise.all(Array.from({length:8},()=>f.submit()));expect(new Set(repeated.map(result=>result.reference)).size).toBe(1);
 const results=await Promise.all(Array.from({length:INTAKE_ADMISSION.tenantAttemptsPerMinute+2},(_,n)=>f.submit(n+2)));
 expect(results.filter(result=>result.state==='received')).toHaveLength(INTAKE_ADMISSION.tenantAttemptsPerMinute-1);
 expect(results.filter(result=>result.reason==='tenant_limit')).toHaveLength(3);
 const budget=await f.t.run(ctx=>intakeRateLimiter.getValue(ctx,'intakeTenantAttempts',{key:String(f.workspace.id)}));expect(budget.value).toBe(0);
 const receipt=await f.row();expect(receipt!.state).toBe('received');
});

it('unknown-outcome proof and exact retry survive closure; payload changes never create another lead',async()=>{
 const f=await fixture();await f.enable();const result=await f.submit();
 expect(Object.keys(result).sort()).toEqual(['reference','state']);expect(result.reference).toMatch(/^[a-f0-9]{64}$/);
 expect(await f.submit(1,{...submission(),contact:{name:'Changed',email:'other@example.test'}})).toEqual({state:'denied',reason:'request_conflict'});
 await f.owner.mutation(api.contactIntakeConfig.configure,{workspaceId:f.workspace.id,expectedRevision:1,requestKey:'disable',settings:{...contactSettings,enabled:false}});
 expect(await f.submit()).toEqual(result);
 expect(await f.t.query(api.publicLead.status,{workspaceId:String(f.workspace.id),requestKey:submission().requestKey})).toEqual(result);
 expect(await f.submit(2)).toEqual({state:'denied',reason:'unavailable'});
 await f.t.run(async ctx=>{expect(await ctx.db.query('painterPublicLeadReceipts').collect()).toHaveLength(1);expect((await ctx.db.query('painterEntities').collect()).filter(row=>row.type==='customer')).toHaveLength(0);const metadata=await ctx.db.query('painterPublicLeadReceipts').collect();expect(JSON.stringify(metadata)).not.toContain('PRIVATE-');expect(JSON.stringify(metadata)).not.toContain(submission().requestKey);});
});

it('owner deletion stays pending through bounded audit/receipt redaction and destroys all application copies',async()=>{
 const f=await fixture();await f.enable();const result=await f.submit();const receipt=(await f.row())!;
 await f.owner.mutation(api.painter.command,{workspaceId:f.workspace.id,command:{action:'lead.create',requestKey:'manual',input:{name:'Manual preserved'}}});
 for(let n=0;n<32;n++)await f.owner.mutation(api.painter.command,{workspaceId:f.workspace.id,command:{action:'lead.update',entityId:receipt.leadEntityId,requestKey:`private-key@example.test:${n}`,input:{name:`PRIVATE-EDIT-${n}`,notes:'PRIVATE-SCOPE',source:'manual'}}});
 await f.t.run(async ctx=>{const audit=await ctx.db.query('painterEvents').withIndex('by_tenant_entity',q=>q.eq('tenantId',f.workspace.id).eq('entityId',receipt.leadEntityId)).collect();expect(JSON.stringify(audit)).not.toContain('PRIVATE-');const commands=await ctx.db.query('painterReceipts').collect();expect(JSON.stringify(commands)).not.toContain('private-key@example.test');expect(commands.filter(row=>row.fingerprint.startsWith('sha256:'))).toHaveLength(33);});
 vi.setSystemTime(new Date(receipt.consentedAt+2*86400000));
 const snapshot=await f.owner.query(api.painter.snapshot,{workspaceId:f.workspace.id});
 const proposals=nextActionQueue(snapshot.actor,snapshot.entities,new Date().toISOString());
 expect(proposals).toHaveLength(1);expect(proposals[0]!.source.id).not.toBe(receipt.leadEntityId);expect(JSON.stringify(proposals)).not.toContain('PRIVATE-');
 await f.owner.mutation(api.painter.command,{workspaceId:f.workspace.id,command:{...proposals[0]!.draft,requestKey:'approved-queue-task'}});
 const deleted=await f.owner.mutation(api.intakePrivacy.deleteRequest,{workspaceId:f.workspace.id,reference:result.reference});expect(deleted).toEqual({state:'deletion_pending',processed:25});
 expect((await f.t.query(api.publicLead.status,{workspaceId:String(f.workspace.id),requestKey:submission().requestKey})).state).toBe('deletion_pending');
 await expect(f.owner.mutation(api.painter.command,{workspaceId:f.workspace.id,command:{action:'lead.update',entityId:receipt.leadEntityId,requestKey:'new-after-delete',input:{name:'Recreate'}}})).rejects.toThrow('INTAKE_CONTACT_DELETED');
 let steps=0;while((await f.row())!.state!=='deleted'){const step=await f.t.mutation(api.intakePrivacy.continueCleanup,{receiptId:receipt._id});expect(step.processed).toBeLessThanOrEqual(25);expect(++steps).toBeLessThan(8);}
 expect((await f.submit()).state).toBe('deleted');
 expect(await f.owner.mutation(api.painter.command,{workspaceId:f.workspace.id,command:{action:'lead.update',entityId:receipt.leadEntityId,requestKey:'private-key@example.test:0',input:{name:'PRIVATE-EDIT-0',notes:'PRIVATE-SCOPE',source:'manual'}}})).toEqual({message:'INTAKE_CONTACT_DELETED',replayed:true});
 await f.t.run(async ctx=>{const all=JSON.stringify([await ctx.db.query('painterEntities').collect(),await ctx.db.query('painterEvents').collect(),await ctx.db.query('painterReceipts').collect(),await ctx.db.query('painterPublicLeadReceipts').collect(),await ctx.db.query('painterIntakeReceiptLinks').collect()]);for(const marker of ['PRIVATE-','private-contact@example.test','private-key@example.test',submission().requestKey])expect(all).not.toContain(marker);expect(all).toContain('Manual preserved');expect(await ctx.db.query('painterIntakeReceiptLinks').collect()).toHaveLength(0);});
});

it('lost origins retain their original 30-day deadline and scheduler deletes only intake',async()=>{
 const f=await fixture();await f.enable();await f.submit();const receipt=(await f.row())!;
 await f.owner.mutation(api.painter.command,{workspaceId:f.workspace.id,command:{action:'lead.lose',entityId:receipt.leadEntityId,requestKey:'lose',input:{}}});
 await f.owner.mutation(api.painter.command,{workspaceId:f.workspace.id,command:{action:'lead.create',requestKey:'manual',input:{name:'Manual preserved'}}});
 expect((await f.row())!.dueAt).toBe(receipt.consentedAt+CONTACT_RETENTION_DAYS*86400000);
 vi.setSystemTime(new Date(receipt.dueAt));
 await f.t.finishAllScheduledFunctions(()=>vi.runAllTimers());
 expect((await f.row())!.state).toBe('deleted');
 await f.t.run(async ctx=>{expect((await ctx.db.query('painterEntities').collect()).map(row=>row.data.name)).toEqual(['Manual preserved']);});
});

it('only audited owner/office customer transfer preserves converted CRM records across purge/deletion',async()=>{
 const f=await fixture();await f.enable();const proof=await f.submit();const receipt=(await f.row())!;const sales=await f.addMember('sales','salesperson');
 const command={action:'lead.qualify',entityId:receipt.leadEntityId,requestKey:'qualify',input:{}};
 await expect(sales.mutation(api.painter.command,{workspaceId:f.workspace.id,command})).rejects.toThrow('INTAKE_RETENTION_TRANSFER_FORBIDDEN');
 const result=await f.owner.mutation(api.painter.command,{workspaceId:f.workspace.id,command});expect(result.entities.some((row:{type:string})=>row.type==='customer')).toBe(true);
 expect((await f.row())!.state).toBe('converted_preserved');expect((await f.row())!.transferredBy).toBe(f.identity.userId);
 expect((await f.owner.mutation(api.intakePrivacy.deleteRequest,{workspaceId:f.workspace.id,reference:proof.reference})).state).toBe('converted_preserved');
 vi.setSystemTime(new Date(receipt.dueAt));
 await f.t.finishAllScheduledFunctions(()=>vi.runAllTimers());
 await f.t.run(async ctx=>{const rows=await ctx.db.query('painterEntities').collect();expect(rows.map(row=>row.type).sort()).toEqual(['customer','lead']);expect(rows.every(row=>row.data.name==='PRIVATE-VISITOR')).toBe(true);const audit=await ctx.db.query('painterEvents').withIndex('by_tenant_entity',q=>q.eq('tenantId',f.workspace.id).eq('entityId',receipt.leadEntityId)).collect();expect(audit.some(row=>row.payload.retentionTransferred===true)).toBe(true);});
});

it('direct public ingress shares deployment-global capacity across company IDs',async()=>{
 const f=await fixture();await f.enable();const companies=[f.workspace];
 for(let n=0;n<6;n++){const workspace=await f.owner.mutation(api.painter.createWorkspace,{name:`Synthetic company ${n}`});companies.push(workspace);await f.owner.mutation(api.intakeConfig.configure,{workspaceId:workspace.id,expectedRevision:0,requestKey:'guidance',settings:guidanceSettings});await f.owner.mutation(api.contactIntakeConfig.configure,{workspaceId:workspace.id,expectedRevision:0,requestKey:'contact',settings:contactSettings});}
 const results=[];for(const workspace of companies)for(let n=0;n<5;n++)results.push(await f.t.mutation(api.publicLead.submit,{workspaceId:String(workspace.id),submission:submission(n+1)}));
 expect(results.filter(row=>row.state==='received')).toHaveLength(INTAKE_ADMISSION.globalAttemptsPerMinute);
 expect(results.filter(row=>row.reason==='global_limit')).toHaveLength(5);
 const budget=await f.t.run(ctx=>intakeRateLimiter.getValue(ctx,'intakeGlobalAttempts'));expect(budget.value).toBe(0);
});

it.each(['qualification_first','expiry_first'])('qualification and expiry preserve privacy in both transaction orders: %s',async order=>{
 const f=await fixture();await f.enable();await f.submit();const receipt=(await f.row())!;vi.setSystemTime(new Date(receipt.dueAt));
 const qualify=()=>f.owner.mutation(api.painter.command,{workspaceId:f.workspace.id,command:{action:'lead.qualify',entityId:receipt.leadEntityId,requestKey:'qualification-race',input:{}}});
 const expire=()=>f.t.mutation(api.intakePrivacy.expire,{receiptId:receipt._id});
 const results=await Promise.allSettled(order==='qualification_first'?[qualify(),expire()]:[expire(),qualify()]);
 if(order==='qualification_first'){expect(results.every(row=>row.status==='fulfilled')).toBe(true);expect((await f.row())!.state).toBe('converted_preserved');}
 else{expect(results[0]!.status).toBe('fulfilled');expect(results[1]!.status).toBe('rejected');await f.t.finishAllScheduledFunctions(()=>vi.runAllTimers());expect((await f.row())!.state).toBe('deleted');await f.t.run(async ctx=>{expect(await ctx.db.query('painterEntities').collect()).toHaveLength(0);});}
});

it('validated customer linkage is explicit retention transfer, and unrelated workspace deletion is unavailable',async()=>{
 const f=await fixture();await f.enable();const proof=await f.submit();const receipt=(await f.row())!;
 const customer=await f.owner.mutation(api.painter.command,{workspaceId:f.workspace.id,command:{action:'customer.create',requestKey:'existing-customer',input:{name:'Existing CRM customer'}}});
 await expect(f.owner.mutation(api.painter.command,{workspaceId:f.workspace.id,command:{action:'lead.update',entityId:receipt.leadEntityId,requestKey:'wrong-customer',input:{customerId:'unknown'}}})).rejects.toThrow('NOT_FOUND_OR_FORBIDDEN');
 expect((await f.row())!.state).toBe('received');
 await f.owner.mutation(api.painter.command,{workspaceId:f.workspace.id,command:{action:'lead.update',entityId:receipt.leadEntityId,requestKey:'link-customer',input:{customerId:customer.entity.id}}});
 expect((await f.row())!.state).toBe('converted_preserved');expect((await f.row())!.customerId).toBe(customer.entity.id);
 const other=await f.owner.mutation(api.painter.createWorkspace,{name:'Other company'});
 expect(await f.owner.mutation(api.intakePrivacy.deleteRequest,{workspaceId:other.id,reference:proof.reference})).toEqual({state:'unavailable',processed:0});
 expect((await f.row())!.state).toBe('converted_preserved');
});

it.each(['new','contacted','lost'])('bounded retention recovery includes every nonconverted intake status: %s',async status=>{
 const f=await fixture();await f.enable();await f.submit();const receipt=(await f.row())!;
 // Existing status fixture tests retention eligibility independently of future
 // status-edit UI. Only canonical production commands can create CRM effects.
 await f.t.run(async ctx=>{const lead=await ctx.db.query('painterEntities').withIndex('by_tenant_entity',q=>q.eq('tenantId',f.workspace.id).eq('entityId',receipt.leadEntityId)).unique();await ctx.db.patch(lead!._id,{data:{...lead!.data,status,source:'changed-by-company'}});});
 vi.setSystemTime(new Date(receipt.dueAt));expect(await f.t.mutation(api.intakePrivacy.purgeDue,{})).toEqual({processed:1,more:false});
 await f.t.finishAllScheduledFunctions(()=>vi.runAllTimers());expect((await f.row())!.state).toBe('deleted');
});
