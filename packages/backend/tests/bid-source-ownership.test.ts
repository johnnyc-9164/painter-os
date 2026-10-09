import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { convexTest } from 'convex-test';
import betterAuthTest from '@convex-dev/better-auth/test';
import firecrawl from '@firecrawl/firecrawl-convex/test';
import { FirecrawlClient, type OnCompleteMutation } from '@firecrawl/firecrawl-convex';
import type { ComponentApi } from '@firecrawl/firecrawl-convex/_generated/component';
import { actionGeneric, anyApi, componentsGeneric } from 'convex/server';
import { v } from 'convex/values';
import schema from '../convex/schema';
import { mutation, query, type Id } from '../convex/runtime';
import { prepareBidSource, bindBidSource, requireBidSourceIntent, requireOwnedBidSource, listOwnedBidSources, tombstoneBidSource } from '../convex/bidSourceOwnership';
const policy={allowedOrigins:['https://bids.example.test'],allowedQueryKeys:[]};
const sdk=new FirecrawlClient((componentsGeneric() as unknown as {firecrawl:ComponentApi}).firecrawl);
const ownedArgs={workspaceId:v.id('painterWorkspaces'),componentCrawlId:v.string()};
// Positive host controls exist solely in this test registry; production adapter is disabled/unmounted.
const harness={
 intent:query({args:{ownershipId:v.id('painterBidSourceOwnership')},returns:v.string(),handler:async(ctx,args)=>(await requireBidSourceIntent(ctx,args.ownershipId)).sourceUrl}),
 prepare:mutation({args:{workspaceId:v.id('painterWorkspaces'),operationKey:v.string(),sourceUrl:v.string()},returns:v.id('painterBidSourceOwnership'),handler:(ctx,args)=>prepareBidSource(ctx,args,policy)}),
 bind:mutation({args:{ownershipId:v.id('painterBidSourceOwnership'),componentCrawlId:v.string()},returns:v.null(),handler:bindBidSource}),
 authorize:query({args:ownedArgs,returns:v.null(),handler:async(ctx,args)=>{await requireOwnedBidSource(ctx,args);return null;}}),
 read:query({args:ownedArgs,returns:v.union(v.string(),v.null()),handler:async(ctx,args)=>{await requireOwnedBidSource(ctx,args);return (await sdk.getCrawl(ctx,args.componentCrawlId))?.status??null;}}),
 list:query({args:{workspaceId:v.id('painterWorkspaces')},returns:v.array(v.string()),handler:async(ctx,args)=>{
  const ids=await listOwnedBidSources(ctx,args.workspaceId);const statuses=[];for(const id of ids){await requireOwnedBidSource(ctx,{workspaceId:args.workspaceId,componentCrawlId:id});const crawl=await sdk.getCrawl(ctx,id);if(crawl)statuses.push(crawl.status);}return statuses;
 }}),
 pages:query({args:ownedArgs,returns:v.number(),handler:async(ctx,args)=>{await requireOwnedBidSource(ctx,args);return (await sdk.listPages(ctx,{crawlId:args.componentCrawlId,paginationOpts:{numItems:5,cursor:null}})).page.length;}}),
 page:query({args:ownedArgs,returns:v.union(v.boolean(),v.null()),handler:async(ctx,args)=>{await requireOwnedBidSource(ctx,args);const page=await sdk.getPage(ctx,{crawlId:args.componentCrawlId,url:'https://bids.example.test/'});return page?.truncated??null;}}),
 resume:mutation({args:ownedArgs,returns:v.boolean(),handler:async(ctx,args)=>{await requireOwnedBidSource(ctx,args);return sdk.resumeCrawl(ctx,args.componentCrawlId);}}),
 delete:mutation({args:ownedArgs,returns:v.null(),handler:async(ctx,args)=>{await requireOwnedBidSource(ctx,args);await sdk.deleteCrawl(ctx,args.componentCrawlId);await tombstoneBidSource(ctx,args);return null;}}),
 cancel:actionGeneric({args:ownedArgs,returns:v.null(),handler:async(ctx,args)=>{await ctx.runQuery(anyApi.harness.authorize,args);await sdk.cancelCrawl(ctx,args.componentCrawlId);return null;}}),
 start:actionGeneric({args:{ownershipId:v.id('painterBidSourceOwnership')},returns:v.string(),handler:async(ctx,args)=>{
  const url:string=await ctx.runQuery(anyApi.harness.intent,args);
  const started=await sdk.startCrawl(ctx,{url,mode:'webhook',options:{limit:5,allowExternalLinks:false,allowSubdomains:false},onComplete:anyApi.bidSources.complete as OnCompleteMutation,context:{operationKey:'non-authoritative'}});
  await ctx.runMutation(anyApi.harness.bind,{ownershipId:args.ownershipId,componentCrawlId:started.crawlId});return started.crawlId;
 }}),
};
const modules={'./_generated/test-root-marker.ts':()=>Promise.resolve({}),'./harness.ts':()=>Promise.resolve(harness),'./bidSources.ts':()=>import('../convex/bidSources')};
beforeEach(()=>{vi.useFakeTimers();vi.stubEnv('FIRECRAWL_API_KEY','synthetic-test-only-key');vi.stubEnv('FIRECRAWL_API_URL','https://synthetic-provider.example.test');vi.stubEnv('FIRECRAWL_WEBHOOK_SECRET','synthetic-test-only-secret');vi.stubEnv('CONVEX_SITE_URL','https://synthetic.convex.site');});
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();vi.unstubAllEnvs();});
async function fixture(){
 const requests=vi.fn(async(input:string|URL,init?:RequestInit)=>{
  const url=new URL(String(input));expect(url.origin).toBe('https://synthetic-provider.example.test');expect(new Headers(init?.headers).get('authorization')).toBe('Bearer synthetic-test-only-key');
  if(url.pathname==='/v2/crawl'&&init?.method==='POST')return new Response(JSON.stringify({success:true,id:'synthetic-job'}));
  if(url.pathname==='/v2/crawl/synthetic-job'&&init?.method==='DELETE')return new Response(JSON.stringify({success:true}));
  throw new Error('Unexpected provider request forbidden');
 });vi.stubGlobal('fetch',requests);
 const t=convexTest(schema,modules);firecrawl.register(t);
 t.registerComponent('betterAuth',betterAuthTest.schema,{...betterAuthTest.modules,'./component/adapter.ts':()=>import('../../../node_modules/@convex-dev/better-auth/src/component/adapter'),'./component/_generated/test-root-marker.ts':()=>Promise.resolve({})});
 const users=await t.runInComponent('betterAuth',async ctx=>{
  const result=[];for(let i=0;i<3;i++){const userId=await ctx.db.insert('user',{name:'Synthetic member',email:`member${i}@example.test`,emailVerified:true,createdAt:1,updatedAt:1});const sessionId=await ctx.db.insert('session',{userId,token:`synthetic-${i}`,expiresAt:Date.now()+600000,createdAt:1,updatedAt:1});result.push({userId,sessionId});}return result;
 });
 const [owner,foreign,customer]=users as [typeof users[number],typeof users[number],typeof users[number]];
 const [tenantId,foreignId]=await t.run(async ctx=>{
  const tenant=await ctx.db.insert('painterWorkspaces',{name:'Synthetic company',ownerId:owner.userId,createdAt:'test',demo:false});const other=await ctx.db.insert('painterWorkspaces',{name:'Other company',ownerId:foreign.userId,createdAt:'test',demo:false});
  for(const [identity,workspace,role] of [[owner,tenant,'owner'],[foreign,other,'owner'],[customer,tenant,'customer']] as const)await ctx.db.insert('painterMembers',{tenantId:workspace,userId:identity.userId,name:'Member',email:'untrusted-member@example.test',role,enabled:true});return [tenant,other];
 }) as [Id<'painterWorkspaces'>,Id<'painterWorkspaces'>];
 const authorized=t.withIdentity({subject:owner.userId,sessionId:owner.sessionId});
 const ownershipId:Id<'painterBidSourceOwnership'>=await authorized.mutation(anyApi.harness.prepare,{workspaceId:tenantId,operationKey:'operation',sourceUrl:'https://bids.example.test/'});
 const crawlId:string=await authorized.action(anyApi.harness.start,{ownershipId});
 return {t,authorized,owner,foreign,customer,tenantId,foreignId,ownershipId,crawlId,requests};
}
test('actual SDK ownership controls deny anonymous, foreign and customer scopes before SDK calls',async()=>{
 const f=await fixture();const args={workspaceId:f.tenantId,componentCrawlId:f.crawlId};
 expect(await f.authorized.query(anyApi.harness.read,args)).toBe('scraping');expect(await f.authorized.query(anyApi.harness.pages,args)).toBe(0);expect(await f.authorized.query(anyApi.harness.page,args)).toBeNull();expect(await f.authorized.query(anyApi.harness.list,{workspaceId:f.tenantId})).toEqual(['scraping']);
 const outsiders=[f.t,f.t.withIdentity({subject:f.foreign.userId,sessionId:f.foreign.sessionId}),f.t.withIdentity({subject:f.customer.userId,sessionId:f.customer.sessionId})];
 for(const caller of outsiders){for(const action of ['read','pages','page'] as const)await expect(caller.query(anyApi.harness[action],args)).rejects.toThrow();await expect(caller.query(anyApi.harness.list,{workspaceId:f.tenantId})).rejects.toThrow();for(const action of ['resume','delete'] as const)await expect(caller.mutation(anyApi.harness[action],args)).rejects.toThrow();await expect(caller.action(anyApi.harness.cancel,args)).rejects.toThrow();}
 const foreign=f.t.withIdentity({subject:f.foreign.userId,sessionId:f.foreign.sessionId});await expect(foreign.query(anyApi.harness.read,{...args,workspaceId:f.foreignId})).rejects.toThrow('BID_SOURCE_NOT_FOUND');
 expect(f.requests).toHaveBeenCalledTimes(1);expect(await f.authorized.mutation(anyApi.bidSources.availability,{workspaceId:f.tenantId})).toEqual({enabled:false,reason:'provider_not_authorized'});expect(f.requests).toHaveBeenCalledTimes(1);
 const production=await import('../convex/bidSources');expect(production.complete.isInternal).toBe(true);expect(Object.keys(production).sort()).toEqual(['availability','complete']);
});
test('actual cancellation invokes trusted completion once; forged callback context cannot grant access',async()=>{
 const f=await fixture();const args={workspaceId:f.tenantId,componentCrawlId:f.crawlId};await f.authorized.action(anyApi.harness.cancel,args);
 await f.t.finishAllScheduledFunctions(()=>vi.runAllTimers());
 const row=await f.t.run(ctx=>ctx.db.get(f.ownershipId));expect(row?.callbackDigest).toMatch(/^[a-f0-9]{64}$/);expect(await f.authorized.query(anyApi.harness.read,args)).toBe('cancelled');
 const callback={crawlId:f.crawlId,status:'cancelled',pageCount:0,context:{operationKey:'ignored'}};
 await f.t.mutation(anyApi.bidSources.complete,callback);expect(await f.t.run(ctx=>ctx.db.get(f.ownershipId))).toEqual(row);
 await expect(f.t.mutation(anyApi.bidSources.complete,{...callback,pageCount:1})).rejects.toThrow('BID_SOURCE_CALLBACK_CONFLICT');
 await expect(f.t.mutation(anyApi.bidSources.complete,{...callback,context:{tenantId:f.foreignId,userId:f.foreign.userId,role:'owner'}})).rejects.toThrow();
 await expect(f.t.mutation(anyApi.bidSources.complete,{...callback,crawlId:'unbound'})).rejects.toThrow('BID_SOURCE_NOT_FOUND');
});
test('current membership and actual identity revocation deny controls and callbacks; deletion preserves tombstone',async()=>{
 for(const mode of ['disabled','deleted-user','deleted-workspace','changed-role'] as const){const f=await fixture();const args={workspaceId:f.tenantId,componentCrawlId:f.crawlId};const member=await f.t.run(ctx=>ctx.db.query('painterMembers').withIndex('by_tenant_user',q=>q.eq('tenantId',f.tenantId).eq('userId',f.owner.userId)).unique());
  if(mode==='deleted-user')await f.t.runInComponent('betterAuth',ctx=>ctx.db.delete(f.owner.userId));else if(mode==='deleted-workspace')await f.t.run(ctx=>ctx.db.delete(f.tenantId));else await f.t.run(ctx=>ctx.db.patch(member!._id,mode==='disabled'?{enabled:false}:{role:'crew_member'}));
  for(const name of ['read','pages','page'] as const)await expect(f.authorized.query(anyApi.harness[name],args)).rejects.toThrow();await expect(f.authorized.query(anyApi.harness.list,{workspaceId:f.tenantId})).rejects.toThrow();for(const name of ['resume','delete'] as const)await expect(f.authorized.mutation(anyApi.harness[name],args)).rejects.toThrow();await expect(f.authorized.action(anyApi.harness.cancel,args)).rejects.toThrow();
  await expect(f.t.mutation(anyApi.harness.bind,{ownershipId:f.ownershipId,componentCrawlId:f.crawlId})).rejects.toThrow('BID_SOURCE_CREATOR_REVOKED');
  await expect(f.t.mutation(anyApi.bidSources.complete,{crawlId:f.crawlId,status:'completed',pageCount:0})).rejects.toThrow('BID_SOURCE_CREATOR_REVOKED');expect(f.requests).toHaveBeenCalledTimes(1);
 }
 const f=await fixture();const args={workspaceId:f.tenantId,componentCrawlId:f.crawlId};expect(await f.authorized.mutation(anyApi.harness.resume,args)).toBe(true);await f.authorized.mutation(anyApi.harness.delete,args);await f.t.finishAllScheduledFunctions(()=>vi.runAllTimers());
 expect(await f.t.run(ctx=>ctx.db.get(f.ownershipId))).toMatchObject({deleted:true});await expect(f.authorized.query(anyApi.harness.read,args)).rejects.toThrow('BID_SOURCE_NOT_FOUND');await expect(f.t.mutation(anyApi.bidSources.complete,{crawlId:f.crawlId,status:'completed',pageCount:0})).rejects.toThrow('BID_SOURCE_NOT_FOUND');
});
test('ownership replay is creator/source bound, component binding unique and bounded list fails before materializing',async()=>{
 const f=await fixture();const args={workspaceId:f.tenantId,operationKey:'operation',sourceUrl:'https://bids.example.test/'};expect(await f.authorized.mutation(anyApi.harness.prepare,args)).toBe(f.ownershipId);
 await expect(f.authorized.mutation(anyApi.harness.prepare,{...args,sourceUrl:'https://bids.example.test/other'})).rejects.toThrow('BID_SOURCE_OPERATION_CONFLICT');await expect(f.authorized.mutation(anyApi.harness.prepare,{...args,operationKey:'new',sourceUrl:'http://127.0.0.1/'})).rejects.toThrow('BID_SOURCE_URL_REJECTED');
 const second=await f.authorized.mutation(anyApi.harness.prepare,{...args,operationKey:'second'});await expect(f.t.mutation(anyApi.harness.bind,{ownershipId:second,componentCrawlId:f.crawlId})).rejects.toThrow('BID_SOURCE_OPERATION_CONFLICT');await expect(f.t.mutation(anyApi.harness.bind,{ownershipId:f.ownershipId,componentCrawlId:'other-crawl'})).rejects.toThrow('BID_SOURCE_OPERATION_CONFLICT');
 await f.t.run(async ctx=>{for(let i=0;i<25;i++)await ctx.db.insert('painterBidSourceOwnership',{tenantId:f.tenantId,creatorId:f.owner.userId,operationKey:`overflow-${i}`,sourceUrl:'https://bids.example.test/',componentCrawlId:`synthetic-${i}`,deleted:false});});await expect(f.authorized.query(anyApi.harness.list,{workspaceId:f.tenantId})).rejects.toThrow('BID_SOURCE_WINDOW_EXCEEDED');
});

test('atomic component binding admits one owner and rolls back the conflicting mapping',async()=>{
 const f=await fixture();const ids=[];for(let i=0;i<2;i++)ids.push(await f.authorized.mutation(anyApi.harness.prepare,{workspaceId:f.tenantId,operationKey:`race-${i}`,sourceUrl:'https://bids.example.test/'}));
 const outcomes=await Promise.allSettled(ids.map(ownershipId=>f.t.mutation(anyApi.harness.bind,{ownershipId,componentCrawlId:'synthetic-shared-component'})));expect(outcomes.filter(result=>result.status==='fulfilled')).toHaveLength(1);expect(outcomes.filter(result=>result.status==='rejected')).toHaveLength(1);
 const rows=await f.t.run(ctx=>ctx.db.query('painterBidSourceOwnership').withIndex('by_component',q=>q.eq('componentCrawlId','synthetic-shared-component')).take(2));expect(rows).toHaveLength(1);
});
