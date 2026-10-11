import assert from 'node:assert/strict';
import {join} from 'node:path';
import {setTimeout as delay} from 'node:timers/promises';
import {writeFile} from 'node:fs/promises';
import {Miniflare,convertV4MiniflareOptions} from 'miniflare';
import {projectSnapshot} from '../../../packages/agent-worker/src/pi-ui-projection.ts';
function runtime(directory,release){const options=convertV4MiniflareOptions({name:'local-viewer-source',modules:true,scriptPath:new URL('../../../packages/agent-worker/dist-fixture/worker.js',import.meta.url).pathname,compatibilityDate:'2026-10-09',compatibilityFlags:['nodejs_compat'],durableObjects:{FIXTURE:{className:'FixtureAgent',useSQLite:true}},bindings:{RELEASE:release}});options.resourcePersistencePath=directory;return new Miniflare(options);}
async function call(mf,path,params={}){const url=new URL(path,'http://fixture.invalid');for(const[key,value]of Object.entries(params))url.searchParams.set(key,value);const response=await mf.dispatchFetch(url);assert.equal(response.status,200);return response.json();}
async function capture(directory,kind){const mf=runtime(join(directory,kind),kind==='running'||kind==='interrupted'?'no':'yes');
 try{
  await call(mf,'/events/start');
  if(kind==='empty')return (await call(mf,'/events/read')).frames;
  await call(mf,'/submit',{operation:kind,prompt:kind==='running'?'inflight model':kind==='interrupted'?'unsafe effect':'read'});
  if(kind==='running'||kind==='interrupted'){
   let ready=false;for(let i=0;i<100;i++){const snapshot=await call(mf,'/snapshot');const state=await call(mf,'/inspect');ready=kind==='running'?projectSnapshot(snapshot).provisional?.text==='local partial response':state.effects.some(effect=>effect.outcome==='dispatching');if(ready)break;await delay(30);}assert.ok(ready,'actual Pi fixture checkpoint');
   if(kind==='interrupted'){await call(mf,'/abort',{operation:kind});await call(mf,'/result',{operation:kind});assert.deepEqual((await call(mf,'/inspect')).effects,[{id:'fixed-effect',outcome:'dispatching'}]);}
  }else await call(mf,'/result',{operation:kind});
  await delay(40);const frames=(await call(mf,'/events/read')).frames;assert.ok(frames.length>1);return frames;
 }finally{await mf.dispose();}
}
export async function prepareFrames(directory){const records={};for(const kind of ['empty','completed','running','interrupted'])records[kind]=await capture(directory,kind);const path=join(directory,'pi-view-frames.json');await writeFile(path,JSON.stringify(records),{mode:0o600});return path;}
if(process.argv[1]===new URL(import.meta.url).pathname){if(!process.argv[2])throw new Error('OWNED_FIXTURE_DIRECTORY_REQUIRED');await prepareFrames(process.argv[2]);console.log('Captured actual local Pi views');}
