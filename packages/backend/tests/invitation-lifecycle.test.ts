import { describe, it, expect, vi } from 'vitest';
import { convexTest } from 'convex-test';
import { createHash } from 'node:crypto';
import schema from '../convex/schema';
import { api } from '../convex/runtime';
// Only the identity provider is mocked; membership resolution, invites, indexes and transactions are the real host.
vi.mock('../convex/auth',()=>({authComponent:{safeGetAuthUser:async(ctx:any)=>{const i=await ctx.auth.getUserIdentity();return i?{_id:i.subject,name:i.name??'User',email:i.email,emailVerified:i.emailVerified}:null;}}}));
const modules={'./_generated/test-root-marker.ts':()=>Promise.resolve({}),'./painter.ts':()=>import('../convex/painter'),'./runtime.ts':()=>import('../convex/runtime')};
const hashOf=(token:string)=>createHash('sha256').update(token).digest('hex');
const token='a'.repeat(64);const tokenHash=hashOf(token);
const EMAIL='invitee@example.com';
async function setup(){
 const t=convexTest(schema,modules);
 const owner=t.withIdentity({subject:'owner',name:'Owner',email:'owner@example.com',emailVerified:true});
 const workspace=await owner.mutation(api.painter.createWorkspace,{name:'Tenant A'});
 return {t,owner,workspace};
}
const invitee=(t:any,subject='invitee',email=EMAIL,emailVerified=true)=>t.withIdentity({subject,name:'Invitee',email,emailVerified});
// Complete observable write surface touched by invitation flows.
const dump=(t:any)=>t.run(async(ctx:any)=>({invites:await ctx.db.query('painterInvites').collect(),members:await ctx.db.query('painterMembers').collect(),workspaces:await ctx.db.query('painterWorkspaces').collect(),events:await ctx.db.query('painterEvents').collect()}));
async function expectNoWrites(t:any,run:()=>Promise<unknown>,message:string){const before=await dump(t);await expect(run()).rejects.toThrow(message);expect(await dump(t)).toEqual(before);}

describe('invitation lifecycle rejections (real host, mocked identity only)',()=>{
 it('rejects an expired invite and leaves no writes',async()=>{
  const {t,owner}=await setup();await owner.mutation(api.painter.createInvite,{email:EMAIL,role:'estimator',tokenHash});
  await t.run(async ctx=>{const row=await ctx.db.query('painterInvites').first();await ctx.db.patch(row!._id,{expiresAt:Date.now()-1});});
  await expectNoWrites(t,()=>invitee(t).mutation(api.painter.acceptInvite,{token}),'INVITE_INVALID');
  await expect(invitee(t).query(api.painter.snapshot,{})).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
 });
 it('rejects an unknown token',async()=>{
  const {t,owner}=await setup();await owner.mutation(api.painter.createInvite,{email:EMAIL,role:'estimator',tokenHash});
  await expectNoWrites(t,()=>invitee(t).mutation(api.painter.acceptInvite,{token:'b'.repeat(64)}),'INVITE_INVALID');
 });
 it('rejects reuse by a different account after acceptance, and replays idempotently for the acceptor',async()=>{
  const {t,owner,workspace}=await setup();await owner.mutation(api.painter.createInvite,{email:EMAIL,role:'estimator',tokenHash});
  const first=await invitee(t).mutation(api.painter.acceptInvite,{token});expect(first.workspaceId).toBe(workspace.id);
  const afterAccept=await dump(t);
  // Same verified email, different auth subject: already accepted.
  await expectNoWrites(t,()=>invitee(t,'second-account').mutation(api.painter.acceptInvite,{token}),'INVITE_USED');
  expect((await invitee(t).mutation(api.painter.acceptInvite,{token})).workspaceId).toBe(workspace.id);
  expect(await dump(t)).toEqual(afterAccept);
  expect(afterAccept.members.filter((m:any)=>m.userId==='invitee')).toHaveLength(1);
 });
 it('rejects a mismatched or unverified email with no writes',async()=>{
  const {t,owner}=await setup();await owner.mutation(api.painter.createInvite,{email:EMAIL,role:'estimator',tokenHash});
  await expectNoWrites(t,()=>invitee(t,'wrong','wrong@example.com').mutation(api.painter.acceptInvite,{token}),'INVITE_INVALID');
  await expectNoWrites(t,()=>invitee(t,'invitee',EMAIL,false).mutation(api.painter.acceptInvite,{token}),'INVITE_INVALID');
  await expectNoWrites(t,()=>t.mutation(api.painter.acceptInvite,{token}),'UNAUTHENTICATED');
  // Case differences in the verified address are normalized, not a bypass or a false rejection.
  await invitee(t,'invitee','Invitee@Example.com').mutation(api.painter.acceptInvite,{token});
 });
 it('a disabled membership cannot accept a new invite, be re-enabled by it, or act',async()=>{
  const {t,owner,workspace}=await setup();
  await t.run(async ctx=>{await ctx.db.insert('painterMembers',{tenantId:workspace.id,userId:'invitee',name:'Invitee',email:EMAIL,role:'crew_member',enabled:false});});
  await owner.mutation(api.painter.createInvite,{email:EMAIL,role:'office_admin',tokenHash});
  await expectNoWrites(t,()=>invitee(t).mutation(api.painter.acceptInvite,{token}),'MEMBER_EXISTS');
  const d=await dump(t);expect(d.members.find((m:any)=>m.userId==='invitee')).toMatchObject({enabled:false,role:'crew_member'});
  await expect(invitee(t).query(api.painter.snapshot,{})).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
  await expect(invitee(t).mutation(api.painter.command,{command:{action:'customer.create',requestKey:'k',input:{name:'C',email:'c@example.com'}}})).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
  await expect(invitee(t).mutation(api.painter.createInvite,{email:'x@example.com',role:'crew_member',tokenHash:hashOf('x')})).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
 });
 it('a member disabled after accepting loses access and cannot regain it by replaying the token',async()=>{
  const {t,owner}=await setup();await owner.mutation(api.painter.createInvite,{email:EMAIL,role:'office_admin',tokenHash});
  const me=invitee(t);await me.mutation(api.painter.acceptInvite,{token});expect((await me.query(api.painter.snapshot,{})).actor.role).toBe('office_admin');
  await t.run(async ctx=>{const m=(await ctx.db.query('painterMembers').collect()).find((x:any)=>x.userId==='invitee')!;await ctx.db.patch(m._id,{enabled:false});});
  await me.mutation(api.painter.acceptInvite,{token});
  expect((await dump(t)).members.find((m:any)=>m.userId==='invitee')!.enabled).toBe(false);
  await expect(me.query(api.painter.snapshot,{})).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
 });
 it('role escalation is refused: no owner invites and only owners may invite',async()=>{
  const {t,owner}=await setup();
  await expectNoWrites(t,()=>owner.mutation(api.painter.createInvite,{email:EMAIL,role:'owner',tokenHash}),'OWNER_INVITE_FORBIDDEN');
  await owner.mutation(api.painter.createInvite,{email:EMAIL,role:'office_admin',tokenHash});
  const admin=invitee(t);await admin.mutation(api.painter.acceptInvite,{token});
  const other=hashOf('c'.repeat(64));
  await expectNoWrites(t,()=>admin.mutation(api.painter.createInvite,{email:'p@example.com',role:'crew_member',tokenHash:other}),'OWNER_REQUIRED');
  await expectNoWrites(t,()=>admin.mutation(api.painter.createInvite,{email:'p@example.com',role:'owner',tokenHash:other}),'OWNER_REQUIRED');
  expect((await admin.query(api.painter.snapshot,{})).actor.role).toBe('office_admin');
  await expectNoWrites(t,()=>admin.mutation(api.painter.command,{command:{action:'member.invite',requestKey:'esc',input:{userId:'invitee',role:'owner',email:EMAIL,name:'x'}}}),'USE_CREATE_INVITE');
 });
 it('a foreign-tenant invite token cannot join or be re-bound to another workspace',async()=>{
  const {t,owner,workspace}=await setup();
  const ownerB=t.withIdentity({subject:'ownerB',name:'Owner B',email:'b@example.com',emailVerified:true});
  const wsB=await ownerB.mutation(api.painter.createWorkspace,{name:'Tenant B'});
  await owner.mutation(api.painter.createInvite,{email:EMAIL,role:'estimator',tokenHash});
  // Tenant B owner cannot reuse or hijack tenant A's token hash.
  await expectNoWrites(t,()=>ownerB.mutation(api.painter.createInvite,{email:EMAIL,role:'estimator',tokenHash}),'LINK_TOKEN_CONFLICT');
  // Tenant B owner cannot create invites for tenant A.
  await expectNoWrites(t,()=>ownerB.mutation(api.painter.createInvite,{workspaceId:workspace.id,email:EMAIL,role:'estimator',tokenHash:hashOf('d'.repeat(64))}),'WORKSPACE_MEMBERSHIP_REQUIRED');
  await invitee(t).mutation(api.painter.acceptInvite,{token});
  const d=await dump(t);const rows=d.members.filter((m:any)=>m.userId==='invitee');
  expect(rows).toHaveLength(1);expect(rows[0].tenantId).toBe(workspace.id);expect(rows[0].tenantId).not.toBe(wsB.id);
  await expect(invitee(t).query(api.painter.snapshot,{workspaceId:wsB.id})).rejects.toThrow('WORKSPACE_MEMBERSHIP_REQUIRED');
 });
});
