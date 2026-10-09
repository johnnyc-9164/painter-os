import assert from 'node:assert/strict';
import {consumeView} from './fixtures/pi-run-viewer/lib/view-stream.ts';
const base=process.env.PI_VIEW_TEST_URL;
if(!base||new URL(base).hostname!=='127.0.0.1'||new URL(base).protocol!=='http:')throw new Error('LOOPBACK_FIXTURE_REQUIRED');
const measurements=[];
const request=path=>fetch(new URL(path,base),{signal:AbortSignal.timeout(15000),redirect:'error'});
const html=await (await request('/')).text();assert.match(html,/One run\. Two views\./);assert.match(html,/noindex/);
for(const scenario of ['completed','running','interrupted','empty']){
 const views=[];const bytes=[];for(const encoding of ['direct','ag-ui']){const response=await request(`/api/local-pi-view?scenario=${scenario}&encoding=${encoding}`);assert.match(response.headers.get('cache-control'),/no-store/);assert.equal(response.headers.get('x-painter-fixture'),'local-pi');bytes.push((await response.clone().arrayBuffer()).byteLength);let view;await consumeView(response,encoding,frame=>{view=frame.view;});views.push(view);}
 measurements.push({scenario,directBytes:bytes[0],agUiBytes:bytes[1]});
 assert.deepEqual(views[0],views[1],`${scenario}: identical authoritative view`);
 if(scenario==='completed')assert.ok(views[0].messages.some(message=>message.text==='fixture completed'));
 if(scenario==='running')assert.equal(views[0].provisional.text,'local partial response');
 if(scenario==='empty')assert.equal(views[0].messages.length,0);
}
for(const encoding of ['direct','ag-ui']){
 await assert.rejects(consumeView(await request(`/api/local-pi-view?scenario=gap&encoding=${encoding}`),encoding,()=>{}),/VIEW_SNAPSHOT_REQUIRED/);
 let recovered;await consumeView(await request(`/api/local-pi-view?scenario=gap&encoding=${encoding}&fresh=yes`),encoding,frame=>{recovered=frame.view;});assert.ok(recovered.messages.some(message=>message.text==='fixture completed'));
 assert.equal((await request(`/api/local-pi-view?scenario=failure&encoding=${encoding}`)).status,503);
}
assert.equal((await request('/api/local-pi-view?scenario=other&encoding=direct')).status,400);
assert.equal((await request('/api/local-pi-view?scenario=empty&encoding=other')).status,400);
assert.equal((await request('/api/agent')).status,404);
console.log('Actual Pi fixture wire bytes',JSON.stringify(measurements));
console.log('Local Pi viewer HTTP: actual frames match both encodings; gap recovery/limits/fixture errors pass');
