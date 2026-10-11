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
