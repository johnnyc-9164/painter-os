// These tests exercise our real TypeScript handlers with an explicitly fake database.
// They do NOT establish Convex runtime behavior, schema enforcement, or OCC behavior.
import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';import {join,resolve,dirname} from 'node:path';
const require=createRequire(import.meta.url);let ts;try{ts=require('typescript');}catch{ts=createRequire(join(execFileSync('npm',['root','-g'],{encoding:'utf8'}).trim(),'_loader.cjs'))('typescript');}
const cache=new Map(),root=resolve('src');
const fakeV=new Proxy({}, {get:(_,key)=>(...args)=>key==='object'?{fields:args[0]}:{}});
function load(path){const full=resolve(root,path);if(cache.has(full))return cache.get(full);if(!existsSync(full))return null;const exports={};cache.set(full,exports);
 const js=ts.transpileModule(readFileSync(full,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const dep=name=>{if(name==='convex/values')return {v:fakeV,ConvexError:Error};if(name==='convex/server')return {paginationOptsValidator:{}};if(name==='convex-helpers/server/pagination')return {paginator:db=>({query:t=>db.query(t)})};if(name.endsWith('_generated/server.js'))return {mutation:x=>x,query:x=>x};if(name.endsWith('/schema.js'))return {default:{}};if(name.startsWith('.')){const r=load(resolve(dirname(full),name.replace(/\.js$/,'.ts')));if(r===null)throw Error(`Missing local dependency: ${name}`);return r;}throw Error(`Unexpected dependency: ${name}`);};new Function('exports','require',js)(exports,dep);return exports;}
function db(){let seq=0;let tables={};const rows=t=>tables[t]??(tables[t]=[]);const field=(r,k)=>k.split('.').reduce((r,k)=>r?.[k],r);const api={
 get tables(){return tables;},normalizeId:(t,id)=>typeof id==='string'&&id.startsWith(`${t}:`)?id:null,
 async insert(t,row){const id=`${t}:${++seq}`;rows(t).push({...structuredClone(row),_id:id,_creationTime:seq});return id;},
 async get(id){return structuredClone(Object.values(tables).flat().find(x=>x._id===id)??null);},
 async patch(id,patch){const r=Object.values(tables).flat().find(x=>x._id===id);assert.ok(r);Object.assign(r,structuredClone(patch));},
 query(t){let filters=[],direction='asc';const q={withIndex(_name,fn){const ix={eq(k,v){filters.push([k,v]);return ix;}};fn(ix);return q;},order(d){direction=d;return q;},rows(){const r=rows(t).filter(row=>filters.every(([k,v])=>field(row,k)===v));return direction==='desc'?r.slice().reverse():r;},async unique(){const r=q.rows();if(r.length>1)throw Error('NON_UNIQUE');return r[0]??null;},async first(){return q.rows()[0]??null;},async take(n){return q.rows().slice(0,n);},async paginate(o){const start=Number(o.cursor??0),r=q.rows();return {page:r.slice(start,start+o.numItems),continueCursor:String(Math.min(start+o.numItems,r.length)),isDone:start+o.numItems>=r.length};}};return q;},
 async transaction(fn){const backup=structuredClone(tables);const old=seq;try{return await fn({db:api});}catch(e){tables=backup;seq=old;throw e;}},
 };return api;}

export {load, db};
