import type {ViewFrame} from '@painter-os-bts/domain/agent-run-view';
import {checkedFrame,receiveFrame} from '../../../../packages/agent-worker/src/pi-view-contract.ts';
export type Encoding='direct'|'ag-ui';
/** Fixture transport only; limits fail explicitly, never drop malformed chunks. */
export async function consumeView(response:Response,encoding:Encoding,onFrame:(frame:ViewFrame)=>void){
 if(!response.ok||!response.body)throw new Error('VIEW_UNAVAILABLE');
 const reader=response.body.getReader();const decoder=new TextDecoder('utf-8',{fatal:true});let buffered='',bytes=0,events=0;
 let receiver:ReturnType<typeof receiveFrame>|undefined;let state:unknown;
 const accept=(frame:ViewFrame)=>{
  receiver=receiveFrame(receiver??{attachment:frame.attachment,sequence:0,needsSnapshot:true},frame);
  if(receiver.needsSnapshot)throw new Error('VIEW_SNAPSHOT_REQUIRED');
  onFrame({...frame,view:receiver.view!});
 };
 try{
  while(true){const part=await reader.read();if(part.done)break;
   bytes+=part.value.byteLength;if(bytes>2*1024*1024)throw new Error('VIEW_STREAM_LIMIT_EXCEEDED');buffered+=decoder.decode(part.value,{stream:true});
   let end;while((end=buffered.indexOf('\n\n'))>=0){const block=buffered.slice(0,end);buffered=buffered.slice(end+2);if(++events>512)throw new Error('VIEW_STREAM_LIMIT_EXCEEDED');
    const lines=block.split('\n');const data=lines.filter(line=>line.startsWith('data: '));if(data.length!==1)throw new Error('INVALID_VIEW_EVENT');const value:unknown=JSON.parse(data[0].slice(6));
    if(encoding==='direct'){if(!lines.includes('event: pi-view'))throw new Error('INVALID_VIEW_EVENT');accept(checkedFrame(value));}
    else {const adapter=await import('../../../../packages/agent-worker/src/pi-ui-projection.ts');if(state===undefined)state=value;else{accept(adapter.frameFromAgUi([state,value]));state=undefined;}}
   }
  }
  buffered+=decoder.decode();if(buffered.trim()||state!==undefined||!receiver)throw new Error('INCOMPLETE_VIEW_STREAM');
 }finally{await reader.cancel().catch(()=>{});reader.releaseLock();}
}
