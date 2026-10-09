import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { setTimeout as delay } from 'node:timers/promises';
import {projectSnapshot,frameFromAgUi,agUiEvents,receiveFrame} from '../src/pi-ui-projection.ts';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

function runtime(storage, release = 'yes', production = false) {
  const options = convertV4MiniflareOptions({
    name: 'painter-local-test', modules: true,
    scriptPath: new URL(production ? '../dist/index.js' : '../dist-fixture/worker.js', import.meta.url).pathname,
    compatibilityDate: '2026-10-09', compatibilityFlags: ['nodejs_compat'],
    durableObjects: production ? { PAINTER_AGENT: { className: 'PainterAgent', useSQLite: true } } : { FIXTURE: { className: 'FixtureAgent', useSQLite: true } },
    bindings: { RELEASE: release },
  });
  // Miniflare 5 stores resource persistence on the instance, not the V4 DO option.
  options.resourcePersistencePath = storage;
  return new Miniflare(options);
}
async function call(mf, path, params = {}) {
  const url = new URL(path, 'http://fixture.invalid');
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  const response = await mf.dispatchFetch(url);
  assert.equal(response.status, 200, await response.clone().text());
  return response.json();
}
function metric(state, name) { return state.metrics.find(row => row.name === name)?.count ?? 0; }
async function until(mf, predicate, params = {}) {
  for (let i = 0; i < 100; i++) { const state = await call(mf, '/inspect', params); if (predicate(state)) return state; await delay(30); }
  throw new Error('Fixture did not reach expected durable checkpoint');
}

test('actual atomic event attachment projects persisted messages and restart snapshot IDs', {timeout:60000}, async()=>{
 const storage=await mkdtemp(join(tmpdir(),'painter-view-events-'));let mf=runtime(storage);
 try {
  const start=await call(mf,'/events/start');assert.equal(start.frames[0].reset,true);
  await call(mf,'/submit',{operation:'view-input'});await call(mf,'/result',{operation:'view-input'});
  await delay(30);
  const {frames}=await call(mf,'/events/read');assert.ok(frames.length>1);
  let receiver={attachment:'local-fixture',sequence:0,needsSnapshot:true};
  for(const frame of frames)receiver=receiveFrame(receiver,frameFromAgUi(agUiEvents(frame)));
  const expected=projectSnapshot(await call(mf,'/snapshot'));
  assert.deepEqual(receiver.view.messages,expected.messages);assert.equal(receiver.view.provisional,undefined);
  await mf.dispose();mf=runtime(storage);
  const recovered=(await call(mf,'/events/start')).frames[0];assert.deepEqual(recovered.view.messages,expected.messages);
  assert.equal(recovered.sequence,0,'new attachment has no invented durable cursor');
 }finally{await mf.dispose();await rm(storage,{recursive:true,force:true});}
});
test('actual Pi watch overflow replaces unavailable listener backlog with authoritative reset snapshot', {timeout:60000}, async()=>{
 const storage=await mkdtemp(join(tmpdir(),'painter-view-overflow-'));const mf=runtime(storage,'no');
 try{
  await call(mf,'/events/start',{defer:'yes'});
  await call(mf,'/submit',{operation:'blocked'});await until(mf,state=>metric(state,'read')===1);
  for(let i=0;i<105;i++)await call(mf,'/submit',{operation:`queued-${i}`,prompt:`queued ${i}`});
  await call(mf,'/events/resume');await delay(50);
  const {frames}=await call(mf,'/events/read');const reset=frames.find(frame=>frame.sequence>0&&frame.reset);
  assert.ok(reset,'installed Pi overflow delivered a snapshot reset');
  const expected=projectSnapshot(await call(mf,'/snapshot'));assert.deepEqual(frames.at(-1).view,expected);
  assert.ok(frames.length<100,'overflow did not replay the entire backlog');
 }finally{await mf.dispose();await rm(storage,{recursive:true,force:true});}
});
test('actual interrupted tool stream never presents an unrecorded result as confirmed effect', {timeout:60000},async()=>{
 const storage=await mkdtemp(join(tmpdir(),'painter-view-interrupt-'));const mf=runtime(storage,'no');
 try{
  await call(mf,'/events/start');await call(mf,'/submit',{operation:'interrupt-view',prompt:'unsafe effect'});
  await until(mf,state=>metric(state,'effect')===1);
  await call(mf,'/abort',{operation:'interrupt-view'});await call(mf,'/result',{operation:'interrupt-view'});await delay(30);
  const {frames}=await call(mf,'/events/read');assert.ok(frames.some(frame=>frame.view.tools.some(tool=>tool.status==='running')));
  const final=frames.at(-1).view;assert.equal(final.provisional,undefined);
  assert.deepEqual((await call(mf,'/inspect')).effects,[{id:'fixed-effect',outcome:'dispatching'}]);
  assert.equal(JSON.stringify(final).includes('confirmed'),false);
 }finally{await mf.dispose();await rm(storage,{recursive:true,force:true});}
});
test('event fixture routes never open the production Worker adapter', {timeout:30000},async()=>{
 const storage=await mkdtemp(join(tmpdir(),'painter-view-prod-'));const mf=runtime(storage,'yes',true);
 try{for(const path of ['/events/start','/events/resume','/events/read','/events/stop']){const response=await mf.dispatchFetch(`http://fixture.invalid${path}`);assert.equal(response.status,503);assert.deepEqual(await response.json(),{error:'TRUSTED_AGENT_ADAPTER_NOT_CONFIGURED'});}}
 finally{await mf.dispose();await rm(storage,{recursive:true,force:true});}
});
