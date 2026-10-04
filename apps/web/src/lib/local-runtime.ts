import { DatabaseSync } from 'node:sqlite';
import { randomBytes,randomUUID,createHash,scryptSync,timingSafeEqual } from 'node:crypto';
import { mkdirSync,writeFileSync,readFileSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { applyCommand,emptyState,visibleEntities,canCommand,type State } from '@painter-os-bts/domain/engine';
import { seedState } from '@painter-os-bts/domain/seed';
import type { Actor,Command,CommandResult,Entity,Snapshot,Role } from '@painter-os-bts/domain/contracts';
const roles:Role[]=['owner','office_admin','estimator','project_manager','salesperson','crew_lead','crew_member','accountant','customer'];
const hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const clone=<T>(v:T):T=>JSON.parse(JSON.stringify(v));
const parse=(v:unknown)=>JSON.parse(String(v));
export const COOKIE='painter_session';
export function localEnabled(){return process.env.PAINTER_RUNTIME==='local';}
let database:DatabaseSync|undefined;
export function db(){
 if(!localEnabled())throw new Error('LOCAL_ACCEPTANCE_RUNTIME_DISABLED');
 if(database)return database;
 const dir=resolve(process.env.PAINTER_DATA_DIR||'.painter-data');mkdirSync(dir,{recursive:true,mode:0o700});database=new DatabaseSync(join(dir,'painter.sqlite'));
 database.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS workspaces(id TEXT PRIMARY KEY,name TEXT NOT NULL,state TEXT NOT NULL,demo INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS accounts(id TEXT PRIMARY KEY,email TEXT NOT NULL UNIQUE,name TEXT NOT NULL,password TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS members(id TEXT PRIMARY KEY,tenant TEXT NOT NULL,userId TEXT NOT NULL,role TEXT NOT NULL,UNIQUE(tenant,userId));
 CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,userId TEXT NOT NULL,tenant TEXT NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS portals(token TEXT PRIMARY KEY,tenant TEXT NOT NULL,estimateId TEXT NOT NULL,customerId TEXT NOT NULL,expires INTEGER NOT NULL,scope TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS invites(token TEXT PRIMARY KEY,tenant TEXT NOT NULL,email TEXT NOT NULL,name TEXT NOT NULL,role TEXT NOT NULL,expires INTEGER NOT NULL,used INTEGER NOT NULL DEFAULT 0);
 CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);`);
 return database;
}
function transaction<T>(fn:()=>T):T{const d=db();d.exec('BEGIN IMMEDIATE');try{const out=fn();d.exec('COMMIT');return out;}catch(e){d.exec('ROLLBACK');throw e;}}
function row(sql:string,...args:(string|number)[]){return db().prepare(sql).get(...args) as Record<string,unknown>|undefined;}
export function rateLimit(key:string,max=15,windowMs=900000){const d=db(),now=Date.now();const old=row('SELECT * FROM limits WHERE key=?',key);if(old&&Number(old.until)>now){if(Number(old.count)>=max)throw new Error('RATE_LIMITED');d.prepare('UPDATE limits SET count=count+1 WHERE key=?').run(key);}else d.prepare('INSERT OR REPLACE INTO limits VALUES (?,?,?)').run(key,1,now+windowMs);}
function passwordHash(password:string){const salt=randomBytes(16).toString('hex');return salt+':'+scryptSync(password,salt,64).toString('hex');}
function passwordOK(password:string,stored:string){const [salt,value]=stored.split(':');const expected=Buffer.from(value||'','hex'),actual=scryptSync(password,salt||'invalid',64);return expected.length===actual.length&&timingSafeEqual(expected,actual);}
function validEmail(v:unknown){if(typeof v!=='string'||v.length>254||!/^\S+@\S+\.\S+$/.test(v))throw new Error('INVALID_EMAIL');return v.toLowerCase().trim();}
function string(v:unknown,key:string,max=200){if(typeof v!=='string'||!v.trim()||v.length>max)throw new Error(`INVALID_${key.toUpperCase()}`);return v.trim();}
function session(userId:string,tenant:string){const token=randomBytes(32).toString('base64url');db().prepare('INSERT INTO sessions VALUES (?,?,?,?)').run(hash(token),userId,tenant,Date.now()+7*86400000);return token;}
export function actorFor(token:string|undefined):Actor{
 if(!token)throw new Error('UNAUTHENTICATED');const s=row('SELECT * FROM sessions WHERE token=? AND expires>?',hash(token),Date.now());if(!s)throw new Error('UNAUTHENTICATED');
 const a=row('SELECT * FROM accounts WHERE id=?',String(s.userId)),m=row('SELECT * FROM members WHERE tenant=? AND userId=?',String(s.tenant),String(s.userId));if(!a||!m)throw new Error('UNAUTHENTICATED');return {id:String(a.id),tenantId:String(s.tenant),name:String(a.name),email:String(a.email),role:m.role as Role};
}
export function localAuth(action:string,input:Record<string,unknown>,token?:string):{token?:string;actor?:Actor}{
 if(action==='logout'){if(token)db().prepare('DELETE FROM sessions WHERE token=?').run(hash(token));return {};}
 if(action==='demo'){
  if(process.env.PAINTER_ALLOW_DEMO!=='true')throw new Error('DEMO_DISABLED');rateLimit('demo',30,3600000);
  return transaction(()=>{const userId=randomUUID(),tenant=randomUUID();db().prepare('INSERT INTO accounts VALUES (?,?,?,?)').run(userId,`demo-${userId}@example.invalid`,'Demo operator',passwordHash(randomBytes(32).toString('hex')));db().prepare('INSERT INTO members VALUES (?,?,?,?)').run(randomUUID(),tenant,userId,'owner');db().prepare('INSERT INTO workspaces VALUES (?,?,?,?)').run(tenant,'Artisan Painting · Demo',JSON.stringify(seedState(tenant,userId)),1);const token=session(userId,tenant);return {token,actor:actorFor(token)};});
 }
 const email=validEmail(input.email);rateLimit('auth:'+hash(email));const password=string(input.password,'password',256);
 if(action==='signup'){
  if(password.length<8)throw new Error('PASSWORD_MINIMUM_8');const name=string(input.name,'name',120),workspaceName=string(input.workspaceName||input.workspace||`${name}'s Painting`,'workspace',120);
  return transaction(()=>{if(row('SELECT id FROM accounts WHERE email=?',email))throw new Error('ACCOUNT_EXISTS');const userId=randomUUID(),tenant=randomUUID();db().prepare('INSERT INTO accounts VALUES (?,?,?,?)').run(userId,email,name,passwordHash(password));db().prepare('INSERT INTO members VALUES (?,?,?,?)').run(randomUUID(),tenant,userId,'owner');db().prepare('INSERT INTO workspaces VALUES (?,?,?,?)').run(tenant,workspaceName,JSON.stringify(emptyState()),0);const token=session(userId,tenant);return {token,actor:actorFor(token)};});
 }
 if(action!=='signin')throw new Error('UNKNOWN_AUTH_ACTION');const a=row('SELECT * FROM accounts WHERE email=?',email);if(!a){passwordHash(password);throw new Error('INVALID_CREDENTIALS');}if(!passwordOK(password,String(a.password)))throw new Error('INVALID_CREDENTIALS');const m=row('SELECT * FROM members WHERE userId=? LIMIT 1',String(a.id));if(!m)throw new Error('WORKSPACE_REQUIRED');const nextToken=session(String(a.id),String(m.tenant));return {token:nextToken,actor:actorFor(nextToken)};
}
function workspace(tenant:string){const w=row('SELECT * FROM workspaces WHERE id=?',tenant);if(!w)throw new Error('WORKSPACE_NOT_FOUND');return w;}
export function loadLocal(tenant:string):State{return parse(workspace(tenant).state);}
function save(tenant:string,state:State){db().prepare('UPDATE workspaces SET state=? WHERE id=?').run(JSON.stringify(state),tenant);}
export function snapshotLocal(actor:Actor):Snapshot{
 const w=workspace(actor.tenantId),state=parse(w.state) as State,entities=visibleEntities(state,actor),ids=new Set(entities.map(e=>e.id));
 return {actor,...(['owner','office_admin'].includes(actor.role)?{members:membersLocal(actor) as {id:string;name:string;email:string;role:Role}[]}:{}),workspace:{id:actor.tenantId,name:String(w.name)},entities,events:actor.role==='customer'?[]:state.events.filter(e=>ids.has(e.entityId)).map(e=>['owner','office_admin','accountant','project_manager'].includes(actor.role)?e:{...e,payload:{schemaVersion:1,revision:e.payload.revision,action:e.payload.action}}),runtime:{kind:'local',storage:'Local acceptance runtime · SQLite (not deployed Convex)',integrations:'Not connected; manual records only',demo:Boolean(w.demo)}};
}
function hostEvent(state:State,actor:Actor,command:Command,payload:Record<string,unknown>={}){state.events.push({id:randomUUID(),type:command.action,entityId:command.entityId||actor.tenantId,actorId:actor.id,occurredAt:new Date().toISOString(),payload:{schemaVersion:1,...payload}});}
export function commandLocal(actor:Actor,command:Command):CommandResult & {inviteUrl?:string}{
 rateLimit('command:'+actor.id,500,60000);
 return transaction(()=>{
  const state=loadLocal(actor.tenantId),special=['estimate.portal','member.invite','member.role','workspace.update'].includes(command.action);
  if(!special){const result=applyCommand(state,actor,command,{id:randomUUID});save(actor.tenantId,state);return result;}
  if(!command.requestKey||command.requestKey.length>200)throw new Error('INVALID_REQUEST_KEY');
  const key=JSON.stringify([actor.tenantId,command.requestKey]),fingerprint=JSON.stringify({actorId:actor.id,role:actor.role,command}),prior=state.receipts[key];if(prior){if(prior.fingerprint!==fingerprint)throw new Error('IDEMPOTENCY_KEY_CONFLICT');return {...prior.result,replayed:true};}
  const input=command.input;const allowed=command.action==='estimate.portal'?[]:command.action==='workspace.update'?['name']:command.action==='member.role'?['memberId','role']:['name','email','role'];for(const field of Object.keys(input))if(!allowed.includes(field))throw new Error('UNKNOWN_FIELD:'+field);let result:CommandResult & {inviteUrl?:string};
  if(command.action==='estimate.portal'){
   if(!canCommand(actor,command.action)||actor.role==='customer')throw new Error('FORBIDDEN');const estimate=state.entities.find(e=>e.id===command.entityId&&e.type==='estimate'&&e.tenantId===actor.tenantId);if(!estimate)throw new Error('NOT_FOUND_OR_FORBIDDEN');if(command.expectedRevision!==undefined&&command.expectedRevision!==estimate.revision)throw new Error('REVISION_CONFLICT');if(!['sent','viewed'].includes(String(estimate.data.status)))throw new Error('ESTIMATE_NOT_SENT');const customer=state.entities.find(e=>e.type==='customer'&&e.id===estimate.data.customerId);if(!customer?.data.email)throw new Error('CUSTOMER_EMAIL_REQUIRED');const token=randomBytes(32).toString('base64url');db().prepare('INSERT INTO portals VALUES (?,?,?,?,?,?)').run(hash(token),actor.tenantId,estimate.id,String(estimate.data.customerId),Date.now()+7*86400000,JSON.stringify({revision:estimate.revision,email:customer.data.email,estimate:clone(estimate)}));result={portalUrl:'/p/'+token,message:'Private proposal link created; share it only with the customer. No message was sent.'};
  }else {
   if(actor.role!=='owner')throw new Error('OWNER_REQUIRED');
   if(command.action==='workspace.update'){const name=string(input.name,'name',120);db().prepare('UPDATE workspaces SET name=? WHERE id=?').run(name,actor.tenantId);result={message:'Workspace updated'};}
   else if(command.action==='member.invite'){
    const email=validEmail(input.email),name=string(input.name,'name',120),role=input.role as Role;if(!roles.includes(role)||role==='owner'||role==='customer')throw new Error('INVALID_INVITE_ROLE');const token=randomBytes(32).toString('base64url');db().prepare('INSERT INTO invites(token,tenant,email,name,role,expires) VALUES (?,?,?,?,?,?)').run(hash(token),actor.tenantId,email,name,role,Date.now()+7*86400000);result={inviteUrl:'/i/'+token,message:'Invitation created. Share the link manually. No email was sent.'};
   }else {const memberId=string(input.memberId,'memberId'),role=input.role as Role;if(!roles.includes(role))throw new Error('INVALID_ROLE');const member=row('SELECT * FROM members WHERE id=? AND tenant=?',memberId,actor.tenantId);if(!member)throw new Error('MEMBER_NOT_FOUND');if(member.role==='owner'&&role!=='owner'&&Number(row("SELECT COUNT(*) AS n FROM members WHERE tenant=? AND role='owner'",actor.tenantId)?.n)<=1)throw new Error('LAST_OWNER_REQUIRED');db().prepare('UPDATE members SET role=? WHERE id=? AND tenant=?').run(role,memberId,actor.tenantId);result={message:'Member role updated'};}
  }
  hostEvent(state,actor,command);state.receipts[key]={fingerprint,result};save(actor.tenantId,state);return result;
 });
}
export function membersLocal(actor:Actor){if(actor.role!=='owner'&&actor.role!=='office_admin')throw new Error('FORBIDDEN');return db().prepare('SELECT members.id,accounts.name,accounts.email,members.role FROM members JOIN accounts ON accounts.id=members.userId WHERE tenant=?').all(actor.tenantId);}
export function acceptInviteLocal(token:string,input:Record<string,unknown>,sessionToken?:string){return transaction(()=>{
 const invite=row('SELECT * FROM invites WHERE token=? AND expires>? AND used=0',hash(token),Date.now());if(!invite)throw new Error('INVITATION_INVALID_OR_EXPIRED');let userId:string;
 if(sessionToken){const actor=actorFor(sessionToken);if(actor.email!==invite.email)throw new Error('INVITATION_EMAIL_MISMATCH');userId=actor.id;}else {const email=validEmail(input.email);if(email!==invite.email)throw new Error('INVITATION_EMAIL_MISMATCH');const a=row('SELECT * FROM accounts WHERE email=?',email);const pass=string(input.password,'password',256);if(a){if(!passwordOK(pass,String(a.password)))throw new Error('INVALID_CREDENTIALS');userId=String(a.id);}else {if(pass.length<8)throw new Error('PASSWORD_MINIMUM_8');userId=randomUUID();db().prepare('INSERT INTO accounts VALUES (?,?,?,?)').run(userId,email,String(invite.name),passwordHash(pass));}}
 db().prepare('INSERT OR IGNORE INTO members VALUES (?,?,?,?)').run(randomUUID(),String(invite.tenant),userId,String(invite.role));db().prepare('UPDATE invites SET used=1 WHERE token=?').run(hash(token));const next=session(userId,String(invite.tenant));return {token:next,actor:actorFor(next)};
 });}
function portalRecord(token:string){const p=row('SELECT * FROM portals WHERE token=? AND expires>?',hash(token),Date.now());if(!p)throw new Error('PORTAL_INVALID_OR_EXPIRED');const state=loadLocal(String(p.tenant)),estimate=state.entities.find(e=>e.type==='estimate'&&e.id===p.estimateId&&e.data.customerId===p.customerId);if(!estimate)throw new Error('PORTAL_INVALID_OR_EXPIRED');return {p,state,estimate};}
export function portalLocal(token:string){const {p,state,estimate}=portalRecord(token),w=workspace(String(p.tenant)),customer=state.entities.find(e=>e.id===p.customerId&&e.type==='customer');const sanitize=(e:Entity)=>({id:e.id,type:e.type,revision:e.revision,data:Object.fromEntries(Object.entries(e.data).filter(([k])=>['title','name','status','lineItems','subtotalCents','taxCents','totalCents','depositCents','paidCents','balanceCents','paintingScope','kind','startAt','endAt','jobId','issuedAt','updatedAt'].includes(k)))});const jobs=state.entities.filter(e=>e.type==='job'&&e.data.estimateId===estimate.id&&e.data.customerId===p.customerId);return {workspace:{name:w.name},customer:{name:customer?.data.name},estimate:{...sanitize(parse(p.scope).estimate),data:{...sanitize(parse(p.scope).estimate).data,status:estimate.data.status}},jobs:jobs.map(sanitize),invoices:state.entities.filter(e=>e.type==='invoice'&&!['draft','void'].includes(String(e.data.status))&&jobs.some(j=>j.id===e.data.jobId)&&e.data.customerId===p.customerId).map(sanitize),demo:Boolean(w.demo)};}
export function portalCommandLocal(token:string,command:Command){return transaction(()=>{
 const {p,state,estimate}=portalRecord(token);if(!['estimate.approve','estimate.reject','estimate.requestChanges'].includes(command.action))throw new Error('PORTAL_ACTION_FORBIDDEN');if(command.entityId&&command.entityId!==estimate.id)throw new Error('PORTAL_SCOPE_DENIED');const customer=state.entities.find(e=>e.id===p.customerId)!;const scope=parse(p.scope);const receipt=state.receipts[JSON.stringify([p.tenant,command.requestKey])];if(customer.data.email!==scope.email)throw new Error('PORTAL_CUSTOMER_CHANGED');if(estimate.revision!==scope.revision&&!receipt)throw new Error('PORTAL_SCOPE_CHANGED');const actor:Actor={id:'portal:'+hash(token),tenantId:String(p.tenant),name:String(customer.data.name),email:String(customer.data.email),role:'customer'};
 const result=applyCommand(state,actor,{...command,entityId:estimate.id},{id:randomUUID});save(actor.tenantId,state);return {entity:{id:result.entity?.id,revision:result.entity?.revision,data:{status:result.entity?.data.status}},replayed:result.replayed};
 });}
export function publicArticlesLocal(tenant:string,slug?:string){const state=loadLocal(tenant);return {workspace:{name:workspace(tenant).name},articles:state.entities.filter(e=>e.type==='article'&&e.data.status==='published'&&e.data.public===true&&(!slug||e.data.slug===slug)).map(e=>({id:e.id,title:e.data.title,slug:e.data.slug,content:e.data.content,publishedAt:e.data.publishedAt}))};}
export function uploadLocal(actor:Actor,name:string,bytes:Buffer,jobId?:string){
 if(!['owner','office_admin','project_manager','crew_lead','crew_member'].includes(actor.role))throw new Error('FORBIDDEN');if(!bytes.length||bytes.length>20*1024*1024)throw new Error('FILE_SIZE_LIMIT_20_MB');
 let contentType='';if(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))contentType='image/png';else if(bytes[0]===255&&bytes[1]===216&&bytes[2]===255)contentType='image/jpeg';else if(bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP')contentType='image/webp';else if(bytes.subarray(0,5).toString()==='%PDF-')contentType='application/pdf';else throw new Error('ONLY_PNG_JPEG_WEBP_PDF_ALLOWED');
 return transaction(()=>{const state=loadLocal(actor.tenantId);if(jobId&&!state.entities.some(e=>e.id===jobId&&e.type==='job'&&e.tenantId===actor.tenantId))throw new Error('NOT_FOUND_OR_FORBIDDEN');const id=randomUUID(),dir=resolve(process.env.PAINTER_DATA_DIR||'.painter-data','files');mkdirSync(dir,{recursive:true,mode:0o700});writeFileSync(join(dir,id),bytes,{mode:0o600});const now=new Date().toISOString(),entity:Entity={id,type:'file',tenantId:actor.tenantId,revision:1,createdAt:now,updatedAt:now,data:{title:name.slice(0,200),name:name.slice(0,200),size:bytes.length,contentType,sha256:createHash('sha256').update(bytes).digest('hex'),jobId:jobId||null,verified:contentType.startsWith('image/'),status:'ready'}};state.entities.push(entity);hostEvent(state,actor,{action:'file.upload',requestKey:id,entityId:id,input:{}},{contentType,size:bytes.length});save(actor.tenantId,state);return entity;});
}
export function fileLocal(actor:Actor,id:string){if(!['owner','office_admin','project_manager','crew_lead','crew_member'].includes(actor.role))throw new Error('FORBIDDEN');const e=loadLocal(actor.tenantId).entities.find(e=>e.id===id&&e.type==='file'&&e.tenantId===actor.tenantId);if(!e)throw new Error('NOT_FOUND_OR_FORBIDDEN');if(!/^[0-9a-f-]{36}$/i.test(id))throw new Error('NOT_FOUND_OR_FORBIDDEN');return {bytes:readFileSync(resolve(process.env.PAINTER_DATA_DIR||'.painter-data','files',id)),entity:e};}
