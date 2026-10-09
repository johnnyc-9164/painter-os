import {test,expect,vi,afterEach,beforeEach} from 'vitest';
import {convexTest} from 'convex-test';
import {actionGeneric,componentsGeneric,anyApi} from 'convex/server';
import schema from '../convex/schema';
import {v, type GenericId} from 'convex/values';
import type {ComponentApi} from '@firecrawl/firecrawl-convex/_generated/component';
import firecrawl from '@firecrawl/firecrawl-convex/test';
import {FirecrawlClient} from '@firecrawl/firecrawl-convex';
beforeEach(()=>{vi.stubEnv('FIRECRAWL_API_URL','https://synthetic-provider.example.test');vi.stubGlobal('fetch',()=>{throw new Error('Unstubbed network forbidden');});});
const sdk=new FirecrawlClient((componentsGeneric() as unknown as {firecrawl:ComponentApi}).firecrawl);
const fixtures={scrape:actionGeneric({args:{},returns:v.string(),handler:async ctx=>(await sdk.scrape(ctx,'https://bids.example.test/',{formats:['markdown'],timeout:15000})).markdown??''})};
afterEach(()=>{vi.clearAllTimers();vi.useRealTimers();vi.unstubAllGlobals();vi.unstubAllEnvs();});
test('pinned official installed component executes locally with strict stub fetch',async()=>{
  vi.stubEnv('FIRECRAWL_API_KEY','synthetic-test-only-key');
  const fetch=vi.fn(async()=>new Response(JSON.stringify({success:true,data:{markdown:'Synthetic bid source',metadata:{sourceURL:'https://bids.example.test/'}}}),{status:200}));
  vi.stubGlobal('fetch',fetch);
  const t=convexTest(schema,{'./_generated/test-root-marker.ts':()=>Promise.resolve({}),'./fixtures.ts':()=>Promise.resolve(fixtures)});
  firecrawl.register(t);
  const result=await t.action(anyApi.fixtures.scrape,{});
  expect(result).toBe('Synthetic bid source');expect(fetch).toHaveBeenCalledTimes(1);
});
test('official standalone webhook HMAC and per-crawl token reject tampering',async()=>{
  vi.useFakeTimers();vi.stubEnv('FIRECRAWL_API_KEY','synthetic-test-only-key');vi.stubEnv('FIRECRAWL_WEBHOOK_SECRET','synthetic-test-only-secret');vi.stubEnv('CONVEX_SITE_URL','https://synthetic.convex.site/firecrawl');
  const fetch=vi.fn(async()=>new Response(JSON.stringify({success:true,id:'synthetic-job'}),{status:200}));vi.stubGlobal('fetch',fetch);
  const fc=convexTest(firecrawl.schema,firecrawl.modules);
  const started=await fc.action(anyApi.crawl.start,{url:'https://bids.example.test/',mode:'webhook',options:{limit:5}});
  const crawl=await fc.run(ctx=>ctx.db.get(started.crawlId as GenericId<'crawls'>));
  const sign=async(secret:string,body:string)=>{const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);const bytes=new Uint8Array(await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(body)));return 'sha256='+Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('');};
  const body=JSON.stringify({id:'synthetic-job',type:'crawl.page',metadata:{crawlId:started.crawlId},data:[{markdown:'Synthetic quote',metadata:{sourceURL:'https://bids.example.test/'}}]});
  const init={method:'POST',headers:{'x-firecrawl-convex-token':crawl!.token},body};
  expect((await fc.fetch('/webhook',init)).status).toBe(401);
  const signed={...init,headers:{...init.headers,'x-firecrawl-signature':await sign('synthetic-test-only-secret',body)}};
  expect((await fc.fetch('/webhook',{...signed,headers:{...signed.headers,'x-firecrawl-convex-token':'wrong-token'}})).status).toBe(401);
  expect((await fc.fetch('/webhook',signed)).status).toBe(200);
  expect((await fc.fetch('/webhook',signed)).status).toBe(200);
  expect((await fc.fetch('/webhook',{...signed,body:body+' '})).status).toBe(401);
  expect((await fc.run(ctx=>ctx.db.query('pages').take(6))).length).toBe(1);
  const oversized=JSON.stringify({id:'synthetic-job',type:'crawl.page',metadata:{crawlId:started.crawlId},data:[{markdown:'x'.repeat(500_000),metadata:{sourceURL:'https://bids.example.test/large'}}]});
  expect((await fc.fetch('/webhook',{...signed,body:oversized,headers:{...signed.headers,'x-firecrawl-signature':await sign('synthetic-test-only-secret',oversized)}})).status).toBe(200);
  const pages=await fc.run(ctx=>ctx.db.query('pages').take(6));
  expect(pages).toHaveLength(2);expect(pages.find(page=>page.url.endsWith('/large'))).toMatchObject({truncated:true});
});
test('official 402 and bounded 429 retry behavior remain synthetic',async()=>{
  vi.stubEnv('FIRECRAWL_API_KEY','synthetic-test-only-key');
  {
    const t=convexTest(schema,{'./_generated/test-root-marker.ts':()=>Promise.resolve({}),'./fixtures.ts':()=>Promise.resolve(fixtures)});firecrawl.register(t);
    const noCredits=vi.fn(async()=>new Response(JSON.stringify({success:false,error:'synthetic credits exhausted'}),{status:402}));vi.stubGlobal('fetch',noCredits);
    await expect(t.action(anyApi.fixtures.scrape,{})).rejects.toThrow();expect(noCredits).toHaveBeenCalledTimes(1);
    const rate=vi.fn(async()=>new Response(JSON.stringify({success:false,error:'synthetic rate limit'}),{status:429,headers:{'retry-after':'0'}}));vi.stubGlobal('fetch',rate);
    await expect(t.action(anyApi.fixtures.scrape,{})).rejects.toThrow();expect(rate).toHaveBeenCalledTimes(4);
  }
});
test('official ambiguous start records failure after four attempted starts, no extra host retry',async()=>{
  vi.stubEnv('FIRECRAWL_API_KEY','synthetic-test-only-key');
  {
    const lost=vi.fn(async()=>{throw new Error('Synthetic lost start response');});vi.stubGlobal('fetch',lost);
    const fc=convexTest(firecrawl.schema,firecrawl.modules);await expect(fc.action(anyApi.crawl.start,{url:'https://bids.example.test/',mode:'poll',options:{limit:5}})).rejects.toThrow();
    expect(lost).toHaveBeenCalledTimes(4);expect(await fc.run(ctx=>ctx.db.query('crawls').take(6))).toMatchObject([{status:'failed',finalized:true}]);
  }
},10000);
test('official poll follows returned cursor outside provider origin with synthetic Authorization',async()=>{
  vi.useFakeTimers();vi.stubEnv('FIRECRAWL_API_KEY','synthetic-test-only-key');
  const calls: Array<{url:string;authorization:string|null}>=[];
  const fetch=vi.fn(async(input: string|URL,init?:RequestInit)=>{
    const url=String(input);calls.push({url,authorization:new Headers(init?.headers).get('Authorization')});
    if(url.endsWith('/v2/crawl'))return new Response(JSON.stringify({success:true,id:'cursor-job'}));
    if(url.endsWith('/v2/crawl/cursor-job'))return new Response(JSON.stringify({success:true,status:'scraping',total:1,completed:0,data:[],next:'https://unexpected.example.test/cursor'}));
    if(url==='https://unexpected.example.test/cursor')return new Response(JSON.stringify({success:true,status:'completed',total:0,completed:0,data:[]}));
    throw new Error('Unexpected external request forbidden');
  });vi.stubGlobal('fetch',fetch);
  const fc=convexTest(firecrawl.schema,firecrawl.modules);const started=await fc.action(anyApi.crawl.start,{url:'https://bids.example.test/',mode:'poll',options:{limit:5}});
  await fc.action(anyApi.crawl.poll,{crawlId:started.crawlId});await fc.action(anyApi.crawl.poll,{crawlId:started.crawlId});
  expect(calls.some(call=>call.url==='https://unexpected.example.test/cursor'&&call.authorization==='Bearer synthetic-test-only-key')).toBe(true);
});
