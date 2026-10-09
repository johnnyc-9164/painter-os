import {test} from 'node:test';
import assert from 'node:assert/strict';
import {projectSnapshot,projectEvents,receiveFrame,agUiEvents,frameFromAgUi,directSse,agUiSse} from '../src/pi-ui-projection.ts';
const snapshot=()=>({type:'snapshot',entries:[{id:'persisted',model:[{role:'user',content:'question'},{role:'assistant',content:[{type:'text',text:'answer'},{type:'thinking',thinking:'private'}]}]}],tools:[],inbox:[],agent:{},usage:{}});
const frame=(sequence=0,reset=true)=>({attachment:'local',sequence,reset,view:projectSnapshot(snapshot())});
test('persisted IDs, provisional reconciliation and private fields stay separate',()=>{
 const initial=projectSnapshot({...snapshot(),generation:{attempt:9,message:{content:[{type:'text',text:'partial'}]}}});
 assert.equal(initial.provisional.id,'provisional:9');
 const final=projectEvents(initial,[{type:'message_end',entry:{id:'final',model:[{role:'assistant',content:'finished'}]}}]);
 assert.equal(final.provisional,undefined);assert.equal(final.messages.at(-1).id,'final:0');
 assert.equal(JSON.stringify(final).includes('private'),false);
 assert.deepEqual(projectEvents(final,[{type:'entry_appended',entry:{id:'final',model:[{role:'assistant',content:'finished'}]}}]),final);
});
test('gaps, inversion, duplicates and attachment mismatch require honest snapshot recovery',()=>{
 let receiver={attachment:'local',sequence:0,needsSnapshot:true};
 receiver=receiveFrame(receiver,frame());
 assert.equal(receiveFrame(receiver,frame(0,false)),receiver);
 receiver=receiveFrame(receiver,frame(2,false));assert.equal(receiver.needsSnapshot,true);
 assert.equal(receiveFrame(receiver,frame(1,false)).needsSnapshot,true);
 receiver=receiveFrame(receiver,frame(3,true));assert.equal(receiver.needsSnapshot,false);
 assert.equal(receiveFrame(receiver,frame(2,true)).needsSnapshot,true);
 assert.throws(()=>receiveFrame(receiver,{...frame(),attachment:'other'}),/MISMATCH/);
});
test('tool end without persisted result is uncertain; recorded result never proves an external effect',()=>{
 const running=projectEvents(projectSnapshot(snapshot()),[{type:'tool_execution_start',toolCallId:'t',toolName:'fixture_effect'}]);
 const unknown=projectEvents(running,[{type:'tool_execution_end',toolCallId:'t'}]);
 assert.equal(unknown.status,'uncertain');assert.equal(unknown.tools[0].status,'uncertain');
 const recorded=projectEvents(running,[{type:'tool_execution_end',toolCallId:'t',entry:{id:'receipt'}}]);
 assert.equal(recorded.tools[0].status,'recorded');
 assert.equal(projectEvents(unknown,[{type:'run_end'}]).status,'uncertain');
 assert.equal(projectEvents(running,[{type:'task_failed'}]).status,'failed');
});
test('core validated snapshots round-trip same view as direct SSE; local DTO independently rejects malformed authority',()=>{
 const value=frame();assert.deepEqual(frameFromAgUi(agUiEvents(value)),value);
 const encoded=directSse(value);assert.deepEqual(JSON.parse(encoded.split('data: ')[1]),value);
 assert.ok(Buffer.byteLength(agUiSse(value))>Buffer.byteLength(encoded));
 assert.throws(()=>agUiEvents({...value,view:{...value.view,approved:true}}),/INVALID_VIEW_FRAME/);
 assert.throws(()=>agUiEvents({...value,view:{...value.view,messages:Array(129).fill(value.view.messages[0])}}),/LOCAL_VIEW_LIMIT_EXCEEDED/);
 const events=agUiEvents(value);events[1].messages[0].content='different';assert.throws(()=>frameFromAgUi(events),/MISMATCH/);
});
test('neutral direct encoder keeps core runtime out of its bundle; compare identical snapshot bytes',async()=>{
 const {build}=await import('esbuild');const results=[];
 for(const [name,path] of [['directSse','pi-view-contract'],['agUiSse','pi-ui-projection']]){
  const result=await build({stdin:{contents:`import {${name}} from './src/${path}.ts';globalThis.encode=${name};`,resolveDir:new URL('..',import.meta.url).pathname},bundle:true,minify:true,write:false,platform:'browser',metafile:true});
  results.push({encoder:name,bytes:result.outputFiles[0].contents.length,dependencyModules:Object.keys(result.metafile.inputs).filter(path=>path.includes('node_modules')).length});
 }
 assert.equal(results[0].dependencyModules,0);assert.ok(results[1].dependencyModules>0);
 const value=frame();console.log('Local encoder comparison',JSON.stringify({bundles:results,wire:{directBytes:Buffer.byteLength(directSse(value)),agUiBytes:Buffer.byteLength(agUiSse(value))}}));
});
