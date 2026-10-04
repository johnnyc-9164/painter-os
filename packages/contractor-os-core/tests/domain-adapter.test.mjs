import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, existsSync} from 'node:fs';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {join, resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import * as core from '../build/shared/domain.js';
import * as port from '../build/shared/port.js';
const require=createRequire(import.meta.url);
let ts;try{ts=require('typescript');}catch{ts=createRequire(join(execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'_loader.cjs'))('typescript');}
const base=resolve(dirname(fileURLToPath(import.meta.url)),'../src');
const cache=new Map();
const fakeV=new Proxy({}, {get:()=>()=>({})});
function load(path){
 const full=resolve(base,path);if(cache.has(full))return cache.get(full);
 if(!existsSync(full))return {};
 const exports={};cache.set(full,exports);
 const js=ts.transpileModule(readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const mock=name=>{
  if(name==='convex/values')return {v:fakeV,ConvexError:Error};
  if(name==='convex/server')return {paginationOptsValidator:{}};
  if(name==='convex-helpers/server/pagination')return {paginator:db=>({query:table=>db.query(table)})};
  if(name.endsWith('_generated/server.js'))return {mutation:d=>d,query:d=>d};
  if(name.endsWith('/schema.js'))return {default:{}};
  if(name.endsWith('domainValidators.js'))return {domainProperties:new Proxy({},{get:()=>({})}),domainRelations:new Proxy({},{get:()=>({})})};
  if(name.endsWith('domainTables.js'))return {domainEnvelope:{}};
  if(name.endsWith('shared/domain.js'))return core;
  if(name.endsWith('shared/port.js'))return port;
  if(name.startsWith('.'))return load(resolve(dirname(full),name.replace(/\.js$/,'.ts')));
  throw Error(`Unexpected test-double import: ${name}`);
 };
 new Function('exports','require',js)(exports,mock);return exports;
}
const modules=Object.fromEntries(Object.keys(core.DOMAIN_MANIFEST).map(bp=>[bp,load(`component/records/${bp}.ts`)]));
function database(){let n=0;const tables={};const rows=t=>tables[t]??(tables[t]=[]);return {tables,
 async insert(t,r){const _id=`${t}:${++n}`;rows(t).push({...structuredClone(r),_id,_creationTime:n});return _id;},
 async get(id){return Object.values(tables).flat().find(r=>r._id===id)??null;},
 normalizeId(t,id){return typeof id==='string'&&id.startsWith(t+':')?id:null;},
 async patch(id,patch){const r=await this.get(id);assert.ok(r);Object.assign(r,structuredClone(patch));},
 query(t){let conditions=[];const c={withIndex(name,fn){const q={eq(k,v){conditions.push([k,v]);return q;}};fn(q);return c;}, rows(){return rows(t).filter(r=>conditions.every(([k,v])=>r[k]===v));},async unique(){const found=c.rows();assert.ok(found.length<2);return found[0]??null;},async take(n){return c.rows().slice(0,n);},async paginate(p){const start=Number(p.cursor??0);const all=c.rows();return {page:all.slice(start,start+p.numItems),isDone:start+p.numItems>=all.length,continueCursor:String(Math.min(all.length,start+p.numItems))};}};return c;}
};}
const args=(more={})=>({tenantId:'a',actorId:'verified|user',identifier:'test',requestKey:'one',properties:{},relations:{},...more});
async function call(bp,op,db,input){assert.equal(typeof modules[bp]?.[op]?.handler,'function',`${bp}.${op} must exist`);return modules[bp][op].handler({db},input);}
for(const bp of Object.keys(core.DOMAIN_MANIFEST))test(`domain adapter double: ${bp} has create/get/list/update`,()=>{for(const op of ['create','get','list','update'])assert.equal(typeof modules[bp][op]?.handler,'function');});
test('domain adapter double: event appended before materialized row',async()=>{const db=database();const r=await call('co_client','create',db,args({properties:{city:'A'}}));assert.equal(r.revision,1);assert.equal(db.tables.domainEvents[0]._creationTime,1);assert.equal(db.tables.co_client[0].lastEventId,r.eventId);});
test('domain adapter double: retry returns original receipt without duplicate event',async()=>{const db=database();const a=args();const r=await call('co_client','create',db,a);const b=await call('co_client','create',db,a);assert.equal(b.id,r.id);assert.equal(b.replayed,true);assert.equal(db.tables.domainEvents.length,1);});
test('domain adapter double: changed input with reused request key rejected',async()=>{const db=database();await call('co_client','create',db,args());await assert.rejects(call('co_client','create',db,args({title:'changed'})),/IDEMPOTENCY_KEY_CONFLICT/);});
test('domain adapter double: duplicate identity rejected under new key',async()=>{const db=database();await call('co_client','create',db,args());await assert.rejects(call('co_client','create',db,args({requestKey:'two'})),/ENTITY_EXISTS/);});
test('domain adapter double: same external identifier is tenant isolated',async()=>{const db=database();await call('co_client','create',db,args());await call('co_client','create',db,args({tenantId:'b',title:'Other'}));assert.equal((await call('co_client','get',db,{tenantId:'a',identifier:'test'})).title,null);});
test('domain adapter double: updates require matching revision',async()=>{const db=database();await call('co_client','create',db,args());await assert.rejects(call('co_client','update',db,args({requestKey:'two',expectedRevision:4,properties:{city:'B'}})),/REVISION_CONFLICT/);assert.equal(db.tables.domainEvents.length,1);});
test('domain adapter double: update patches and unsets fields',async()=>{const db=database();await call('co_client','create',db,args({properties:{city:'A',notes:'remove'}}));const r=await call('co_client','update',db,args({requestKey:'two',expectedRevision:1,properties:{city:'B'},unsetProperties:['notes']}));assert.equal(r.revision,2);assert.deepEqual(db.tables.co_client[0].properties,{city:'B'});assert.equal(db.tables.domainEvents.length,2);});
test('domain adapter double: update replay does not fail on now-stale expected revision',async()=>{const db=database();await call('co_client','create',db,args());const a=args({requestKey:'two',expectedRevision:1,properties:{city:'B'}});await call('co_client','update',db,a);assert.equal((await call('co_client','update',db,a)).replayed,true);});
test('domain adapter double: missing target rejected before writes',async()=>{const db=database();await assert.rejects(call('co_contact','create',db,args({relations:{client:'co_client:999'}})),/RELATION_TARGET_MISSING/);assert.equal(db.tables.domainEvents?.length??0,0);});
test('domain adapter double: foreign tenant target rejected before writes',async()=>{const db=database();const c=await call('co_client','create',db,args({tenantId:'b'}));await assert.rejects(call('co_contact','create',db,args({relations:{client:c.id}})),/RELATION_TARGET_MISSING/);assert.equal(db.tables.domainEvents.length,1);});
test('domain adapter double: target table enforced even with same tenant',async()=>{const db=database();const c=await call('co_campaign','create',db,args());await assert.rejects(call('co_contact','create',db,args({requestKey:'two',relations:{client:c.id}})),/INVALID_RELATION_ID/);});
test('domain adapter double: valid target linked and list tenant-filtered',async()=>{const db=database();const c=await call('co_client','create',db,args());await call('co_contact','create',db,args({requestKey:'two',relations:{client:c.id}}));const p=await call('co_contact','list',db,{tenantId:'a',paginationOpts:{cursor:null,numItems:10}});assert.equal(p.page.length,1);assert.equal(p.page[0].relations.client,c.id);});
test('domain adapter double: query page sizes are bounded',async()=>{await assert.rejects(call('co_job','list',database(),{tenantId:'a',paginationOpts:{cursor:null,numItems:101}}),/INVALID_PAGE_SIZE/);});
test('domain adapter double: invalid fields never create event',async()=>{const db=database();await assert.rejects(call('co_job','create',db,args({properties:{status:'paid'}})),/INVALID_ENUM/);assert.equal(db.tables.domainEvents?.length??0,0);});
const {TypedContractorOS}=load('domainClient.ts');
function client(perms=['read','write'], authenticated=true){const calls=[];const refs={records:{co_client:{create:'create',update:'update',get:'get',list:'list'}}};const ctx={auth:{getUserIdentity:async()=>authenticated?{tokenIdentifier:'verified|actor'}:null},runQuery:async(ref,args)=>{calls.push({ref,args});return null;},runMutation:async(ref,args)=>{calls.push({ref,args});return null;}};const os=new TypedContractorOS(refs,async()=>({tenantId:'verified-tenant',permissions:perms}));return {ctx,os,calls};}
test('typed client double: viewer cannot write records',async()=>{const {ctx,os,calls}=client(['read']);await assert.rejects(os.co_client.create(ctx,{identifier:'x',requestKey:'1',properties:{}}),/FORBIDDEN/);assert.equal(calls.length,0);});
test('typed client double: unauthenticated caller cannot read',async()=>{const {ctx,os,calls}=client([],false);await assert.rejects(os.co_client.get(ctx,'x'),/UNAUTHENTICATED/);assert.equal(calls.length,0);});
test('typed client double: spoofed browser tenant and actor never reach component',async()=>{const {ctx,os,calls}=client();await os.co_client.create(ctx,{identifier:'x',requestKey:'1',properties:{},tenantId:'evil',actorId:'evil',permissions:['admin']});assert.equal(calls[0].args.tenantId,'verified-tenant');assert.equal(calls[0].args.actorId,'verified|actor');assert.equal(calls[0].args.permissions,undefined);});
test('typed client double: import permission does not imply domain write permission',async()=>{const {ctx,os}=client(['read','import']);await assert.rejects(os.co_client.create(ctx,{identifier:'x',requestKey:'1',properties:{}}),/FORBIDDEN/);});
