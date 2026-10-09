import type { Context, Model } from '@earendil-works/pi-ai';
import { getSystemMessageText } from '@earendil-works/pi-ai';
import { stream, type OpenAIResponsesOptions } from '@earendil-works/pi-ai/api/openai-responses';
import { normalizeContext, getDeclaredTools } from '@earendil-works/pi-ai/utils/transcript';

export const SUBSCRIPTION_ENDPOINT='https://api.openai.com/v1/responses';
export const SUBSCRIPTION_LIMITS={wireBytes:262144,providerEvents:256,outputBytes:32768,deadlineMs:15000} as const;
export interface SubscriptionScope { actorId:string; workspaceId:string; connectionId:string; }
/** Supplied by a separately trusted resolver in fixtures. This is not membership or commercial-grant proof. */
export interface SubscriptionBinding extends SubscriptionScope { revoked:boolean; modelIds:readonly string[]; }
export type SubscriptionFailure='binding_mismatch'|'revoked'|'unsupported'|'quota_paused'|'unavailable'|'ineligible'|'failed'|'incomplete'|'protocol_error';
export type SubscriptionOutcome={state:'completed';text:string;toolsReady:false;compatibilityOnly:true}|{state:SubscriptionFailure;toolsReady:false;compatibilityOnly:true;retryAfterMs?:number};
type Args={
 request:SubscriptionScope;trustedBinding:SubscriptionBinding;model:Model<'openai-responses'>;context:Context;
 /** Mandatory local fixture transport; there is no default/global fetch or real credential input. */
 fetch:NonNullable<OpenAIResponsesOptions['fetch']>;fixtureOnly:true;
 sdkOverrides?:Pick<OpenAIResponsesOptions,'samplingParams'|'onPayload'|'temperature'|'maxTokens'|'serviceTier'>;
};
function object(value:unknown):Record<string,unknown>|null{return value!==null&&typeof value==='object'&&!Array.isArray(value)?value as Record<string,unknown>:null;}
const failure=(state:SubscriptionFailure,retryAfterMs?:number):SubscriptionOutcome=>({state,toolsReady:false,compatibilityOnly:true,...(retryAfterMs!==undefined?{retryAfterMs}:{})});
type WireMessage={role:string;text:string};
function wireMessages(input:unknown):WireMessage[]{
 if(!Array.isArray(input)||!input.length||input.length>128)throw new Error('unsupported');
 return input.map(item=>{
  const message=object(item);if(!message||!['developer','user','assistant'].includes(String(message.role)))throw new Error('unsupported');
  const allowed=message.role==='assistant'?['type','role','content','status','id','phase']:['role','content'];
  if(Object.keys(message).some(key=>message[key]!==undefined&&!allowed.includes(key)))throw new Error('unsupported');
  if(message.role==='assistant'&&(message.type!=='message'||message.status!=='completed'))throw new Error('unsupported');
  if(typeof message.content==='string'){if(message.role!=='developer')throw new Error('unsupported');return {role:String(message.role),text:message.content};}
  if(!Array.isArray(message.content))throw new Error('unsupported');
  const text=message.content.map(part=>{
   const block=object(part);if(!block||typeof block.text!=='string'||block.type!==(message.role==='assistant'?'output_text':'input_text'))throw new Error('unsupported');
   if(Object.keys(block).some(key=>!['type','text','annotations'].includes(key))||block.annotations!==undefined&&(!Array.isArray(block.annotations)||block.annotations.length))throw new Error('unsupported');return block.text;
  }).join('');return {role:String(message.role),text};
 });
}
function validateWire(payload:unknown,modelId:string,expected:WireMessage[]):void{
 const body=object(payload);if(!body||body.model!==modelId||body.store!==false||body.stream!==true)throw new Error('unsupported');
 if(Object.keys(body).some(key=>body[key]!==undefined&&!['model','store','stream','input'].includes(key)))throw new Error('unsupported');
 if(JSON.stringify(wireMessages(body.input))!==JSON.stringify(expected))throw new Error('unsupported');
}
/** Offline compatibility adapter only; no OAuth, credential resolver, tool dispatcher or retry owner. */
export async function runSubscriptionTransport(args:Args):Promise<SubscriptionOutcome>{
 const {request,trustedBinding,model}=args;
 if(args.fixtureOnly!==true||typeof args.fetch!=='function')return failure('unsupported');
 if(args.sdkOverrides&&Object.keys(args.sdkOverrides).some(key=>!['samplingParams','onPayload','temperature','maxTokens','serviceTier'].includes(key)))return failure('unsupported');
 if(['actorId','workspaceId','connectionId'].some(key=>!(request as unknown as Record<string,unknown>)[key]||(request as unknown as Record<string,unknown>)[key] !== (trustedBinding as unknown as Record<string,unknown>)[key]))return failure('binding_mismatch');
 if(trustedBinding.revoked)return failure('revoked');
 if(model.api!=='openai-responses'||model.provider!=='openai'||model.baseUrl!=='https://api.openai.com/v1'||!trustedBinding.modelIds.includes(model.id)||model.reasoning)return failure('unsupported');
 const approvedModelId=model.id;
 let context;const expected:WireMessage[]=[];
 try{
  context=normalizeContext(args.context);if(getDeclaredTools(context.messages).length||!context.messages.length||context.messages.length>128)throw new Error('unsupported');
  for(const [index,message] of context.messages.entries()){
   if(message.role==='system'){if(index!==0)throw new Error('unsupported');expected.push({role:'developer',text:getSystemMessageText(message)});}
   else if(message.role==='user'){const text=typeof message.content==='string'?message.content:message.content.map(block=>{if(block.type!=='text')throw new Error('unsupported');return block.text;}).join('');expected.push({role:'user',text});}
   else if(message.role==='assistant'){if(message.stopReason!=='stop')throw new Error('unsupported');for(const block of message.content){if(block.type!=='text')throw new Error('unsupported');expected.push({role:'assistant',text:block.text});}}
   else throw new Error('unsupported');
  }
  if(expected[0]?.role!=='developer'||expected.some(message=>!message.text||message.text.length>32768)||JSON.stringify(expected).length>131072)throw new Error('unsupported');
 }catch{return failure('unsupported');}
 let observedCompleted=false;let terminalFailure:SubscriptionFailure|undefined;let policyFailure=false;let httpFailure:SubscriptionFailure|undefined;let retryAfterMs:number|undefined;let attempts=0;let text='';let done=false;let deltaBytes=0;let providerEvents=0;
 let timedOut=false;let ownedReader:ReadableStreamDefaultReader<Uint8Array>|undefined;
 const abort=new AbortController();let deadlineTimer:ReturnType<typeof setTimeout>;
 const deadline=new Promise<SubscriptionOutcome>(resolve=>{deadlineTimer=setTimeout(()=>{
  timedOut=true;resolve(failure('unavailable'));abort.abort();
  // Cancel owned consumption without awaiting a hostile underlying cancel promise.
  void ownedReader?.cancel().catch(()=>undefined);
 },SUBSCRIPTION_LIMITS.deadlineMs);});
 const consume=async():Promise<SubscriptionOutcome>=>{
 const events=stream(model,context,{
  ...args.sdkOverrides,apiKey:'synthetic-subscription-fixture-token',cacheRetention:'none',maxRetries:0,timeoutMs:SUBSCRIPTION_LIMITS.deadlineMs,signal:abort.signal,
  fetch:async(input,init)=>{
   if(timedOut)throw new Error('unavailable');
   attempts++;if(attempts!==1){policyFailure=true;throw new Error('unsupported');}
   const url=typeof input==='string'?input:input instanceof URL?input.href:input.url;
   if(url!==SUBSCRIPTION_ENDPOINT||init?.method!=='POST'||typeof init.body!=='string'){policyFailure=true;throw new Error('unsupported');}
   try{validateWire(JSON.parse(init.body),approvedModelId,expected);}catch{policyFailure=true;throw new Error('unsupported');}
   const response=await args.fetch(input,init);
   if(timedOut){void response.body?.cancel().catch(()=>undefined);throw new Error('unavailable');}
   if(response.redirected||response.url&&response.url!==SUBSCRIPTION_ENDPOINT){policyFailure=true;throw new Error('unsupported');}
   if(response.status===429)httpFailure='quota_paused';else if(response.status===401||response.status===403)httpFailure='ineligible';else if(response.status===400)httpFailure='unsupported';else if(response.status>=500){httpFailure='unavailable';const header=response.headers.get('retry-after');const delay=header===null?NaN:Number(header);if(Number.isFinite(delay)&&delay>=0)retryAfterMs=Math.min(delay*1000,30000);}
   // Bound bytes before the vendor SSE/JSON parser can materialize arbitrary response events.
   if(!response.body)return response;
   const reader=response.body.getReader();ownedReader=reader;let bytes=0;
   const body=new ReadableStream<Uint8Array>({async pull(controller){
    try{const chunk=await reader.read();if(chunk.done){controller.close();return;}bytes+=chunk.value.byteLength;if(bytes>SUBSCRIPTION_LIMITS.wireBytes){terminalFailure='unsupported';await reader.cancel();controller.error(new Error('unsupported'));return;}controller.enqueue(chunk.value);}
    catch{controller.error(new Error('protocol_error'));}
   },async cancel(){await reader.cancel();}});
   return new Response(body,{status:response.status,statusText:response.statusText,headers:response.headers});
  },
  onPayload:async(payload,selected)=>{
   const body=object(payload);if(!body){policyFailure=true;throw new Error('unsupported');}
   // Convert Pi's leading system shorthand explicitly; no transcript omission or hidden provider state.
   if(Array.isArray(body.input)&&object(body.input[0])?.role==='system')body.input[0]={...object(body.input[0]),role:'developer'};
   const replacement=await args.sdkOverrides?.onPayload?.(body,selected);const final=replacement===undefined?body:replacement;
   try{validateWire(final,approvedModelId,expected);}catch{policyFailure=true;throw new Error('unsupported');}return final;
  },
  onProviderStreamEvent:event=>{
   if(++providerEvents>SUBSCRIPTION_LIMITS.providerEvents){terminalFailure='unsupported';throw new Error('unsupported');}
   const raw=object(event);if(!raw||typeof raw.type!=='string'){terminalFailure='protocol_error';return;}
   if(raw.type==='response.completed'){
    const response=object(raw.response);if(response?.status!=='completed'||typeof response.id!=='string'||!Array.isArray(response.output)||observedCompleted)terminalFailure='protocol_error';else observedCompleted=true;
    if(Array.isArray(response?.output)&&response.output.some(item=>{
     const message=object(item);return message?.type!=='message'||message.role!=='assistant'||!Array.isArray(message.content)||message.content.some(block=>object(block)?.type!=='output_text');
    }))terminalFailure='unsupported';
   }
   else if(raw.type==='response.incomplete')terminalFailure='incomplete';
   else if(raw.type==='response.failed'||raw.type==='error'){
    const code=object(object(raw.response)?.error)?.code??raw.code;
    terminalFailure=['usage_limit_exceeded','insufficient_quota','rate_limit_exceeded'].includes(String(code))?'quota_paused':'failed';
   }
   else if(raw.type.includes('function_call')||raw.type.includes('custom_tool_call')||String(object(raw.item)?.type).includes('tool')||object(raw.item)?.type==='function_call')terminalFailure='unsupported';
   if(raw.type==='response.output_text.delta'){if(typeof raw.delta!=='string'){terminalFailure='protocol_error';throw new Error('protocol_error');}deltaBytes+=new TextEncoder().encode(raw.delta).byteLength;if(deltaBytes>SUBSCRIPTION_LIMITS.outputBytes){terminalFailure='unsupported';throw new Error('unsupported');}}
  },
 });
 try{for await(const event of events){if(event.type==='done'){done=event.reason==='stop';if(event.message.content.some(block=>block.type!=='text'))terminalFailure='unsupported';text=event.message.content.filter(block=>block.type==='text').map(block=>block.text).join('');}else if(event.type==='error'&&!terminalFailure&&!httpFailure&&!policyFailure)terminalFailure=observedCompleted?'failed':'protocol_error';}}
 catch{return failure(policyFailure?'unsupported':httpFailure??terminalFailure??'failed',retryAfterMs);}
 if(policyFailure)return failure('unsupported');if(httpFailure)return failure(httpFailure,retryAfterMs);if(terminalFailure)return failure(terminalFailure);
 if(timedOut)return failure('unavailable');
 if(!observedCompleted||!done)return failure('protocol_error');if(new TextEncoder().encode(text).byteLength>SUBSCRIPTION_LIMITS.outputBytes)return failure('unsupported');
 return {state:'completed',text,toolsReady:false,compatibilityOnly:true};
 };
 try{return await Promise.race([consume(),deadline]);}
 catch{return failure(timedOut?'unavailable':'protocol_error');}
 finally{clearTimeout(deadlineTimer!);}
}
