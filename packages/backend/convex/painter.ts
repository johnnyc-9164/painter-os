/// <reference lib="es2022" />
// Original Contractor OS uses ES2022 library declarations; Convex runtime supports these built-ins.
import { mutationGeneric, queryGeneric, type MutationBuilder, type QueryBuilder, type GenericMutationCtx, type GenericQueryCtx } from 'convex/server';
import { v, ConvexError } from 'convex/values';
import { authComponent } from './auth';
import type { DataModel, Id } from './runtime';
import { components } from './runtime';
import { applyCommand, canCommand, emptyState, visibleEntities, type State } from '../../domain/src/engine';
import { seedState } from '../../domain/src/seed';
import type { Actor, Command, Entity, Snapshot } from '../../domain/src/contracts';
import { ContractorBackend } from '../../contractor-os-core/src/backendClient';
import type { ComponentApi } from '../../contractor-os-core/src/component/_generated/component';
import { businessCommand, businessResult, commandOptions } from '../../contractor-os-core/src/component/businessValidators';
const mutation=mutationGeneric as MutationBuilder<DataModel,'public'>;
const query=queryGeneric as QueryBuilder<DataModel,'public'>;
type Ctx=GenericQueryCtx<DataModel>;
async function resolve(ctx:Ctx,workspaceId?:Id<'painterWorkspaces'>) {
 const user=await authComponent.safeGetAuthUser(ctx);if(!user)throw new Error('UNAUTHENTICATED');
 const memberships=await ctx.db.query('painterMembers').withIndex('by_user',q=>q.eq('userId',String(user._id))).collect();
 const member=memberships.find(m=>m.enabled&&(!workspaceId||m.tenantId===workspaceId));if(!member)throw new Error('WORKSPACE_MEMBERSHIP_REQUIRED');
 const workspace=await ctx.db.get(member.tenantId);if(!workspace)throw new Error('WORKSPACE_NOT_FOUND');
 // Verified authentication user email, never browser or mutable member metadata, binds customer access.
 const actor:Actor={id:String(user._id),tenantId:String(workspace._id),name:user.name,email:user.email,role:member.role};
 return {actor,workspace,member,user};
}
// Shared host authority seam; consumers reuse the exact existing membership resolution.
export { resolve as resolvePainterMembership };
async function load(ctx:Ctx,tenantId:Id<'painterWorkspaces'>,requestKey?:string):Promise<State> {
 const [rows,events,receipts]=await Promise.all([
 ctx.db.query('painterEntities').withIndex('by_tenant',q=>q.eq('tenantId',tenantId)).collect(),
 ctx.db.query('painterEvents').withIndex('by_tenant',q=>q.eq('tenantId',tenantId)).collect(),
 requestKey?ctx.db.query('painterReceipts').withIndex('by_tenant_request',q=>q.eq('tenantId',tenantId).eq('requestKey',requestKey)).collect():Promise.resolve([]),
 ]);
 return {entities:rows.map(({_id,_creationTime,entityId,...e})=>({...e,id:entityId,type:e.type as Entity['type']})),events:events.map(({_id,_creationTime,tenantId,eventId,...e})=>({...e,id:eventId})),receipts:Object.fromEntries(receipts.map(r=>[JSON.stringify([tenantId,r.requestKey]),{fingerprint:r.fingerprint,result:r.result}]))};
}
async function persist(ctx:GenericMutationCtx<DataModel>,tenantId:Id<'painterWorkspaces'>,before:State,after:State,requestKey?:string) {
 for(const e of after.entities){const old=before.entities.find(x=>x.id===e.id);if(old?.revision===e.revision)continue;const {id,...fields}=e;const row=await ctx.db.query('painterEntities').withIndex('by_tenant_entity',q=>q.eq('tenantId',tenantId).eq('entityId',id)).unique();const value={...fields,tenantId,entityId:id};if(row)await ctx.db.replace(row._id,value);else await ctx.db.insert('painterEntities',value);}
 const ids=new Set(before.events.map(e=>e.id));for(const event of after.events)if(!ids.has(event.id)){const {id,...fields}=event;await ctx.db.insert('painterEvents',{...fields,tenantId,eventId:id});}
 for(const [key,receipt] of Object.entries(after.receipts)){if(before.receipts[key])continue;const decoded=JSON.parse(key) as [string,string];await ctx.db.insert('painterReceipts',{tenantId,requestKey:requestKey??decoded[1],...receipt});}
}
export const workspaces=query({args:{},handler:async ctx=>{const user=await authComponent.safeGetAuthUser(ctx);if(!user)return [];const members=await ctx.db.query('painterMembers').withIndex('by_user',q=>q.eq('userId',String(user._id))).collect();return Promise.all(members.filter(m=>m.enabled).map(async m=>({workspace:await ctx.db.get(m.tenantId),role:m.role})));}});
export const createWorkspace=mutation({args:{name:v.string(),demo:v.optional(v.boolean()),onlyIfNone:v.optional(v.boolean())},handler:async(ctx,args)=>{
 const user=await authComponent.safeGetAuthUser(ctx);if(!user)throw new Error('UNAUTHENTICATED');if(args.onlyIfNone){const memberships=await ctx.db.query('painterMembers').withIndex('by_user',q=>q.eq('userId',String(user._id))).collect();const active=memberships.find(m=>m.enabled);if(active){const existing=await ctx.db.get(active.tenantId);if(existing)return {id:existing._id,name:existing.name};}}if(args.demo && process.env.PAINTER_ALLOW_DEMO!=='true')throw new Error('DEMO_DISABLED');const name=args.name.trim();if(!name||name.length>120)throw new Error('INVALID_NAME');const now=new Date().toISOString();
 // Atomic initial owner. No default password, anonymous demo credential, or role argument.
 const tenantId=await ctx.db.insert('painterWorkspaces',{name,ownerId:String(user._id),createdAt:now,demo:args.demo??false});await ctx.db.insert('painterMembers',{tenantId,userId:String(user._id),name:user.name,email:user.email,role:'owner',enabled:true});
 if(args.demo)await persist(ctx,tenantId,emptyState(),seedState(String(tenantId),String(user._id)));
 await ctx.db.insert('painterEvents',{tenantId,eventId:`${tenantId}:created`,type:'workspace.create',entityId:String(tenantId),actorId:String(user._id),occurredAt:now,payload:{schemaVersion:1,tenantId,name,demo:args.demo??false}});return {id:tenantId,name};
}});
export const snapshot=query({args:{workspaceId:v.optional(v.id('painterWorkspaces'))},handler:async(ctx,args):Promise<Snapshot>=>{const {actor,workspace}=await resolve(ctx,args.workspaceId);const state=await load(ctx,workspace._id);const entities=visibleEntities(state,actor).map(e=>actor.role==='customer'?customerSafe(e):e);const ids=new Set(entities.map(e=>e.id));return {actor,workspace:{id:String(workspace._id),name:workspace.name},entities,events:actor.role==='customer'?[]:state.events.filter(e=>ids.has(e.entityId)).map(e=>['owner','office_admin','accountant','project_manager'].includes(actor.role)?e:{...e,payload:{schemaVersion:e.payload.schemaVersion,tenantId:actor.tenantId,action:e.payload.action,revision:e.payload.revision}}),runtime:{storage:'Convex transactional database',integrations:'Metadata only; no live external writes configured',demo:workspace.demo}};}});
const commandValidator=v.object({action:v.string(),entityId:v.optional(v.string()),expectedRevision:v.optional(v.number()),requestKey:v.string(),input:v.any()});
export const command=mutation({args:{workspaceId:v.optional(v.id('painterWorkspaces')),command:commandValidator},handler:async(ctx,args)=>{
 const {actor,workspace}=await resolve(ctx,args.workspaceId);const c=args.command as Command;
 if(c.action==='member.invite')throw new Error('USE_CREATE_INVITE');
 if(c.action.startsWith('member.')||c.action==='workspace.update')return hostCommand(ctx,actor,workspace._id,c);
 const state=await load(ctx,workspace._id,c.requestKey);const before=JSON.parse(JSON.stringify(state)) as State;let index=0;const requestHash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify([actor.tenantId,c.requestKey])))),b=>b.toString(16).padStart(2,'0')).join('');
 // No randomness unsupported by Convex. Request key + transactional duplicate check guarantees stable IDs.
 const result=applyCommand(state,actor,c,{now:new Date().toISOString(),id:()=>`${actor.tenantId}:${requestHash}:${++index}`});if(!result.replayed)await persist(ctx,workspace._id,before,state,c.requestKey);return actor.role==='customer'?{...result,...(result.entity?{entity:customerSafe(result.entity)}:{}),entities:result.entities?.map(customerSafe)}:result;
}});
const roles=['owner','office_admin','estimator','project_manager','salesperson','crew_lead','crew_member','accountant','customer'] as const;
function stable(v:unknown):string {if(Array.isArray(v))return '['+v.map(stable).join(',')+']';if(v&&typeof v==='object')return '{'+Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable((v as any)[k])).join(',')+'}';return JSON.stringify(v);}
async function hostCommand(ctx:GenericMutationCtx<DataModel>,actor:Actor,tenantId:Id<'painterWorkspaces'>,c:Command) {
 if(!['member.role','workspace.update'].includes(c.action))throw new Error('UNKNOWN_HOST_ACTION');if(actor.role!=='owner')throw new Error('OWNER_REQUIRED');if(!c.requestKey||c.requestKey.length>200)throw new Error('INVALID_REQUEST_KEY');if(c.expectedRevision!==undefined)throw new Error('HOST_REVISION_NOT_SUPPORTED');
 const fingerprint=stable({actor,command:c});const receipt=await ctx.db.query('painterReceipts').withIndex('by_tenant_request',q=>q.eq('tenantId',tenantId).eq('requestKey',c.requestKey)).unique();if(receipt){if(receipt.fingerprint!==fingerprint)throw new Error('IDEMPOTENCY_KEY_CONFLICT');return {...receipt.result,replayed:true};}
 const input=c.input;if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('INVALID_INPUT');const allowed=c.action==='workspace.update'?['name']:c.action==='member.role'?['userId','role']:['userId','name','email','role'];for(const key of Object.keys(input))if(!allowed.includes(key))throw new Error(`UNKNOWN_FIELD:${key}`);
 let message:string;
 if(c.action==='workspace.update'){if(typeof input.name!=='string'||!input.name.trim()||input.name.length>120)throw new Error('INVALID_NAME');await ctx.db.patch(tenantId,{name:input.name.trim()});message='Workspace updated';}
 else {if(!roles.includes(input.role as any)||typeof input.userId!=='string'||!input.userId.trim())throw new Error('INVALID_MEMBER');const member=await ctx.db.query('painterMembers').withIndex('by_tenant_user',q=>q.eq('tenantId',tenantId).eq('userId',input.userId as string)).unique();if(!member)throw new Error('MEMBER_NOT_FOUND');if(member.role==='owner'&&input.role!=='owner'){const owners=await ctx.db.query('painterMembers').withIndex('by_tenant',q=>q.eq('tenantId',tenantId)).collect();if(owners.filter(m=>m.enabled&&m.role==='owner').length<=1)throw new Error('LAST_OWNER_REQUIRED');}await ctx.db.patch(member._id,{role:input.role as typeof roles[number]});message='Member role updated';}
 const result={message};await ctx.db.insert('painterReceipts',{tenantId,requestKey:c.requestKey,fingerprint,result});await ctx.db.insert('painterEvents',{tenantId,eventId:JSON.stringify([tenantId,c.requestKey,'host']),type:c.action,entityId:c.entityId??String(tenantId),actorId:actor.id,occurredAt:new Date().toISOString(),payload:{schemaVersion:1,tenantId,input}});return result;
}
/** Explicit seam: original Contractor OS component has its OWN store and policy. It is not a projection of painterEntities and writes here do not mirror into Painter OS. */
function originalGateway(workspaceId?:Id<'painterWorkspaces'>):ContractorBackend<DataModel> {
 return new ContractorBackend<DataModel>(components.contractorOs as ComponentApi,async ctx=>{const {actor}=await resolve(ctx,workspaceId);return {tenantId:actor.tenantId,permissions:actor.role==='owner'?['read','write','import','attest']:actor.role==='office_admin'?['read','write']:['read']};});
}
export const originalExecute=mutation({args:{workspaceId:v.optional(v.id('painterWorkspaces')),...commandOptions,command:businessCommand},returns:businessResult,handler:async(ctx,{workspaceId,...args})=>{const {actor}=await resolve(ctx,workspaceId);if(!['owner','office_admin'].includes(actor.role))throw new Error('FORBIDDEN');return originalGateway(workspaceId).execute(ctx,args);}});
export const originalComponentInfo=query({args:{workspaceId:v.optional(v.id('painterWorkspaces'))},handler:async(ctx,args)=>{const {actor}=await resolve(ctx,args.workspaceId);if(actor.role==='customer')throw new Error('FORBIDDEN');return originalGateway(args.workspaceId).componentInfo(ctx);}});
/** Published articles alone are public, workspace-scoped. No customer/business snapshot is exposed. */
export const articles=query({args:{workspaceId:v.string(),slug:v.optional(v.string())},handler:async(ctx,args)=>{const workspaceId=ctx.db.normalizeId('painterWorkspaces',args.workspaceId);if(workspaceId===null||await ctx.db.get(workspaceId)===null)throw new ConvexError('PUBLIC_WORKSPACE_NOT_FOUND');const rows=await ctx.db.query('painterEntities').withIndex('by_tenant_type',q=>q.eq('tenantId',workspaceId).eq('type','article')).collect();return rows.filter(e=>e.data.status==='published'&&e.data.public===true&&(!args.slug||e.data.slug===args.slug)).map(e=>({id:e.entityId,title:e.data.title,slug:e.data.slug,content:e.data.content,publishedAt:e.data.publishedAt}));}});
/** Private, actor-bound upload reservation. File metadata is verified from Convex storage, never trusted from a browser. */
export const beginFileUpload=mutation({args:{workspaceId:v.optional(v.id('painterWorkspaces')),jobId:v.string(),name:v.string()},handler:async(ctx,args)=>{
 const {actor,workspace}=await resolve(ctx,args.workspaceId);if(!canCommand(actor,'field.photo'))throw new Error('FORBIDDEN');if(!args.name.trim()||args.name.length>200)throw new Error('INVALID_FILE_NAME');
 const job=await ctx.db.query('painterEntities').withIndex('by_tenant_entity',q=>q.eq('tenantId',workspace._id).eq('entityId',args.jobId)).unique();if(!job||job.type!=='job'||!['scheduled','active'].includes(job.data.status))throw new Error('JOB_NOT_AVAILABLE');const now=new Date().toISOString();
 const rowId=await ctx.db.insert('painterEntities',{tenantId:workspace._id,entityId:'pending',type:'file',revision:1,createdAt:now,updatedAt:now,data:{title:args.name.trim(),name:args.name.trim(),status:'awaiting_upload',jobId:job.entityId,uploadedBy:actor.id,verified:false}});await ctx.db.patch(rowId,{entityId:String(rowId)});
 await ctx.db.insert('painterEvents',{tenantId:workspace._id,eventId:`${rowId}:reserved`,entityId:String(rowId),actorId:actor.id,type:'file.reserved',occurredAt:now,payload:{schemaVersion:1,tenantId:actor.tenantId,jobId:job.entityId}});return {fileId:String(rowId),uploadUrl:await ctx.storage.generateUploadUrl()};
}});
export const completeFileUpload=mutation({args:{workspaceId:v.optional(v.id('painterWorkspaces')),fileId:v.string(),storageId:v.id('_storage')},handler:async(ctx,args)=>{
 const {actor,workspace}=await resolve(ctx,args.workspaceId);if(!canCommand(actor,'field.photo'))throw new Error('FORBIDDEN');const file=await ctx.db.query('painterEntities').withIndex('by_tenant_entity',q=>q.eq('tenantId',workspace._id).eq('entityId',args.fileId)).unique();if(!file||file.type!=='file'||file.data.uploadedBy!==actor.id)throw new Error('FILE_NOT_FOUND_OR_FORBIDDEN');
 if(file.data.verified===true){if(file.data.storageId!==args.storageId)throw new Error('FILE_IMMUTABLE');return {fileId:file.entityId,verified:true};}
 const stored=await ctx.db.system.get(args.storageId);if(!stored||stored.size>20*1024*1024||!['image/jpeg','image/png','image/webp','image/heic'].includes(stored.contentType??''))throw new Error('IMAGE_FILE_REQUIRED_MAX_20_MB');
 // Storage IDs become tenant-owned on registration; refuse adopting an already registered file across jobs/tenants.
 const registrations=await ctx.db.query('painterEntities').filter(q=>q.and(q.eq(q.field('type'),'file'),q.eq(q.field('data.storageId'),args.storageId))).collect();if(registrations.some(r=>r.entityId!==file.entityId))throw new Error('STORAGE_ALREADY_REGISTERED');const now=new Date().toISOString();
 await ctx.db.patch(file._id,{revision:file.revision+1,updatedAt:now,data:{...file.data,status:'ready',verified:true,storageId:args.storageId,contentType:stored.contentType,size:stored.size}});await ctx.db.insert('painterEvents',{tenantId:workspace._id,eventId:`${file._id}:verified`,entityId:file.entityId,actorId:actor.id,type:'file.verified',occurredAt:now,payload:{schemaVersion:1,tenantId:actor.tenantId,jobId:file.data.jobId,storageId:args.storageId}});return {fileId:file.entityId,verified:true};
}});
export const fileUrl=query({args:{workspaceId:v.optional(v.id('painterWorkspaces')),fileId:v.string()},handler:async(ctx,args)=>{const {actor,workspace}=await resolve(ctx,args.workspaceId);if(actor.role==='customer'||!canCommand(actor,'field.photo'))throw new Error('FORBIDDEN');const file=await ctx.db.query('painterEntities').withIndex('by_tenant_entity',q=>q.eq('tenantId',workspace._id).eq('entityId',args.fileId)).unique();if(!file||file.type!=='file'||file.data.verified!==true)throw new Error('FILE_NOT_FOUND_OR_FORBIDDEN');return ctx.storage.getUrl(file.data.storageId);}});

function checkHash(hash:string){if(!/^[a-f0-9]{64}$/.test(hash))throw new Error('INVALID_TOKEN_HASH');}
async function hashToken(token:string){if(!/^[a-f0-9]{64}$/.test(token))throw new Error('INVALID_TOKEN');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token))),b=>b.toString(16).padStart(2,'0')).join('');}
function publicEstimate(e:Entity){return {id:e.id,revision:e.revision,title:e.data.title,status:e.data.status,lineItems:e.data.lineItems,paintingScope:e.data.paintingScope,subtotalCents:e.data.subtotalCents,taxCents:e.data.taxCents,totalCents:e.data.totalCents,depositCents:e.data.depositCents};}
export const createInvite=mutation({args:{workspaceId:v.optional(v.id('painterWorkspaces')),email:v.string(),role:v.union(...roles.map(r=>v.literal(r))),tokenHash:v.string()},handler:async(ctx,args)=>{
 const {actor,workspace}=await resolve(ctx,args.workspaceId);if(actor.role!=='owner')throw new Error('OWNER_REQUIRED');checkHash(args.tokenHash);const email=args.email.trim().toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw new Error('INVALID_EMAIL');if(args.role==='owner')throw new Error('OWNER_INVITE_FORBIDDEN');
 const existing=await ctx.db.query('painterInvites').withIndex('by_token',q=>q.eq('tokenHash',args.tokenHash)).unique();if(existing){if(existing.tenantId!==workspace._id||existing.email!==email||existing.role!==args.role)throw new Error('LINK_TOKEN_CONFLICT');return {message:'Existing invitation replayed; expiry unchanged'};}await ctx.db.insert('painterInvites',{tenantId:workspace._id,email,role:args.role,tokenHash:args.tokenHash,expiresAt:Date.now()+7*86400000});return {message:'Invitation link created; email delivery is not configured'};
}});
export const acceptInvite=mutation({args:{token:v.string()},handler:async(ctx,args)=>{
 const user=await authComponent.safeGetAuthUser(ctx);if(!user)throw new Error('UNAUTHENTICATED');const tokenHash=await hashToken(args.token);const invite=await ctx.db.query('painterInvites').withIndex('by_token',q=>q.eq('tokenHash',tokenHash)).unique();
 if(!invite||invite.expiresAt<=Date.now()||invite.email!==user.email.toLowerCase()||!user.emailVerified)throw new Error('INVITE_INVALID_OR_EMAIL_NOT_VERIFIED');if(invite.acceptedBy){if(invite.acceptedBy!==String(user._id))throw new Error('INVITE_USED');return {workspaceId:invite.tenantId};}
 const member=await ctx.db.query('painterMembers').withIndex('by_tenant_user',q=>q.eq('tenantId',invite.tenantId).eq('userId',String(user._id))).unique();if(member)throw new Error('MEMBER_EXISTS');await ctx.db.insert('painterMembers',{tenantId:invite.tenantId,userId:String(user._id),name:user.name,email:user.email,role:invite.role,enabled:true});await ctx.db.patch(invite._id,{acceptedBy:String(user._id)});return {workspaceId:invite.tenantId};
}});
export const createPortal=mutation({
 args:{workspaceId:v.optional(v.id('painterWorkspaces')),estimateId:v.string(),tokenHash:v.string(),expectedRevision:v.optional(v.number())},
 returns:v.object({expiresAt:v.number(),replayed:v.optional(v.boolean())}),
 handler:async(ctx,args)=>{
  const {actor,workspace}=await resolve(ctx,args.workspaceId);
  if(actor.role==='customer'||!canCommand(actor,'estimate.send'))throw new Error('FORBIDDEN');
  checkHash(args.tokenHash);
  // Portal issuance needs two entities, never the workspace snapshot or audit history.
  const estimate=await ctx.db.query('painterEntities').withIndex('by_tenant_entity',q=>q.eq('tenantId',workspace._id).eq('entityId',args.estimateId)).unique();
  if(!estimate||estimate.type!=='estimate'||!['sent','viewed'].includes(String(estimate.data.status)))throw new Error('ESTIMATE_NOT_SENT');
  const customerId=estimate.data.customerId;
  if(typeof customerId!=='string')throw new Error('CUSTOMER_EMAIL_REQUIRED');
  const customer=await ctx.db.query('painterEntities').withIndex('by_tenant_entity',q=>q.eq('tenantId',workspace._id).eq('entityId',customerId)).unique();
  if(!customer||customer.type!=='customer'||!customer.data.email)throw new Error('CUSTOMER_EMAIL_REQUIRED');
  if(args.expectedRevision!==undefined&&estimate.revision!==args.expectedRevision)throw new Error('REVISION_CONFLICT');
  const existing=await ctx.db.query('painterPortals').withIndex('by_token',q=>q.eq('tokenHash',args.tokenHash)).unique();
  if(existing){
   if(existing.tenantId!==workspace._id||existing.estimateId!==estimate.entityId||existing.scope.revision!==estimate.revision)throw new Error('LINK_TOKEN_CONFLICT');
   return {expiresAt:existing.expiresAt,replayed:true};
  }
  const expiresAt=Date.now()+7*86400000;
  const scope=publicEstimate({...estimate,id:estimate.entityId,type:'estimate'});
  await ctx.db.insert('painterPortals',{tenantId:workspace._id,estimateId:estimate.entityId,customerId:customer.entityId,customerEmail:String(customer.data.email).toLowerCase(),tokenHash:args.tokenHash,expiresAt,scope});
  return {expiresAt};
 }
});
async function portalContext(ctx:Ctx,token:string){const tokenHash=await hashToken(token);const portal=await ctx.db.query('painterPortals').withIndex('by_token',q=>q.eq('tokenHash',tokenHash)).unique();if(!portal||portal.expiresAt<=Date.now())throw new Error('PORTAL_INVALID_OR_EXPIRED');return portal;}
export const portalView=query({args:{token:v.string()},handler:async(ctx,args)=>{
 const portal=await portalContext(ctx,args.token);
 const estimate=await ctx.db.query('painterEntities').withIndex('by_tenant_entity',q=>q.eq('tenantId',portal.tenantId).eq('entityId',portal.estimateId)).filter(q=>q.and(q.eq(q.field('type'),'estimate'),q.eq(q.field('data.customerId'),portal.customerId))).first();
 if(!estimate||estimate.type!=='estimate'||estimate.data.customerId!==portal.customerId)throw new Error('PORTAL_INVALID');
 const jobs=await ctx.db.query('painterEntities').withIndex('by_tenant_type_estimate_customer',q=>q.eq('tenantId',portal.tenantId).eq('type','job').eq('data.estimateId',portal.estimateId).eq('data.customerId',portal.customerId)).collect();
 // Domain schedule/invoice writers persist resolved job IDs as strings.
 // This typed read seam excludes nonstring links; the owner confirms no existing company data.
 // Only related records are read; native transaction quotas remain the limit.
 // Merge per-job index results back into the original tenant creation order.
 const related=async(type:'schedule'|'invoice')=>{
  const groups=await Promise.all([...new Set(jobs.map(job=>job.entityId))].map(jobId=>ctx.db.query('painterEntities').withIndex('by_tenant_type_job_customer',q=>q.eq('tenantId',portal.tenantId).eq('type',type).eq('data.jobId',jobId).eq('data.customerId',portal.customerId)).collect()));
  return groups.flat().sort((a,b)=>a._creationTime-b._creationTime || (a._id<b._id?-1:a._id>b._id?1:0));
 };
 const [schedules,invoices]=await Promise.all([related('schedule'),related('invoice')]);
 return {estimate:{...portal.scope,status:estimate.data.status},expiresAt:portal.expiresAt,jobs:jobs.map(j=>({id:j.entityId,title:j.data.title,status:j.data.status})),schedules:schedules.map(e=>({id:e.entityId,startAt:e.data.startAt,endAt:e.data.endAt,status:e.data.status})),invoices:invoices.filter(e=>e.data.status!=='draft').map(e=>({id:e.entityId,title:e.data.title,status:e.data.status,totalCents:e.data.totalCents,balanceCents:e.data.balanceCents}))};
}});
export const portalCommand=mutation({args:{token:v.string(),action:v.union(v.literal('approve'),v.literal('reject'),v.literal('requestChanges')),requestKey:v.string(),notes:v.optional(v.string())},handler:async(ctx,args)=>{
 const portal=await portalContext(ctx,args.token);const state=await load(ctx,portal.tenantId,args.requestKey);const before=JSON.parse(JSON.stringify(state)) as State;const estimate=state.entities.find(e=>e.id===portal.estimateId&&e.type==='estimate'&&e.data.customerId===portal.customerId);const customer=state.entities.find(e=>e.id===portal.customerId&&e.type==='customer');if(!estimate||!customer||String(customer.data.email).toLowerCase()!==portal.customerEmail)throw new Error('PORTAL_CUSTOMER_CHANGED');if(estimate.revision!==portal.scope.revision&&!state.receipts[JSON.stringify([portal.tenantId,args.requestKey])])throw new Error('PORTAL_SCOPE_CHANGED');
 const actor:Actor={id:`portal:${portal._id}`,tenantId:String(portal.tenantId),name:String(customer.data.name??'Customer'),email:portal.customerEmail,role:'customer'};
 const result=applyCommand(state,actor,{action:`estimate.${args.action}`,entityId:portal.estimateId,requestKey:args.requestKey,input:args.action==='requestChanges'?{notes:args.notes??''}:{}},{now:new Date().toISOString()});if(!result.replayed)await persist(ctx,portal.tenantId,before,state,args.requestKey);return {status:result.entity?.data.status,replayed:result.replayed??false};
}});

function customerSafe(e:Entity):Entity {const fields=e.type==='estimate'?publicEstimate(e):e.type==='customer'?{name:e.data.name,email:e.data.email,address:e.data.address}:e.type==='invoice'?{title:e.data.title,status:e.data.status,totalCents:e.data.totalCents,balanceCents:e.data.balanceCents}:{title:e.data.title,status:e.data.status};return {...e,data:fields};}
/** Administrative roster. UI uses authenticated user IDs for cloud role assignments. */
export const members=query({args:{},handler:async ctx=>{const {actor,workspace}=await resolve(ctx);if(!['owner','office_admin'].includes(actor.role))throw new Error('FORBIDDEN');const rows=await ctx.db.query('painterMembers').withIndex('by_tenant',q=>q.eq('tenantId',workspace._id)).collect();return rows.filter(m=>m.enabled).map(m=>({id:m.userId,name:m.name,email:m.email,role:m.role}));}});
