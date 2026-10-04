import { evaluateCalculation, type Scalar } from './calculations.js';
import { DOMAIN_MANIFEST } from './domainManifest.js';
import { boundedString, canonicalJson, object, parseEntity, type Json } from './port.js';
import type { Blueprint } from './model.js';
import type { DomainProperties } from './domainTypes.js';
export { DOMAIN_MANIFEST };
export type { DomainProperties, DomainRelations } from './domainTypes.js';
interface Field { type: string; enum?: readonly string[]; format?: string }
interface Definition { properties: Record<string,Field>; unresolved_properties: readonly {name:string}[]; relations: Record<string,{target: Blueprint;cardinality:string}>; calculations:readonly string[] }
const definitions = DOMAIN_MANIFEST as unknown as Record<Blueprint,Definition>;
export function definition(blueprint: Blueprint): Definition {
  if (!Object.hasOwn(definitions,blueprint)) throw new Error('UNSUPPORTED_BLUEPRINT');
  return definitions[blueprint];
}
function dateTime(value:string):boolean {
 const m=/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:Z|[+-](\d{2}):(\d{2}))$/.exec(value);
 if(!m || !Number.isFinite(Date.parse(value))) return false;
 const [y,mo,d,h,mi,s]=m.slice(1,7).map(Number) as [number,number,number,number,number,number];
 const leap=y%4===0&&(y%100!==0||y%400===0), days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
 return mo>=1&&mo<=12&&d>=1&&d<=days[mo-1]!&&h<24&&mi<60&&s<60&&Number(m[7]??0)<24&&Number(m[8]??0)<60;
}
export function validateProperties<B extends Blueprint>(blueprint:B,input:unknown):DomainProperties[B] {
 const def=definition(blueprint);
 if(!object(input)) throw new Error('INVALID_PROPERTIES');
 const encoded=canonicalJson(input);
 if(new TextEncoder().encode(encoded).byteLength>100_000) throw new Error('RECORD_LIMIT');
 for(const [key,value] of Object.entries(input)) {
  if(!Object.hasOwn(def.properties,key)) throw new Error(`${def.unresolved_properties.some(p=>p.name===key)?'UNRESOLVED_PROPERTY':'UNKNOWN_PROPERTY'}: ${key}`);
  const field=def.properties[key]!;
  if(field.type==='array' ? !Array.isArray(value) : typeof value!==field.type || value===null) throw new Error(`INVALID_PROPERTY: ${key}`);
  if(field.enum && !field.enum.includes(value as string)) throw new Error(`INVALID_ENUM: ${key}`);
  if(field.format==='date-time' && !dateTime(value as string)) throw new Error(`INVALID_DATETIME: ${key}`);
  if(field.format==='email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string)) throw new Error(`INVALID_EMAIL: ${key}`);
  if(field.format==='url') {
   try { const url=new URL(value as string); if(!['http:','https:'].includes(url.protocol)||!url.hostname) throw new Error(); }
   catch { throw new Error(`INVALID_URL: ${key}`); }
  }
 }
 // Shape checked above; JSON clone prevents mutation of caller-owned objects.
 return JSON.parse(encoded) as DomainProperties[B];
}
export type RelationInput=Record<string,string|string[]|null>;
export function validateRelations(blueprint:Blueprint,input:unknown):RelationInput {
 const def=definition(blueprint);
 if(!object(input)) throw new Error('INVALID_RELATIONS');
 canonicalJson(input); let count=0;
 for(const [key,value] of Object.entries(input)) {
  if(!Object.hasOwn(def.relations,key)) throw new Error(`UNKNOWN_RELATION: ${key}`);
  if(def.relations[key]!.cardinality==='many'&&!Array.isArray(value)) throw new Error(`INVALID_CARDINALITY: ${key}`);
  if(def.relations[key]!.cardinality==='one'&&Array.isArray(value)) throw new Error(`INVALID_CARDINALITY: ${key}`);
  const ids=value===null?[]:Array.isArray(value)?value:[value];
  for(const id of ids) boundedString(id,'INVALID_RELATION_ID',512);
  if(new Set(ids).size!==ids.length) throw new Error('DUPLICATE_RELATION');
  count+=ids.length;
 }
 if(count>100) throw new Error('RELATION_LIMIT');
 return JSON.parse(canonicalJson(input)) as RelationInput;
}
export function applyPropertyPatch<B extends Blueprint>(blueprint:B,previous:unknown,changes:unknown,unset:readonly string[]=[]):DomainProperties[B] {
 const base=validateProperties(blueprint,previous), patch=validateProperties(blueprint,changes);
 const out={...base,...patch} as Record<string,unknown>;
 if(unset.length>100||new Set(unset).size!==unset.length) throw new Error('INVALID_UNSET');
 for(const key of unset) {
  if(!Object.hasOwn(definition(blueprint).properties,key)) throw new Error('UNKNOWN_PROPERTY');
  if(Object.hasOwn(patch,key)) throw new Error('AMBIGUOUS_PATCH');
  delete out[key];
 }
 return validateProperties(blueprint,out);
}
export function computeKnown(blueprint: Blueprint, name: string, properties: unknown, nowMs = Date.now()):
 {status:'computed';value:Scalar} | {status:'definition_missing'} | {status:'invalid_input';value:null;issue:string|null} {
 const def = definition(blueprint);
 if (!def.calculations.includes(name)) throw new Error('UNKNOWN_CALCULATION');
 const p = validateProperties(blueprint, properties);
 const result = evaluateCalculation(blueprint, name, p, nowMs);
 if (result.status === 'computed') return {status:'computed', value:result.value};
 if (result.status === 'definition_missing') return {status:'definition_missing'};
 return {status:'invalid_input',value:null,issue:result.issue};
}
/** Lossless source retained; this is a conversion report, not a silent data import. */
export function projectSnapshot(input:unknown) {
 const parsed=parseEntity(input), raw=JSON.parse(parsed.snapshotJson) as {properties:Record<string,Json>;relations?:Record<string,Json>};
 const fields=definition(parsed.blueprint).properties, known:Record<string,Json>=Object.create(null), deferred:Record<string,Json>=Object.create(null), omittedNulls:string[]=[];
 for(const [key,value] of Object.entries(raw.properties)) {
  if(!Object.hasOwn(fields,key)) deferred[key]=value;
  else if(value===null) omittedNulls.push(key);
  else known[key]=value;
 }
 return {blueprint:parsed.blueprint,identifier:parsed.identifier,title:parsed.title,properties:validateProperties(parsed.blueprint,known),
  omittedNulls,deferredProperties:deferred,sourceRelations:raw.relations??{},sourceSnapshotJson:parsed.snapshotJson};
}
