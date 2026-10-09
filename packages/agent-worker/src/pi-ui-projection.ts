import type { AgentEvent, SnapshotEvent } from '@earendil-works/pi-durable';
import { EventType } from '@ag-ui/core';
import { StateSnapshotEventSchema, MessagesSnapshotEventSchema } from '@ag-ui/core/schemas';

import {checkedFrame} from './pi-view-contract.ts';
import type {PiView,ViewFrame} from './pi-view-contract.ts';
export {receiveFrame,directSse} from './pi-view-contract.ts';
export type {PiView,ViewFrame,ViewReceiver} from './pi-view-contract.ts';
const text = (message: unknown): string => {
  const content = (message as {content?: unknown})?.content;
  if (typeof content === 'string') return content;
  return Array.isArray(content) ? content.filter(block=>block?.type === 'text' && typeof block.text === 'string').map(block=>block.text).join('') : '';
};
function entryMessages(entry: SnapshotEvent['entries'][number]): PiView['messages'] {
  return (entry.model ?? []).flatMap((message,index)=>message.role==='user'||message.role==='assistant' ? [{id:`${entry.id}:${index}`,role:message.role,text:text(message)}] : []);
}
export function projectSnapshot(snapshot: SnapshotEvent): PiView {
  const tools: PiView['tools'] = snapshot.tools.map(slot=>({id:slot.callId,name:slot.name,status:slot.status==='done' ? slot.entry ? 'recorded' : 'uncertain' : slot.status,...(slot.output ? {output:slot.output} : {})}));
  return {status:tools.some(tool=>tool.status==='uncertain') ? 'uncertain' : snapshot.run ? 'running' : 'idle',messages:snapshot.entries.flatMap(entryMessages),tools,queued:snapshot.inbox.length,...(snapshot.generation?.message ? {provisional:{id:`provisional:${snapshot.generation.attempt}`,text:text(snapshot.generation.message)}} : {})};
}
export function projectEvents(previous: PiView, events: readonly AgentEvent[], partialSnapshot?: SnapshotEvent): PiView {
  let view: PiView = structuredClone(previous);
  for (const event of events) {
    if(event.type==='snapshot'){view=projectSnapshot(event);continue;}
    if(event.type==='run_start')view.status='running';
    if(event.type==='run_end'&&view.status!=='failed')view.status=view.tools.some(tool=>tool.status==='uncertain')?'uncertain':'idle';
    if(event.type==='task_failed')view.status='failed';
    if(event.type==='inbox_update')view.queued=event.items.length;
    if(event.type==='message_start'&&event.message.role==='assistant')view.provisional={id:`provisional:${view.messages.length}`,text:text(event.message)};
    if(event.type==='message_update') {
      if(!partialSnapshot)throw new Error('PI_PARTIAL_SNAPSHOT_REQUIRED');
      // Pi owns indexed blocks. Re-read its authoritative full text rather than
      // maintaining a competing reasoning/tool-argument/block transcript cache.
      const current=projectSnapshot(partialSnapshot);
      view.messages=current.messages;
      if(current.provisional)view.provisional=current.provisional;else delete view.provisional;
    }
    if(event.type==='message_end'||event.type==='entry_appended'){
      const messages=entryMessages(event.entry);
      for(const message of messages){const index=view.messages.findIndex(existing=>existing.id===message.id);if(index<0)view.messages.push(message);else view.messages[index]=message;}
      if(event.type==='message_end'&&messages.some(message=>message.role==='assistant'))delete view.provisional;
    }
    if(event.type==='tool_execution_start')view.tools=[...view.tools.filter(tool=>tool.id!==event.toolCallId),{id:event.toolCallId,name:event.toolName,status:'running'}];
    if(event.type==='tool_execution_update'){
      const tool=view.tools.find(tool=>tool.id===event.toolCallId);
      if(tool&&event.output)tool.output='set' in event.output?event.output.set:(tool.output??'').slice(event.output.trimStart??0)+(event.output.append??'');
    }
    if(event.type==='tool_execution_end'){
      const tool=view.tools.find(tool=>tool.id===event.toolCallId);
      if(tool)tool.status=event.entry?'recorded':'uncertain';
      if(!event.entry)view.status='uncertain';
      // Recorded means a Pi result exists, never an external effect succeeded.
    }
  }
  return view;
}
export function agUiEvents(frame: ViewFrame) {
  checkedFrame(frame);
  return [StateSnapshotEventSchema.parse({type:EventType.STATE_SNAPSHOT,snapshot:frame}),MessagesSnapshotEventSchema.parse({type:EventType.MESSAGES_SNAPSHOT,messages:frame.view.messages.map(message=>({id:message.id,role:message.role,content:message.text}))})];
}
export function frameFromAgUi(events: unknown[]): ViewFrame {
  if(events.length!==2)throw new Error('INVALID_AG_UI_FRAME');
  const state=StateSnapshotEventSchema.parse(events[0]);const messages=MessagesSnapshotEventSchema.parse(events[1]);
  const frame=checkedFrame(state.snapshot);
  if(JSON.stringify(messages.messages)!==JSON.stringify(frame.view.messages.map(message=>({id:message.id,role:message.role,content:message.text}))))throw new Error('AG_UI_MESSAGE_MISMATCH');
  return frame;
}
export const agUiSse=(frame:ViewFrame)=>agUiEvents(frame).map(event=>`data: ${JSON.stringify(event)}\n\n`).join('');
