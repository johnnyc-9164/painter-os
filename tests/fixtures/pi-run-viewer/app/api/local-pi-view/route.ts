import {readFile,stat} from 'node:fs/promises';
import {directSse,agUiSse} from '../../../../../../packages/agent-worker/src/pi-ui-projection.ts';
import {checkedFrame} from '../../../../../../packages/agent-worker/src/pi-view-contract.ts';
export const runtime='nodejs';
export async function GET(request:Request){
 const url=new URL(request.url);const encoding=url.searchParams.get('encoding');const scenario=url.searchParams.get('scenario');
 if(!['127.0.0.1','localhost'].includes(url.hostname))return Response.json({error:'LOCAL_FIXTURE_ONLY'},{status:403});
 if(!['direct','ag-ui'].includes(encoding??'')||!['completed','running','interrupted','empty','failure','gap','slow'].includes(scenario??''))return Response.json({error:'INVALID_FIXTURE_REQUEST'},{status:400});
 if(scenario==='failure')return Response.json({error:'SYNTHETIC_CONNECTION_FAILURE'},{status:503});
 const path=process.env.PI_VIEW_FIXTURE_FILE;if(!path)return Response.json({error:'FIXTURE_NOT_CONFIGURED'},{status:503});
 try{
  if((await stat(path)).size>2*1024*1024)throw new Error('FIXTURE_LIMIT_EXCEEDED');
  const records=JSON.parse(await readFile(path,'utf8')) as Record<string,unknown[]>;
  let frames=(records[scenario==='gap'||scenario==='slow'?'completed':scenario!]??[]).map(checkedFrame);
  if(frames.length===0||frames.length>256)throw new Error('FIXTURE_LIMIT_EXCEEDED');
  if(scenario==='gap')frames=url.searchParams.get('fresh')==='yes'?[{...frames.at(-1)!,sequence:0,reset:true}]:frames.filter((_frame,index)=>index!==1);
  const wire=frames.map(encoding==='direct'?directSse:agUiSse);
  if(wire.reduce((size,part)=>size+Buffer.byteLength(part),0)>2*1024*1024)throw new Error('FIXTURE_LIMIT_EXCEEDED');
  let index=0;let timer:ReturnType<typeof setTimeout>|undefined;let stopped=false;
  const body=new ReadableStream<Uint8Array>({start(controller){
   const send=()=>{if(stopped)return;if(index===wire.length){controller.close();return;}controller.enqueue(new TextEncoder().encode(wire[index++]));timer=setTimeout(send,20);};
   timer=setTimeout(send,scenario==='slow'?800:20);
  },cancel(){stopped=true;if(timer)clearTimeout(timer);}});
  return new Response(body,{headers:{'Content-Type':'text/event-stream','Cache-Control':'no-store','X-Painter-Fixture':'local-pi'}});
 }catch{return Response.json({error:'INVALID_LOCAL_FIXTURE'},{status:503});}
}
