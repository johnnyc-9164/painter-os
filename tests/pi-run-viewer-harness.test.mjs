import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {assertFixtureEnvFiles,piViewerEnvironment} from '../scripts/run-pi-run-viewer.mjs';
import {consumeView} from './fixtures/pi-run-viewer/lib/view-stream.ts';
import {directSse,agUiSse} from '../packages/agent-worker/src/pi-ui-projection.ts';
const frame={attachment:'local',sequence:0,reset:true,view:{status:'idle',messages:[],tools:[],queued:0}};
function response(value,split=1){const bytes=new TextEncoder().encode(value);return new Response(new ReadableStream({start(controller){for(let offset=0;offset<bytes.length;offset+=split)controller.enqueue(bytes.slice(offset,offset+split));controller.close();}}));}
test('viewer receives split UTF8/SSE frames without skipped JSON and rejects incomplete/gapped streams',async()=>{
 for(const encoding of ['direct','ag-ui']){const value={...frame,view:{...frame.view,messages:[{id:'m',role:'assistant',text:'café 🖌'}]}};const wire=encoding==='direct'?directSse(value):agUiSse(value);const views=[];await consumeView(response(wire),encoding,item=>views.push(item.view));assert.deepEqual(views,[value.view]);await assert.rejects(consumeView(response(wire.slice(0,-4)),encoding,()=>{}),/INCOMPLETE|JSON/);const gap={...value,sequence:2,reset:false};await assert.rejects(consumeView(response(wire+(encoding==='direct'?directSse(gap):agUiSse(gap))),encoding,()=>{}),/VIEW_SNAPSHOT_REQUIRED/);}
});
test('viewer runner excludes secrets/HOME overrides and refuses env files by name only',async()=>{
 const env=piViewerEnvironment({PATH:'/safe',HOME:'/real',USERPROFILE:'/real',CONVEX_DEPLOY_KEY:'secret',OPENAI_API_KEY:'secret',PI_VIEW_FIXTURE_FILE:'/operator'},'/owned/pi-view-frames.json');assert.equal(env.HOME,undefined);assert.equal(env.USERPROFILE,undefined);assert.equal(env.CONVEX_DEPLOY_KEY,undefined);assert.equal(env.OPENAI_API_KEY,undefined);assert.equal(env.PI_VIEW_FIXTURE_FILE,'/owned/pi-view-frames.json');
 const directory=await mkdtemp(join(tmpdir(),'pi-view-env-'));try{await writeFile(join(directory,'.env.example'),'example');await assertFixtureEnvFiles(directory);await writeFile(join(directory,'.env.production.local'),'DO_NOT_READ');await assert.rejects(assertFixtureEnvFiles(directory),/FIXTURE_ENV_FILES_PRESENT/);}finally{await rm(directory,{recursive:true,force:true});}
});
