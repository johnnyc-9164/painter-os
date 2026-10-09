/** Read-only local comparison DTO. Pi owns transcript/recovery; this owns no run,
 * approval, effect or budget authority. Provisional IDs are attachment-local. */
export type PiView = {
  status: 'idle' | 'running' | 'failed' | 'uncertain';
  messages: {id: string; role: 'user' | 'assistant'; text: string}[];
  provisional?: {id: string; text: string};
  tools: {id: string; name: string; status: 'pending' | 'running' | 'recorded' | 'uncertain'; output?: string}[];
  queued: number;
};
export type ViewFrame = {attachment: string; sequence: number; reset: boolean; view: PiView};
export type ViewReceiver = {attachment: string; sequence: number; needsSnapshot: boolean; view?: PiView};
/** Attachment sequence is ephemeral ordering, NOT a durable Pi replay cursor.
 * A duplicate is ignored; any gap/order inversion requires a fresh snapshot. */
export function checkedFrame(input: unknown): ViewFrame {
  const object=(value:unknown,keys:string[])=>{if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).some(key=>!keys.includes(key)))throw new Error('INVALID_VIEW_FRAME');return value as Record<string,unknown>;};
  const string=(value:unknown,max=65536)=>{if(typeof value!=='string'||value.length>max)throw new Error('INVALID_VIEW_FRAME');};
  const identifier=(value:unknown,max:number)=>{string(value,max);if(!(value as string).trim())throw new Error('INVALID_VIEW_FRAME');};
  const count=(value:unknown)=>{if(typeof value!=='number'||!Number.isSafeInteger(value)||value<0)throw new Error('INVALID_VIEW_FRAME');};
  const rows=(value:unknown)=>{if(!Array.isArray(value)||value.length>128)throw new Error('LOCAL_VIEW_LIMIT_EXCEEDED');return value;};
  const frame=object(input,['attachment','sequence','reset','view']);identifier(frame.attachment,128);count(frame.sequence);if(typeof frame.reset!=='boolean')throw new Error('INVALID_VIEW_FRAME');
  const view=object(frame.view,['status','messages','provisional','tools','queued']);if(!['idle','running','failed','uncertain'].includes(String(view.status)))throw new Error('INVALID_VIEW_FRAME');count(view.queued);
  const ids=new Set<string>();for(const value of rows(view.messages)){const message=object(value,['id','role','text']);identifier(message.id,256);string(message.text);if(message.role!=='user'&&message.role!=='assistant')throw new Error('INVALID_VIEW_FRAME');if(ids.has(String(message.id)))throw new Error('DUPLICATE_VIEW_MESSAGE');ids.add(String(message.id));}
  const toolIds=new Set<string>();for(const value of rows(view.tools)){const tool=object(value,['id','name','status','output']);identifier(tool.id,256);if(toolIds.has(String(tool.id)))throw new Error('DUPLICATE_VIEW_TOOL');toolIds.add(String(tool.id));string(tool.name,256);if(!['pending','running','recorded','uncertain'].includes(String(tool.status)))throw new Error('INVALID_VIEW_FRAME');if(tool.output!==undefined)string(tool.output);}
  if(view.provisional!==undefined){const provisional=object(view.provisional,['id','text']);identifier(provisional.id,256);string(provisional.text);}
  return input as ViewFrame;
}
export function receiveFrame(receiver: ViewReceiver, frame: ViewFrame): ViewReceiver {
  checkedFrame(frame);
  if(frame.attachment!==receiver.attachment)throw new Error('VIEW_ATTACHMENT_MISMATCH');
  if(!Number.isSafeInteger(frame.sequence)||frame.sequence<0)throw new Error('INVALID_VIEW_SEQUENCE');
  if(frame.reset&&frame.sequence<receiver.sequence)return {...receiver,needsSnapshot:true};
  if(frame.reset)return {...receiver,sequence:frame.sequence,needsSnapshot:false,view:structuredClone(frame.view)};
  if(frame.sequence===receiver.sequence)return receiver;
  if(frame.sequence<receiver.sequence||frame.sequence!==receiver.sequence+1)return {...receiver,needsSnapshot:true};
  if(receiver.needsSnapshot)return receiver;
  return {...receiver,sequence:frame.sequence,view:structuredClone(frame.view)};
}
export const directSse=(frame:ViewFrame)=>{checkedFrame(frame);return `event: pi-view\ndata: ${JSON.stringify(frame)}\n\n`;};
