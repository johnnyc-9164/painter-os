import test from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../apps/company-site/src/app/api/company-website-media/route';
const request=(query='workspaceId=workspace&mediaId=image&revision=1')=>new Request(`http://127.0.0.1/api/company-website-media?${query}`);
test('public proxy restricts inputs before contacting a fixed publication endpoint',async()=>{
for(const query of ['workspaceId=w&mediaId=m','workspaceId=w&mediaId=m&revision=0','workspaceId=w&mediaId=m&revision=1&url=https://evil.test','workspaceId=w&workspaceId=x&mediaId=m&revision=1'])assert.equal((await GET(request(query))).status,400);
});
test('proxy fixes destination, blocks redirects, bounds body and strips unrelated headers',async()=>{
const previous=process.env.NEXT_PUBLIC_CONVEX_SITE_URL,original=globalThis.fetch;process.env.NEXT_PUBLIC_CONVEX_SITE_URL='https://fixture.convex.site';
try{
let input:URL|undefined;let options:RequestInit|undefined;
globalThis.fetch=(async(url,init)=>{input=new URL(String(url));options=init;return new Response(new Uint8Array([1,2,3]),{headers:{'content-type':'image/webp','set-cookie':'must-not-forward','x-private':'must-not-forward','cache-control':'public,max-age=3600'}});}) as typeof fetch;
const response=await GET(request());assert.equal(input?.origin,'https://fixture.convex.site');assert.equal(input?.pathname,'/company-website-media');assert.equal(input?.searchParams.get('revision'),'1');assert.equal(options?.redirect,'error');assert.equal(options?.cache,'no-store');assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('set-cookie'),null);assert.equal(response.headers.get('x-private'),null);assert.equal((await response.arrayBuffer()).byteLength,3);
for(const value of [new Response('svg',{headers:{'content-type':'image/svg+xml'}}),new Response('body',{headers:{'content-type':'image/png','content-length':String(4*1024*1024)}}),new Response(new Uint8Array(4*1024*1024),{headers:{'content-type':'image/png'}})]){globalThis.fetch=(async()=>value) as typeof fetch;assert.equal((await GET(request())).status,502);}
globalThis.fetch=(async()=>new Response(null,{status:404})) as typeof fetch;assert.equal((await GET(request())).status,404);
process.env.NEXT_PUBLIC_CONVEX_SITE_URL='https://fixture.convex.site/untrusted';assert.equal((await GET(request())).status,503);
}finally{globalThis.fetch=original;if(previous===undefined)delete process.env.NEXT_PUBLIC_CONVEX_SITE_URL;else process.env.NEXT_PUBLIC_CONVEX_SITE_URL=previous;}
});
