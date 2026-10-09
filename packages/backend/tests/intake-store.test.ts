import {expect,it,vi} from 'vitest';
import {convexTest} from 'convex-test';
import {createHash} from 'node:crypto';
import schema from '../convex/schema';
import {api} from '../convex/runtime';
import {commandFingerprint} from '../../domain/src/engine';
import {intakeCommandReceiptKey} from '../convex/intakeCrypto';
vi.mock('../convex/auth',()=>({authComponent:{safeGetAuthUser:async(ctx: {auth:{getUserIdentity:()=>Promise<{subject:string;email?:string}|null>}})=>{const identity=await ctx.auth.getUserIdentity();return identity?{_id:identity.subject,name:'Owner',email:identity.email}:null;}}}));
const modules={'./_generated/test-root-marker.ts':()=>Promise.resolve({}),'./painter.ts':()=>import('../convex/painter'),'./runtime.ts':()=>import('../convex/runtime')};

it('canonical host load replays hashed-address tombstone without retaining raw key or creating a lead',async()=>{
  const t=convexTest(schema,modules);
  const owner=t.withIdentity({subject:'owner',email:'owner@example.test'});
  const workspace=await owner.mutation(api.painter.createWorkspace,{name:'Receipt test'});
  const actor={id:'owner',tenantId:String(workspace.id),role:'owner' as const,name:'Owner',email:'owner@example.test'};
  const command={action:'lead.update',entityId:'deleted-intake-lead',requestKey:'raw-contact@example.test',input:{name:'Private visitor'}};
  const fingerprint=`sha256:${createHash('sha256').update(commandFingerprint(actor,command)).digest('hex')}`;
  const storedKey=await intakeCommandReceiptKey(String(workspace.id),command.requestKey);
  await t.run(ctx=>ctx.db.insert('painterReceipts',{tenantId:workspace.id,requestKey:storedKey,fingerprint,result:{message:'INTAKE_CONTACT_DELETED'}}));
  expect(await owner.mutation(api.painter.command,{workspaceId:workspace.id,command})).toEqual({message:'INTAKE_CONTACT_DELETED',replayed:true});
  await expect(owner.mutation(api.painter.command,{workspaceId:workspace.id,command:{...command,input:{name:'Changed'}}})).rejects.toThrow('IDEMPOTENCY_KEY_CONFLICT');
  await t.run(async ctx=>{
    const receipts=await ctx.db.query('painterReceipts').collect();
    expect(receipts).toHaveLength(1);
    expect(JSON.stringify(receipts)).not.toContain(command.requestKey);
    expect(JSON.stringify(receipts)).not.toContain('Private visitor');
    expect(await ctx.db.query('painterEntities').collect()).toHaveLength(0);
  });
});
