#!/usr/bin/env python3
"""Regenerate typed domain files from the checked-in source summary manifest.
Run with --check for a read-only drift check. Does not modify a live database.
"""
from pathlib import Path
import json, sys
root=Path(__file__).resolve().parents[1]
manifest=json.loads((root/'model/blueprints.summary.json').read_text())['blueprints']
relations={bp:{k:r['target'] for k,r in d['relations'].items()} for bp,d in manifest.items()}
checking='--check' in sys.argv
changed=[]
def emit(path, text):
    if not path.exists() or path.read_text()!=text:
        changed.append(str(path.relative_to(root)))
        if not checking:
            path.parent.mkdir(parents=True,exist_ok=True)
            path.write_text(text)
# Extend prior catalog, preserving existing workflow contracts exactly.
p=root/'src/shared/model.ts'; old=p.read_text(); tail=old[old.index('export const WORKFLOW_CONTRACTS'):]
emit(p,'// Blueprint identities and relation targets from the supplied summary. Workflow inputs from the prior export.\nexport const BLUEPRINTS = '+json.dumps(sorted(manifest),indent=2)+' as const;\nexport type Blueprint = typeof BLUEPRINTS[number];\nexport const RELATION_TARGETS: Record<string, Record<string,string>> = '+json.dumps(relations,indent=2)+';\n'+tail)
# Statically typed property interfaces, never pretend uncertain grouped fields are known.
props=['import type { Json } from "./port.js";\nexport interface DomainProperties {']
for bp,d in manifest.items():
 props.append(f'  {bp}: {{')
 for name,p in d['properties'].items():
  typ=' | '.join(json.dumps(s) for s in p['enum']) if 'enum' in p else {'string':'string','number':'number','boolean':'boolean','array':'Json[]'}[p['type']]
  props.append(f'    {name}?: {typ};')
 props.append('  };')
props.append('}\nexport interface DomainRelations {')
for bp,d in manifest.items():
 props.append(f'  {bp}: {{')
 for name,r in d['relations'].items(): props.append(f'    {name}?: '+('string[]' if r['cardinality']=='many' else 'string | null')+';')
 props.append('  };')
props.append('}\n')
emit(root/'src/shared/domainTypes.ts','\n'.join(props))
# Convex runtime validators, one per known field, IDs typed to component-owned tables.
vs=['import { v } from "convex/values";','export const domainProperties = {']
for bp,d in manifest.items():
 vs.append(f'  {bp}: v.object({{')
 for name,p in d['properties'].items():
  val='v.union('+', '.join('v.literal('+json.dumps(s)+')' for s in p['enum'])+')' if 'enum' in p else {'string':'v.string()','number':'v.number()','boolean':'v.boolean()','array':'v.array(v.any())'}[p['type']]
  vs.append(f'    {name}: v.optional({val}),')
 vs.append('  }),')
vs.append('};\nexport const domainRelations = {')
for bp,d in manifest.items():
 vs.append(f'  {bp}: v.object({{')
 for name,r in d['relations'].items():
  idval=f'v.id("{r["target"]}")'; val=f'v.array({idval})' if r['cardinality']=='many' else f'v.union({idval}, v.null())'
  vs.append(f'    {name}: v.optional({val}),')
 vs.append('  }),')
vs.append('};\n')
emit(root/'src/component/domainValidators.ts','\n'.join(vs))
# Common envelope reflects implementation design; never claimed to be supplied fields.
tables=['import { defineTable } from "convex/server";','import { v } from "convex/values";','import { domainProperties, domainRelations } from "./domainValidators.js";',
 'export const domainEnvelope = { tenantId: v.string(), identifier: v.string(), title: v.union(v.string(),v.null()), revision: v.number(), createdAt: v.number(), updatedAt: v.number(), lastEventId: v.id("domainEvents") };',
 'export const domainTables = {']
for bp,d in manifest.items():
 indices='.index("by_tenant_identifier", ["tenantId","identifier"]).index("by_tenant", ["tenantId"])'
 for status in ['status','stage']:
  if status in d['properties']: indices+=f'.index("by_tenant_{status}", ["tenantId", "properties.{status}"])'
 for relation,rel in d['relations'].items():
  if rel['cardinality']=='one': indices+=f'.index("by_tenant_{relation}", ["tenantId", "relations.{relation}"])'
 tables.append(f'  {bp}: defineTable({{...domainEnvelope, properties: domainProperties.{bp}, relations: domainRelations.{bp}}}){indices},')
tables.append('};\n')
emit(root/'src/component/domainTables.ts','\n'.join(tables))
# Upgrade legacy boundary validator.
p=root/'src/component/validators.ts';s=p.read_text();start=s.index('export const blueprint');end=s.index('export const entityView')
s=s[:start]+'export const blueprint = v.union('+', '.join('v.literal('+json.dumps(bp)+')' for bp in sorted(manifest))+');\n'+s[end:];emit(p,s)

template='''// Generated for __BP__. Property rules are source-derived; envelope and safety controls are implementation policy.
import { v, ConvexError } from 'convex/values';
import { paginationOptsValidator } from 'convex/server';
import { paginator } from 'convex-helpers/server/pagination';
import { query, mutation } from '../_generated/server.js';
import schema from '../schema.js';
import { domainProperties, domainRelations } from '../domainValidators.js';
import { domainEnvelope } from '../domainTables.js';
import { boundedString, canonicalJson } from '../../shared/port.js';
import { validateProperties, validateRelations, applyPropertyPatch } from '../../shared/domain.js';
import { checkRead, checkWrite, checkPage, checkRevision, checkLinks, priorRequest, appendEvent } from '../domainRuntime.js';
import { guardMaintenance } from '../../shared/businessPolicy.js';
const props=domainProperties.__BP__, rels=domainRelations.__BP__;
const document=v.object({...domainEnvelope,_id:v.id('__BP__'),_creationTime:v.number(),properties:props,relations:rels});
const receipt=v.object({id:v.id('__BP__'),revision:v.number(),eventId:v.id('domainEvents'),replayed:v.boolean()});
export const get=query({
 args:{tenantId:v.string(),identifier:v.string()},returns:v.union(document,v.null()),
 handler:async(ctx,args)=>{checkRead(args.tenantId);boundedString(args.identifier,'INVALID_IDENTIFIER');
  return ctx.db.query('__BP__').withIndex('by_tenant_identifier',q=>q.eq('tenantId',args.tenantId).eq('identifier',args.identifier)).unique();},
});
export const list=query({
 args:{tenantId:v.string(),paginationOpts:paginationOptsValidator},returns:v.object({page:v.array(document),isDone:v.boolean(),continueCursor:v.string()}),
 handler:async(ctx,args)=>{checkRead(args.tenantId);checkPage(args.paginationOpts.numItems);
  const page=await paginator(ctx.db,schema).query('__BP__').withIndex('by_tenant',q=>q.eq('tenantId',args.tenantId)).paginate(args.paginationOpts);
  return {page:page.page,isDone:page.isDone,continueCursor:page.continueCursor};},
});
/** Draft/data maintenance only. Workflow-managed outcomes and balances cannot be set here. */
export const create=mutation({
 args:{tenantId:v.string(),actorId:v.string(),identifier:v.string(),requestKey:v.string(),title:v.optional(v.union(v.string(),v.null())),properties:props,relations:v.optional(rels)},returns:receipt,
 handler:async(ctx,args)=>{
  checkWrite(args);
  const properties=validateProperties('__BP__',args.properties), relations=args.relations??{};
  validateRelations('__BP__',relations);
  const signature=canonicalJson({operation:'create',blueprint:'__BP__',actorId:args.actorId,identifier:args.identifier,title:args.title??null,properties,relations});
  const previous=await priorRequest(ctx,args.tenantId,args.requestKey,signature);
  if(previous){const id=ctx.db.normalizeId('__BP__',previous.entityId);if(!id)throw new ConvexError('INVALID_RECEIPT');return {id,revision:previous.revision,eventId:previous.eventId,replayed:true};}
  const existing=await ctx.db.query('__BP__').withIndex('by_tenant_identifier',q=>q.eq('tenantId',args.tenantId).eq('identifier',args.identifier)).unique();
  if(existing)throw new ConvexError('ENTITY_EXISTS');
  guardMaintenance('__BP__',null,properties,{},relations);
  await checkLinks(ctx,args.tenantId,'__BP__',relations);
  const now=Date.now(),after={identifier:args.identifier,title:args.title??null,properties,relations,revision:1};
  const eventId=await appendEvent(ctx,{tenantId:args.tenantId,actorId:args.actorId,blueprint:'__BP__',identifier:args.identifier,requestKey:args.requestKey,operation:'record.created',before:null,after,at:now});
  const id=await ctx.db.insert('__BP__',{tenantId:args.tenantId,...after,createdAt:now,updatedAt:now,lastEventId:eventId});
  await ctx.db.insert('domainRequests',{tenantId:args.tenantId,requestKey:args.requestKey,signature,entityId:id,eventId,revision:1,createdAt:now});
  return {id,revision:1,eventId,replayed:false};
 },
});
export const update=mutation({
 args:{tenantId:v.string(),actorId:v.string(),identifier:v.string(),requestKey:v.string(),expectedRevision:v.number(),title:v.optional(v.union(v.string(),v.null())),properties:v.optional(props),unsetProperties:v.optional(v.array(v.string())),relations:v.optional(rels),unsetRelations:v.optional(v.array(v.string()))},returns:receipt,
 handler:async(ctx,args)=>{
  checkWrite(args);checkRevision(args.expectedRevision);
  const signature=canonicalJson({operation:'update',blueprint:'__BP__',actorId:args.actorId,identifier:args.identifier,expectedRevision:args.expectedRevision,
   titleSet:args.title!==undefined,title:args.title??null,properties:args.properties??{},unsetProperties:args.unsetProperties??[],relations:args.relations??{},unsetRelations:args.unsetRelations??[]});
  const previous=await priorRequest(ctx,args.tenantId,args.requestKey,signature);
  if(previous){const id=ctx.db.normalizeId('__BP__',previous.entityId);if(!id)throw new ConvexError('INVALID_RECEIPT');return {id,revision:previous.revision,eventId:previous.eventId,replayed:true};}
  const existing=await ctx.db.query('__BP__').withIndex('by_tenant_identifier',q=>q.eq('tenantId',args.tenantId).eq('identifier',args.identifier)).unique();
  if(!existing)throw new ConvexError('ENTITY_NOT_FOUND');
  if(existing.revision!==args.expectedRevision)throw new ConvexError('REVISION_CONFLICT');
  const properties=applyPropertyPatch('__BP__',existing.properties,args.properties??{},args.unsetProperties??[]);
  const relations={...existing.relations,...args.relations};
  const unset=args.unsetRelations??[];
  if(unset.length>100||new Set(unset).size!==unset.length)throw new ConvexError('INVALID_UNSET');
  for(const key of unset){
   if(!Object.hasOwn(rels.fields,key))throw new ConvexError('UNKNOWN_RELATION');
   if(Object.hasOwn(args.relations??{},key))throw new ConvexError('AMBIGUOUS_PATCH');
   delete relations[key as keyof typeof relations];
  }
  await checkLinks(ctx,args.tenantId,'__BP__',relations);
  guardMaintenance('__BP__',existing.properties,properties,existing.relations,relations);
  const revision=existing.revision+1;if(!Number.isSafeInteger(revision))throw new ConvexError('REVISION_LIMIT');
  const now=Date.now(),after={identifier:args.identifier,title:args.title===undefined?existing.title:args.title,properties,relations,revision};
  const before={identifier:existing.identifier,title:existing.title,properties:existing.properties,relations:existing.relations,revision:existing.revision};
  const eventId=await appendEvent(ctx,{tenantId:args.tenantId,actorId:args.actorId,blueprint:'__BP__',identifier:args.identifier,requestKey:args.requestKey,operation:'record.updated',before,after,at:now});
  await ctx.db.patch(existing._id,{...after,updatedAt:now,lastEventId:eventId});
  await ctx.db.insert('domainRequests',{tenantId:args.tenantId,requestKey:args.requestKey,signature,entityId:existing._id,eventId,revision,createdAt:now});
  return {id:existing._id,revision,eventId,replayed:false};
 },
});
'''
# Do not introspect a library validator in business logic; use source descriptor instead.
template=template.replace('applyPropertyPatch }','applyPropertyPatch, definition }').replace('Object.hasOwn(rels.fields,key)',"Object.hasOwn(definition('__BP__').relations,key)")
for bp in manifest:emit(root/f'src/component/records/{bp}.ts',template.replace('__BP__',bp))
# Client API deliberately enumerates refs: no type erasure of the generated component API.
client='''import type { GenericDataModel, GenericMutationCtx, GenericQueryCtx, PaginationOptions } from 'convex/server';
import type { ComponentApi } from './component/_generated/component.js';
import type { MembershipResolver } from './client.js';
import type { DomainProperties, DomainRelations } from './shared/domainTypes.js';
import type { Blueprint } from './shared/model.js';
import { requireScope, type Permission } from './shared/port.js';
export type CreateRecord<B extends Blueprint>={identifier:string;requestKey:string;title?:string|null;properties:DomainProperties[B];relations?:DomainRelations[B]};
export type UpdateRecord<B extends Blueprint>={identifier:string;requestKey:string;expectedRevision:number;title?:string|null;properties?:DomainProperties[B];unsetProperties?:(keyof DomainProperties[B])[];relations?:DomainRelations[B];unsetRelations?:(keyof DomainRelations[B])[]};
/** Server-side wrapper. The parent application is responsible for selecting a verified membership. */
export class TypedContractorOS<D extends GenericDataModel> {
 constructor(private readonly component:ComponentApi,private readonly membership:MembershipResolver<D>){}
 private async scope(ctx:GenericQueryCtx<D>,permission:Permission){
  const identity=await ctx.auth.getUserIdentity();
  return requireScope(identity,permission,identity?await this.membership(ctx,identity):null);
 }
'''
for bp in manifest:
 client+=f''' readonly {bp}={{
  get:async(ctx:GenericQueryCtx<D>,identifier:string)=>{{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.{bp}.get,{{tenantId:s.tenantId,identifier}});}},
  list:async(ctx:GenericQueryCtx<D>,paginationOpts:PaginationOptions)=>{{const s=await this.scope(ctx,'read');return ctx.runQuery(this.component.records.{bp}.list,{{tenantId:s.tenantId,paginationOpts}});}},
  create:async(ctx:GenericMutationCtx<D>,args:CreateRecord<'{bp}'>)=>{{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.{bp}.create,{{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,properties:args.properties,
    ...(args.title===undefined?{{}}:{{title:args.title}}),...(args.relations===undefined?{{}}:{{relations:args.relations}})}});
  }},
  update:async(ctx:GenericMutationCtx<D>,args:UpdateRecord<'{bp}'>)=>{{
   const s=await this.scope(ctx,'write');
   return ctx.runMutation(this.component.records.{bp}.update,{{tenantId:s.tenantId,actorId:s.actorId,identifier:args.identifier,requestKey:args.requestKey,expectedRevision:args.expectedRevision,
    ...(args.title===undefined?{{}}:{{title:args.title}}),...(args.properties===undefined?{{}}:{{properties:args.properties}}),...(args.unsetProperties===undefined?{{}}:{{unsetProperties:args.unsetProperties}}),
    ...(args.relations===undefined?{{}}:{{relations:args.relations}}),...(args.unsetRelations===undefined?{{}}:{{unsetRelations:args.unsetRelations}})}});
  }}
 }};
'''
client+='}\n';emit(root/'src/domainClient.ts',client)

emit(root/'src/shared/domainManifest.ts', '// Generated from the checked-in source manifest.\nexport const DOMAIN_MANIFEST = '+json.dumps(manifest,indent=2)+' as const;\n')
supp=json.loads((root/'model/schema-supplement.json').read_text())
emit(root/'src/shared/derivedManifest.ts', '// Source formulas and explicit component path policies; never eval these strings.\nexport const DERIVED_MANIFEST = '+json.dumps(supp,indent=2)+' as const;\n')

scorecards=json.loads((root/'docs/scorecard-definitions.json').read_text())
emit(root/'src/shared/scorecardManifest.ts', '// Historical exported scorecard definitions and predicates, not current Port execution results.\nexport const SCORECARD_SNAPSHOT = '+json.dumps(scorecards,indent=2)+' as const;\n')

# Table-specific reverse lookups keep SDK index types visible (no any-typed query dispatch).
store=["// Generated from explicit aggregate paths. This is application code, not Convex SDK codegen.",
 "import type { QueryCtx } from './_generated/server.js';",
 "import { ConvexError } from 'convex/values';",
 "import { unpack } from './businessRecords.js';",
 "import type { ProjectionReader } from '../shared/projections.js';",
 "import type { StoredRecord } from '../shared/businessTypes.js';",
 "export function projectionReader(ctx: QueryCtx, tenantId: string): ProjectionReader {",
 " return {",
 "  async byId(blueprint, localId) { const id = ctx.db.normalizeId(blueprint, localId); return id ? unpack(blueprint, await ctx.db.get(id), tenantId) : null; },",
 "  async incoming(blueprint, relation, sourceId, limit) {",
 "   if (!Number.isInteger(limit) || limit < 1 || limit > 51) throw new ConvexError('INVALID_AGGREGATE_LIMIT');",
 "   switch (`${blueprint}:${relation}`) {"]
paths={ (a['target'],a['pathPolicy']['relation']) for defs in supp['aggregates'].values() for a in defs.values() if a['pathPolicy']['kind']=='incoming_single' }
for target,relation in sorted(paths):
 source=manifest[target]['relations'][relation]['target']
 store.extend([f"    case '{target}:{relation}': {{",
 f"     const id = ctx.db.normalizeId('{source}', sourceId); if (!id) return [];",
 f"     const rows = await ctx.db.query('{target}').withIndex('by_tenant_{relation}', q => q.eq('tenantId', tenantId).eq('relations.{relation}', id)).take(limit);",
 f"     return rows.map(row => unpack('{target}', row, tenantId)).filter((row): row is StoredRecord => row !== null);",
 "    }"])
store.extend(["    default: throw new ConvexError('UNKNOWN_AGGREGATE_PATH');", "   }", "  }", " };", "}", ""])
emit(root/'src/component/projectionStore.ts', '\n'.join(store))

from generate_trades import generate as generate_trades
generate_trades(checking)

if checking and changed:
    print('Generated files differ: '+', '.join(changed));sys.exit(1)
print('Generated-file check passed.' if checking else 'Generated files updated: '+str(len(changed)))
