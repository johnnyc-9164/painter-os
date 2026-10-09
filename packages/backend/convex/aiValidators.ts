import { v } from 'convex/values';
export const aiCapability = v.union(v.literal('workspace_summary'), v.literal('recommendation_draft'));
export const aiAttemptKind = v.union(v.literal('initial'), v.literal('model_retry'), v.literal('recovery_model'));
export const aiBilling = v.union(v.literal('billable'), v.literal('not_billable'), v.literal('unknown'));

export function aiText(value:string,max=200):string {if(!value.trim()||value!==value.trim()||value.length>max)throw new Error('AI_INVALID_INPUT');return value;}
export function aiCount(value:number,max=Number.MAX_SAFE_INTEGER):number {if(!Number.isSafeInteger(value)||value<0||value>max)throw new Error('AI_INVALID_NUMBER');return value;}
export function aiPositive(value:number,max=Number.MAX_SAFE_INTEGER):number {aiCount(value,max);if(value===0)throw new Error('AI_INVALID_NUMBER');return value;}
export function aiFingerprint(value:unknown):string {
  if(Array.isArray(value))return `[${value.map(aiFingerprint).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(key=>`${JSON.stringify(key)}:${aiFingerprint((value as Record<string,unknown>)[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
