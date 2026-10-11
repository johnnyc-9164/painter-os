import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire, registerHooks} from 'node:module';
import {fileURLToPath} from 'node:url';

const fixture=(name:string)=>new URL(`./fixtures/command-route/${name}`,import.meta.url).href;
const mocks=new Map([
 ['next/server','next.cjs'],['@/lib/local-runtime','local.cjs'],['./local-runtime','local.cjs'],
 ['convex/browser','convex-browser.cjs'],['@painter-os-bts/backend/convex/runtime','backend.cjs'],['./auth-server','bridge.cjs'],
]);
const hooks=registerHooks({resolve(specifier,context,nextResolve){
 const mock=mocks.get(specifier);
 if(mock)return {url:fixture(mock),shortCircuit:true};
 if(specifier==='@/lib/http')return {url:new URL('../apps/web/src/lib/http.ts',import.meta.url).href,shortCircuit:true};
 if(specifier==='@/lib/convex-runtime')return {url:new URL('../apps/web/src/lib/convex-runtime.ts',import.meta.url).href,shortCircuit:true};
 return nextResolve(specifier,context);
}});
const require=createRequire(import.meta.url);
const route=require(fileURLToPath(new URL('../apps/web/src/app/api/command/route.ts',import.meta.url))) as {POST:(request:Request)=>Promise<Response>};
type Seam={user:unknown;mutate:()=>unknown;mutations:number};
const seam=globalThis as typeof globalThis & {[key:symbol]:Seam};
const state=()=>seam[Symbol.for('painter.command.route.test')];
const redacted=()=>new Error('[CONVEX M(painter:command)] [Request ID: abc123] Server Error');
const post=(body:string)=>route.POST(new Request('https://painter.test/api/command',{method:'POST',headers:{origin:'https://painter.test',host:'painter.test','content-type':'application/json'},body}));
const valid=JSON.stringify({action:'customer.create',requestKey:'k1',input:{name:'A'}});
const setup=(user:unknown,mutate:()=>unknown)=>{seam[Symbol.for('painter.command.route.test')]={user,mutate,mutations:0};};

test('no session: redacted backend failure becomes 401 UNAUTHENTICATED',async()=>{
 setup(null,()=>{throw redacted();});
 const response=await post(valid);
 assert.equal(response.status,401);
 assert.deepEqual(await response.json(),{error:'UNAUTHENTICATED'});
 assert.equal(state().mutations,1);
});
test('malformed bodies stay 400 and never reach the backend',async()=>{
 setup(null,()=>{throw redacted();});
 for(const body of ['not-json','{"action":"x"}'])assert.equal((await post(body)).status,400);
 assert.equal(state().mutations,0);
});
test('authenticated success is unchanged',async()=>{
 setup({_id:'u1'},()=>({ok:true}));
 const response=await post(valid);
 assert.equal(response.status,200);
 assert.deepEqual(await response.json(),{ok:true});
});
test('authenticated failures keep their original mapping, redacted or coded',async()=>{
 setup({_id:'u1'},()=>{throw new Error('[CONVEX M(painter:command)] Server Error\nUncaught Error: REVISION_CONFLICT\nCalled by client');});
 assert.equal((await post(valid)).status,409);
 setup({_id:'u1'},()=>{throw redacted();});
 const response=await post(valid);
 assert.equal(response.status,400);
 assert.deepEqual(await response.json(),{error:'INTERNAL_ERROR'});
});
test.after(()=>hooks.deregister());
