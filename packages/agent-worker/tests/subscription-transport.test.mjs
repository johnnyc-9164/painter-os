import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { runSubscriptionTransport, SUBSCRIPTION_ENDPOINT, SUBSCRIPTION_LIMITS } from '../src/subscription-transport.ts';
import { stream } from '@earendil-works/pi-ai/api/openai-responses';
import { normalizeContext } from '@earendil-works/pi-ai/utils/transcript';

const model={id:'fixture-account-model',name:'Synthetic account-selected model',api:'openai-responses',provider:'openai',baseUrl:'https://api.openai.com/v1',input:['text'],reasoning:false,contextWindow:4096,maxTokens:128,cost:{input:0,output:0,cacheRead:0,cacheWrite:0}};
const usage={input:0,output:0,cacheRead:0,cacheWrite:0,totalTokens:0,cost:{input:0,output:0,cacheRead:0,cacheWrite:0,total:0}};
const context={systemPrompt:'Use only the supplied company facts.',messages:[{role:'user',content:'Earlier exact customer facts',timestamp:1},{role:'assistant',content:[{type:'text',text:'Earlier reply'}],api:model.api,provider:model.provider,model:model.id,stopReason:'stop',timestamp:2,usage},{role:'user',content:'Current exact request',timestamp:3}]};
const binding={actorId:'fixture-member',workspaceId:'fixture-company',connectionId:'fixture-connection',revoked:false,modelIds:[model.id]};
const item={type:'message',id:'msg_fixture',role:'assistant',status:'completed',content:[{type:'output_text',text:'Synthetic complete answer',annotations:[]}]};
const initial=[{type:'response.created',response:{id:'resp_fixture',status:'in_progress'}},{type:'response.output_item.added',output_index:0,item:{...item,status:'in_progress',content:[]}},{type:'response.output_text.delta',output_index:0,content_index:0,delta:'Synthetic complete answer'},{type:'response.output_item.done',output_index:0,item}];
const complete={type:'response.completed',response:{id:'resp_fixture',status:'completed',output:[item],usage:{input_tokens:4,output_tokens:3,total_tokens:7}}};
function sse(events){return new Response(events.map(event=>`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join(''),{headers:{'content-type':'text/event-stream'}});}
function fixture(response=()=>sse([...initial,complete])){
 const calls=[];const fetch=async(input,init)=>{assert.equal(String(input),SUBSCRIPTION_ENDPOINT);assert.equal(init.method,'POST');assert.equal(new Headers(init.headers).get('authorization'),'Bearer synthetic-subscription-fixture-token');calls.push({url:String(input),body:JSON.parse(init.body)});return response();};
 return {calls,args:{request:{actorId:binding.actorId,workspaceId:binding.workspaceId,connectionId:binding.connectionId},trustedBinding:binding,model,context,fetch,fixtureOnly:true}};
}
let previousFetch;
beforeEach(()=>{previousFetch=globalThis.fetch;globalThis.fetch=()=>{throw new Error('No real network/fallback permitted');};});
afterEach(()=>{globalThis.fetch=previousFetch;});
test('actual installed Pi HTTP/SSE seams enforce exact full-context developer wire and explicit completion',async()=>{
 const f=fixture();assert.deepEqual(await runSubscriptionTransport(f.args),{state:'completed',text:'Synthetic complete answer',toolsReady:false,compatibilityOnly:true});assert.equal(f.calls.length,1);
 const body=f.calls[0].body;assert.deepEqual(Object.keys(body).sort(),['input','model','store','stream']);assert.equal(body.store,false);assert.equal(body.stream,true);assert.equal(body.model,model.id);assert.deepEqual(body.input.map(message=>message.role),['developer','user','assistant','user']);
 assert.ok(JSON.stringify(body.input).includes('Earlier exact customer facts'));assert.ok(JSON.stringify(body.input).includes('Earlier reply'));assert.ok(JSON.stringify(body.input).includes('Current exact request'));
});
test('caller scope is compared with separate trusted fixture binding; revoked/catalog/endpoint denies before fetch',async()=>{
 for(const patch of [{request:{...binding,workspaceId:'foreign'}},{request:{...binding,actorId:'foreign'}},{request:{...binding,connectionId:'foreign'}},{trustedBinding:{...binding,revoked:true}},{trustedBinding:{...binding,modelIds:['other-model']}},{model:{...model,baseUrl:'https://chatgpt.com/backend-api'}},{model:{...model,provider:'openai-codex'}},{fixtureOnly:false}]){
  const f=fixture();const outcome=await runSubscriptionTransport({...f.args,...patch});assert.notEqual(outcome.state,'completed');assert.equal(outcome.toolsReady,false);assert.equal(f.calls.length,0);assert.equal('text' in outcome,false);
 }
});
test('sampling and last-minute onPayload overrides cannot bypass final strict body validation',async()=>{
 const bad=[{store:true},{stream:false},{max_output_tokens:50},{temperature:0.2},{top_p:0.5},{service_tier:'priority'},{previous_response_id:'resp_prior'},{conversation:'secret'},{background:true},{metadata:{actor:'fake'}},{tools:[{type:'tool_search'}]},{model:'different'},{input:[{role:'user',content:[{type:'input_text',text:'truncated'}]}]}];
 for(const samplingParams of bad){const f=fixture();assert.equal((await runSubscriptionTransport({...f.args,sdkOverrides:{samplingParams}})).state,'unsupported');assert.equal(f.calls.length,0);}
 for(const change of bad){const f=fixture();assert.equal((await runSubscriptionTransport({...f.args,sdkOverrides:{onPayload:payload=>({...payload,...change})}})).state,'unsupported');assert.equal(f.calls.length,0);}
 const f=fixture();assert.equal((await runSubscriptionTransport({...f.args,model:{...model,samplingParams:{metadata:{late:'override'}}}})).state,'unsupported');assert.equal(f.calls.length,0);
 const mutated=fixture();const selected={...model};assert.equal((await runSubscriptionTransport({...mutated.args,model:selected,sdkOverrides:{onPayload:(payload,choice)=>{choice.id='unselected-late-model';return {...payload,model:choice.id};}}})).state,'unsupported');assert.equal(mutated.calls.length,0);
});
test('unsupported tool/image/mid-conversation declarations deny without any tool dispatcher',async()=>{
 const cases=[{...context,tools:[{name:'business_write',description:'Forbidden',parameters:{type:'object',properties:{}}}]},{...context,messages:[...context.messages,{role:'toolResult',toolCallId:'call',toolName:'business_write',content:[{type:'text',text:'fake'}],isError:false,timestamp:4}]},{...context,messages:[...context.messages,{role:'user',content:[{type:'image',data:'synthetic',mimeType:'image/png'}],timestamp:4}]},{...context,messages:[...context.messages,{role:'system',content:'Late authority',timestamp:4}]}];
 for(const candidate of cases){const f=fixture();assert.equal((await runSubscriptionTransport({...f.args,context:candidate})).state,'unsupported');assert.equal(f.calls.length,0);}
});
test('quota failure after text discards partial output and preserves safe machine code',async()=>{
 const f=fixture(()=>sse([...initial,{type:'response.failed',response:{status:'failed',error:{code:'usage_limit_exceeded',message:'Sensitive provider diagnostic'}}}]));const result=await runSubscriptionTransport(f.args);assert.deepEqual(result,{state:'quota_paused',toolsReady:false,compatibilityOnly:true});assert.equal(f.calls.length,1);assert.equal(JSON.stringify(result).includes('Sensitive'),false);
});
test('Pi generic done(length) is not a subscription success; incomplete and EOF remain failed',async()=>{
 const incomplete={type:'response.incomplete',response:{id:'resp_fixture',status:'incomplete',output:[item],incomplete_details:{reason:'max_output_tokens'}}};
 const raw=stream(model,normalizeContext(context),{apiKey:'synthetic-subscription-fixture-token',cacheRetention:'none',fetch:async()=>sse([...initial,incomplete]),maxRetries:0});const events=[];for await(const event of raw)events.push(event);assert.equal(events.at(-1).type,'done');assert.equal(events.at(-1).reason,'length');
 const f=fixture(()=>sse([...initial,incomplete]));assert.equal((await runSubscriptionTransport(f.args)).state,'incomplete');const eof=fixture(()=>sse(initial));assert.equal((await runSubscriptionTransport(eof.args)).state,'protocol_error');
});
test('HTTP quota and unavailable responses have one actual SDK attempt and no API fallback/backoff claim',async()=>{
 for(const [status,state,headers] of [[429,'quota_paused',{'retry-after':'0'}],[503,'unavailable',{'retry-after':'120'}],[401,'ineligible',{}],[403,'ineligible',{}],[400,'unsupported',{}]]){
  const f=fixture(()=>new Response(JSON.stringify({error:{code:'usage_limit_exceeded',message:'private diagnostic'}}),{status,headers}));const outcome=await runSubscriptionTransport(f.args);assert.equal(outcome.state,state);assert.equal(f.calls.length,1);assert.equal('text' in outcome,false);if(status===503)assert.equal(outcome.retryAfterMs,30000);
 }
});
test('completed tool calls, unfinished arguments and hosted tool terminal output never become tool-ready',async()=>{
 const tool={type:'function_call',id:'fc_fixture',call_id:'call_fixture',name:'business_write',arguments:'{"tenant":"forged"}'};
 for(const events of [[{type:'response.output_item.added',output_index:0,item:tool},{type:'response.output_item.done',output_index:0,item:tool},{...complete,response:{...complete.response,output:[tool]}}],[{type:'response.output_item.added',output_index:0,item:{...tool,arguments:''}},{type:'response.function_call_arguments.delta',output_index:0,delta:'{"unfinished":'},complete],[...initial,{...complete,response:{...complete.response,output:[{type:'web_search_call'}]}}]]){
  const f=fixture(()=>sse(events));const outcome=await runSubscriptionTransport(f.args);assert.equal(outcome.state,'unsupported');assert.equal(outcome.toolsReady,false);assert.equal('text' in outcome,false);
 }
});
test('completed followed by failed/incomplete or duplicate completion remains failure; bounded output is enforced',async()=>{
 for(const terminal of [{type:'response.failed',response:{status:'failed',error:{code:'usage_limit_exceeded'}}},{type:'response.incomplete',response:{status:'incomplete',incomplete_details:{reason:'max_output_tokens'}}},complete]){const f=fixture(()=>sse([...initial,complete,terminal]));assert.notEqual((await runSubscriptionTransport(f.args)).state,'completed');}
 const large=fixture(()=>sse([{...initial[1]},{type:'response.output_text.delta',output_index:0,delta:'x'.repeat(32769)},complete]));assert.equal((await runSubscriptionTransport(large.args)).state,'unsupported');
});
test('response bytes/events are bounded before arbitrary SSE materialization; Unicode output uses bytes',async()=>{
 const oversized=fixture(()=>sse([{type:'response.created',padding:'x'.repeat(SUBSCRIPTION_LIMITS.wireBytes+1)},complete]));assert.equal((await runSubscriptionTransport(oversized.args)).state,'unsupported');
 const many=fixture(()=>sse([...Array.from({length:SUBSCRIPTION_LIMITS.providerEvents+1},()=>({type:'response.in_progress',response:{status:'in_progress'}})),complete]));assert.equal((await runSubscriptionTransport(many.args)).state,'unsupported');
 const unicode=fixture(()=>sse([initial[1],{type:'response.output_text.delta',output_index:0,delta:'🖌'.repeat(10000)},complete]));assert.equal((await runSubscriptionTransport(unicode.args)).state,'unsupported');
 const extra=fixture();assert.equal((await runSubscriptionTransport({...extra.args,sdkOverrides:{headers:{authorization:'forged'}}})).state,'unsupported');assert.equal(extra.calls.length,0);
});
test('application deadline bounds an actual Pi stalled SSE body ignoring vendor signal and cancels owned reader',async t=>{
 for(const partial of [false,true]){
  t.mock.timers.enable({apis:['setTimeout']});
  let cancelled=0;let requests=0;let signal;let announceFetch;
  const fetched=new Promise(resolve=>{announceFetch=resolve;});
  const body=new ReadableStream({start(controller){if(partial)controller.enqueue(new TextEncoder().encode(initial.map(event=>`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join('')));},cancel(){cancelled++;if(partial)return new Promise(()=>{});}});
  const f=fixture();
  const result=runSubscriptionTransport({...f.args,fetch:async(_input,init)=>{requests++;signal=init.signal;announceFetch();return new Response(body,{headers:{'content-type':'text/event-stream'}});}});
  await fetched;for(let i=0;i<20;i++)await Promise.resolve();
  let settled=false;void result.then(()=>{settled=true;});
  t.mock.timers.tick(SUBSCRIPTION_LIMITS.deadlineMs-1);await Promise.resolve();assert.equal(settled,false);assert.equal(cancelled,0);
  t.mock.timers.tick(1);assert.deepEqual(await result,{state:'unavailable',toolsReady:false,compatibilityOnly:true});assert.equal(signal.aborted,true);assert.equal(cancelled,1);assert.equal(requests,1);
  t.mock.timers.reset();
 }
});
