import {afterEach,describe,expect,it,vi} from 'vitest';
import {convexTest} from 'convex-test';
import agentmailTest from '@agentmail/convex/test';
import betterAuthTest from '@convex-dev/better-auth/test';
import schema from '../convex/schema';
import {createAuth} from '../convex/auth';

const site='https://auth.example.test',email='fixture-owner@example.test',password='synthetic-password-123';
const modules={'./_generated/test-root-marker.ts':()=>Promise.resolve({})};
async function fixture(){
 vi.stubEnv('SITE_URL',site);vi.stubEnv('BETTER_AUTH_SECRET','public-fixture-secret-at-least-32-characters');
 const t=convexTest(schema,modules);betterAuthTest.register(t,'betterAuth');t.registerComponent('agentmail',agentmailTest.schema,{...agentmailTest.modules,'./component/_generated/test-root-marker.ts':()=>Promise.resolve({})});
 const owner=await t.action(async ctx=>createAuth(ctx).api.signUpEmail({body:{name:'Fixture owner',email,password}}));
 return {t,owner};
}
afterEach(()=>{vi.unstubAllEnvs();vi.unstubAllGlobals();vi.restoreAllMocks();});
describe('actual createAuth disabled email integration with real Convex BetterAuth adapter',()=>{
 it('preserves signup/signin unverified policy and installed disabled callbacks without provider IO',async()=>{
  const fetch=vi.spyOn(globalThis,'fetch'),providerReads:string[]=[];const originalProcess=globalThis.process;vi.stubGlobal('process',new Proxy(originalProcess,{get(target,key){if(key!=='env')return Reflect.get(target,key);return new Proxy(target.env,{get(env,name){if(String(name).startsWith('AGENTMAIL_')){providerReads.push(String(name));throw new Error('UNEXPECTED_PROVIDER_ENV_READ');}return Reflect.get(env,name);}});}}));const {t,owner}=await fixture();
  expect(owner.user.emailVerified).toBe(false);expect(providerReads).toEqual([]);
  await t.action(async ctx=>{const auth=createAuth(ctx),context=await auth.$context;
   expect(context.options.emailAndPassword?.requireEmailVerification).toBe(false);
   expect(context.options.emailVerification?.sendOnSignUp).toBe(false);expect(context.options.emailVerification?.sendOnSignIn).toBe(false);
   expect(context.options.emailVerification?.sendVerificationEmail).toBeTypeOf('function');expect(context.options.emailAndPassword?.sendResetPassword).toBeTypeOf('function');
   expect((await auth.api.signInEmail({body:{email,password}})).user.emailVerified).toBe(false);
  });expect(fetch).not.toHaveBeenCalled();expect(await t.runInComponent('agentmail',ctx=>ctx.db.query('outboundMessages').take(1))).toEqual([]);
  expect(await t.run(ctx=>ctx.db.query('authEmailReceipts').take(1))).toEqual([]);expect(await t.run(ctx=>ctx.db.query('authEmailBudgets').take(1))).toEqual([]);
 });
 it('explicit verification reaches the actual held callback; neither SDK user nor email queue becomes verified/delivered',async()=>{
  const {t,owner}=await fixture();const fetch=vi.spyOn(globalThis,'fetch');
  await expect(t.action(async ctx=>createAuth(ctx).api.sendVerificationEmail({body:{email,callbackURL:site+'/verified'}}))).rejects.toMatchObject({code:'AGENTMAIL_OUTBOUND_DISABLED'});
  const user=await t.runInComponent('betterAuth',ctx=>ctx.db.get(owner.user.id as never));expect(user?.emailVerified).toBe(false);expect(fetch).not.toHaveBeenCalled();expect(await t.runInComponent('agentmail',ctx=>ctx.db.query('outboundMessages').take(1))).toEqual([]);
  expect(await t.run(ctx=>ctx.db.query('authEmailReceipts').take(1))).toEqual([]);expect(await t.run(ctx=>ctx.db.query('authEmailBudgets').take(1))).toEqual([]);
 });
 it('actual reset endpoint anti-enumeration success is not delivery; only SDK reset records are created, no password changes',async()=>{
  const {t,owner}=await fixture();const fetch=vi.spyOn(globalThis,'fetch');
  for(const recipient of [email,'missing@example.test']){
   const response=await t.action(async ctx=>{const response=await createAuth(ctx).handler(new Request(site+'/api/auth/request-password-reset',{method:'POST',headers:{'content-type':'application/json',origin:site},body:JSON.stringify({email:recipient,redirectTo:site+'/reset'})}));const text=await response.text();return {status:response.status,body:text?JSON.parse(text):null};});
   expect(response.status).toBe(200);expect(response.body).toMatchObject({status:true});
  }
  const records=await t.runInComponent('betterAuth',ctx=>ctx.db.query('verification').take(10));expect(records.filter(record=>record.identifier.startsWith('reset-password:'))).toHaveLength(1);
  expect(records.find(record=>record.identifier.startsWith('reset-password:'))?.value).toBe(owner.user.id);
  await t.action(async ctx=>{expect((await createAuth(ctx).api.signInEmail({body:{email,password}})).user.id).toBe(owner.user.id);});
  expect(fetch).not.toHaveBeenCalled();expect(await t.runInComponent('agentmail',ctx=>ctx.db.query('outboundMessages').take(1))).toEqual([]);expect(await t.run(ctx=>ctx.db.query('authEmailReceipts').take(1))).toEqual([]);
 });
});

describe('actual createAuth HTTP boundaries (SDK test-only origin bypass forced off)',()=>{
 it('explicit HTTP verification remains held while foreign callback and origin fail before token/queue effects',async()=>{
  const {t,owner}=await fixture();const fetch=vi.spyOn(globalThis,'fetch');
  const request=(origin:string,callbackURL:string,path='/send-verification-email')=>t.action(async ctx=>{
   const auth=createAuth(ctx),context=await auth.$context;
   // Pinned SDK skips checks under NODE_ENV=test; change only this test bypass, not production email options.
   context.skipOriginCheck=false;context.skipCSRFCheck=false;
   const response=await auth.handler(new Request(site+'/api/auth'+path,{method:'POST',headers:{'content-type':'application/json',origin,cookie:'better-auth.session_token=synthetic-no-session'},body:JSON.stringify(path==='/request-password-reset'?{email,redirectTo:callbackURL}:{email,callbackURL})}));
   const text=await response.text();return {status:response.status,body:text?JSON.parse(text):null};
  });
  for(const path of ['/send-verification-email','/request-password-reset'])for(const [origin,callback] of [[site,'https://foreign.example.test/steal'],['https://foreign.example.test',site+'/verified']])expect((await request(origin!,callback!,path)).status).toBe(403);
  const denied=await request(site,site+'/verified');expect(denied.status).toBe(500);
  expect(await t.runInComponent('betterAuth',ctx=>ctx.db.query('verification').take(1))).toEqual([]);
  expect((await t.runInComponent('betterAuth',ctx=>ctx.db.get(owner.user.id as never)))?.emailVerified).toBe(false);
  expect(await t.runInComponent('agentmail',ctx=>ctx.db.query('outboundMessages').take(1))).toEqual([]);expect(fetch).not.toHaveBeenCalled();
 });
});
