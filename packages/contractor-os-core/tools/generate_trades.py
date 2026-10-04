#!/usr/bin/env python3
"""Compile the explicit contractor trade partition IR. Not a generic Port compiler."""
import json,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
def validate_ir(ir,source):
 assert ir['irVersion']==1 and ir['sourceBlueprint']=='co_trade_spec', 'Unsupported IR'
 properties=source['blueprints']['co_trade_spec']['properties']
 assert set(ir['trades'])==set(properties['trade']['enum']), 'Trade coverage mismatch'
 assert set(ir['fields'])==set(properties), 'Field coverage mismatch'
 names=set()
 for trade,d in ir['trades'].items():
  assert d['componentName'] not in names and d['componentName'].isidentifier(), 'Invalid component identity'
  names.add(d['componentName'])
  assert len(d['fields'])==len(set(d['fields'])) and set(d['fields'])<=set(properties), 'Invalid field partition'
  assert set(ir['commonFields'])<=set(d['fields']), 'Missing shared fields'
 for name,f in ir['fields'].items():
  assert f['sourceBlueprint']=='co_trade_spec' and f['sourceProperty']==name, 'Invalid provenance'
  assert f['definition']==properties[name], 'Source definition drift'
  assert f['applicabilityEvidence'] and f['appliesTo'], 'Missing applicability'
  assert set(f['appliesTo'])=={t for t,d in ir['trades'].items() if name in d['fields']}, 'Applicability mismatch'
 return ir

def generate(check=False):
 ir=validate_ir(json.loads((root/'model/trades.ir.json').read_text()),json.loads((root/'model/blueprints.summary.json').read_text()))
 changed=[]
 def emit(path,text):
  p=root/path
  if not p.exists() or p.read_text()!=text:
   changed.append(path)
   if not check:p.parent.mkdir(parents=True,exist_ok=True);p.write_text(text)
 emit('src/shared/tradeManifest.ts','// Generated from model/trades.ir.json. Applicability includes documented implementation policy.\nexport const TRADE_FIELDS = '+json.dumps({t:d['fields'] for t,d in ir['trades'].items()},indent=2)+' as const;\nexport type Trade = keyof typeof TRADE_FIELDS;\n')
 types=['import type { DomainProperties } from "./domainTypes.js";','export interface TradeProperties {']
 for t,d in ir['trades'].items():types.append(f' {t}: Pick<DomainProperties["co_trade_spec"], '+ ' | '.join(json.dumps(f) for f in d['fields'] if f!='trade')+f'> & {{trade?: "{t}"}};')
 types+=['}','export interface CoreReferences { scope?: string | null; pricing_rule?: string | null; }','// Reference strings are stable external identifiers in the core instance bound to the server client.','']
 emit('src/shared/tradeTypes.ts','\n'.join(types))
 for trade,d in ir['trades'].items():
  base=f'src/trades/{trade}/component'
  emit(base+'/tsconfig.json',json.dumps({'extends':'../../../../tsconfig.json','include':['./**/*.ts']},indent=2)+'\n')
  emit(base+'/convex.config.ts',f'import {{ defineComponent }} from "convex/server";\nexport default defineComponent("{d["componentName"]}");\n')
  validators=['// Generated. All source fields remain optional.','import { v } from "convex/values";','export const properties = v.object({']
  for name in d['fields']:
   f=ir['fields'][name]['definition']
   val=f'v.literal("{trade}")' if name=='trade' else ('v.union('+','.join('v.literal('+json.dumps(e)+')' for e in f['enum'])+')' if 'enum' in f else {'string':'v.string()','number':'v.number()','boolean':'v.boolean()'}[f['type']])
   validators.append(f' {name}: v.optional({val}),')
  validators+=['});','export const coreReferences = v.object({scope:v.optional(v.union(v.string(),v.null())),pricing_rule:v.optional(v.union(v.string(),v.null()))});','export const fields = {tenantId:v.string(),identifier:v.string(),title:v.union(v.string(),v.null()),properties,coreReferences,revision:v.number(),createdAt:v.number(),updatedAt:v.number()};','export const document = v.object({...fields,_id:v.id("specs"),_creationTime:v.number()});','export const receipt = v.object({id:v.id("specs"),revision:v.number(),replayed:v.boolean()});','']
  emit(base+'/validators.ts','\n'.join(validators))
  emit(base+'/schema.ts','''import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { fields } from "./validators.js";
export default defineSchema({
 specs:defineTable(fields).index("by_tenant_identifier",["tenantId","identifier"]).index("by_tenant",["tenantId"]),
 requests:defineTable({tenantId:v.string(),requestKey:v.string(),signature:v.string(),id:v.id("specs"),revision:v.number()}).index("by_tenant_request",["tenantId","requestKey"]),
 events:defineTable({tenantId:v.string(),actorId:v.string(),identifier:v.string(),requestKey:v.string(),operation:v.union(v.literal("create"),v.literal("update")),beforeJson:v.union(v.string(),v.null()),afterJson:v.string(),occurredAt:v.number()}).index("by_tenant_identifier",["tenantId","identifier"]),
});
''')
  emit(base+'/records.ts',(root/'tools/templates/trade-records.ts.txt').read_text().replace('__TRADE__',trade))
  emit(f'src/trades/{trade}/test.ts','''/// <reference types="vite/client" />
import type {TestConvex} from 'convex-test';
import type {GenericSchema,SchemaDefinition} from 'convex/server';
import schema from './component/schema.js';
const modules=import.meta.glob('./component/**/*.ts');
export function register(t:TestConvex<SchemaDefinition<GenericSchema,boolean>>,name='''+json.dumps(d['componentName'])+''') {t.registerComponent(name,schema,modules);}
export default {register,schema,modules};
''')
  emit(f'src/trades/{trade}/client.ts',(root/'tools/templates/trade-client.ts.txt').read_text().replace('__TRADE__',trade).replace('__CLASS__',''.join(s.title() for s in trade.split('_'))+'Client'))
 if check and changed:raise SystemExit('Trade generated drift: '+', '.join(changed))
 print('Trade IR validated; '+str(len(ir['trades']))+' components; '+str(len(ir['fields']))+' source fields; '+('no drift' if check else str(len(changed))+' files generated'))
if __name__=='__main__':generate('--check' in sys.argv)
