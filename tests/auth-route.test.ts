import assert from 'node:assert/strict';
import test from 'node:test';
import {createRequire, registerHooks} from 'node:module';
import {fileURLToPath} from 'node:url';

const mocks = new Map([
 ['next/server', `exports.NextRequest=class {}; exports.NextResponse={json:(value,init)=>Response.json(value,init)};`],
 ['@/lib/local-runtime', `exports.localEnabled=()=>false; exports.localAuth=()=>{throw Error('unexpected local fallback')}; exports.acceptInviteLocal=exports.localAuth; exports.COOKIE='test'; exports.actorFor=()=>{throw Error('unexpected local actor')};`],
 ['@/lib/convex-runtime', `exports.authCloud=(...args)=>globalThis[Symbol.for('painter.auth.route.test')](...args);`],
]);
const hooks = registerHooks({
 resolve(specifier, context, nextResolve) {
  if(mocks.has(specifier))return {url:new URL(`./mock-${encodeURIComponent(specifier)}.cjs`,import.meta.url).href,shortCircuit:true};
  if(specifier==='@/lib/http')return {url:new URL('../apps/web/src/lib/http.ts',import.meta.url).href,shortCircuit:true};
  if(specifier==='./http-error' && context.parentURL?.endsWith('/http.ts'))return {url:new URL('../apps/web/src/lib/http-error.ts',import.meta.url).href,shortCircuit:true};
  if(specifier==='./local-runtime' && context.parentURL?.endsWith('/http.ts'))return {url:new URL(`./mock-${encodeURIComponent('@/lib/local-runtime')}.cjs`,import.meta.url).href,shortCircuit:true};
  return nextResolve(specifier,context);
 },
 load(url,context,nextLoad){
  for(const [specifier,source] of mocks)if(url===new URL(`./mock-${encodeURIComponent(specifier)}.cjs`,import.meta.url).href)return {format:'commonjs',source,shortCircuit:true};
  return nextLoad(url,context);
 }
});
const require=createRequire(import.meta.url);
const auth=require(fileURLToPath(new URL('../apps/web/src/app/api/auth/route.ts',import.meta.url))) as {POST:(request:Request)=>Promise<Response>};
const invite=require(fileURLToPath(new URL('../apps/web/src/app/api/invites/[token]/route.ts',import.meta.url))) as {POST:(request:Request,ctx:{params:Promise<{token:string}>})=>Promise<Response>};
const seam=globalThis as typeof globalThis & {[key:symbol]:(...args:unknown[])=>Promise<Response>};
function request(){return new Request('https://painter.test/api/auth',{method:'POST',headers:{origin:'https://painter.test',host:'painter.test','content-type':'application/json'},body:JSON.stringify({action:'signin',email:'person@example.test'})});}

for(const [name,invoke] of [['auth',()=>auth.POST(request())],['invite',()=>invite.POST(request(),{params:Promise.resolve({token:'opaque-token'})})]] as const)test(`actual ${name} route maps async cloud failures`,async()=>{
 for(const code of ['UNAUTHENTICATED','FORBIDDEN','CONVEX_DEPLOYMENT_NOT_CONFIGURED']){
  seam[Symbol.for('painter.auth.route.test')]=async()=>{throw new Error(`[CONVEX M(painter:acceptInvite)] Server Error\nUncaught Error: ${code}\nCalled by client`);};
  const response=await invoke();
   assert.equal(response.status,code==='UNAUTHENTICATED'?401:code==='FORBIDDEN'?403:503);
   assert.deepEqual(await response.json(),{error:code});
 }
});
test('actual routes preserve successful auth response and trusted invitation token',async()=>{
 const calls:unknown[][]=[];
 seam[Symbol.for('painter.auth.route.test')]=async(...args)=>{calls.push(args);return Response.json({ok:true},{headers:{'set-cookie':'session=opaque; HttpOnly'}});};
 const authResponse=await auth.POST(request());
 const inviteResponse=await invite.POST(request(),{params:Promise.resolve({token:'path-token'})});
 assert.equal(authResponse.headers.get('set-cookie'),'session=opaque; HttpOnly');
 assert.equal(inviteResponse.status,200);
 assert.equal(calls[0][0],'signin');
 assert.equal(calls[1][0],'acceptInvite');
 assert.deepEqual(calls[1][1],{token:'path-token'});
});
test('origin and body validation reject before calling cloud auth',async()=>{
 let calls=0;
 seam[Symbol.for('painter.auth.route.test')]=async()=>{calls++;return Response.json({ok:true});};
 for(const invoke of [auth.POST,(req:Request)=>invite.POST(req,{params:Promise.resolve({token:'path-token'})})]){
  const wrongOrigin=new Request('https://painter.test/api/auth',{method:'POST',headers:{origin:'https://other.test',host:'painter.test'},body:'{}'});
  assert.equal((await invoke(wrongOrigin)).status,403);
  const invalidBody=new Request('https://painter.test/api/auth',{method:'POST',headers:{origin:'https://painter.test',host:'painter.test'},body:'not-json'});
  assert.equal((await invoke(invalidBody)).status,400);
 }
 assert.equal(calls,0);
});
test.after(()=>hooks.deregister());
