#!/usr/bin/env node
/** Local-only conversion review. Never calls a deployment or loses unmapped values. */
import { readFile, writeFile } from 'node:fs/promises';
import { projectSnapshot, definition } from '../build/shared/domain.js';
const [input,output]=process.argv.slice(2);
if(!input||!output){console.error('Usage: npm run build:core && node tools/review_typed_import.mjs <entity-array.json> <review.json>');process.exit(2);}
try {
 const raw=JSON.parse(await readFile(input,'utf8'));if(!Array.isArray(raw))throw Error('Expected a JSON array');
 const records=raw.map(projectSnapshot),known=new Set(records.map(r=>JSON.stringify([r.blueprint,r.identifier]))),missing=[];
 for(const row of records)for(const [relation,value] of Object.entries(row.sourceRelations)){
  const expected=definition(row.blueprint).relations[relation]?.target;
  for(const ref of value===null?[]:Array.isArray(value)?value:[value]){
   const target=ref.blueprint??expected;
   if(expected&&ref.blueprint&&ref.blueprint!==expected)throw Error(`Conflicting relation target blueprint at ${row.blueprint}.${relation}`);
   if(!target||!known.has(JSON.stringify([target,ref.identifier])))missing.push({sourceBlueprint:row.blueprint,sourceIdentifier:row.identifier,relation,targetBlueprint:target??null,targetIdentifier:ref.identifier});
  }
 }
 const report={kind:'offline_typed_conversion_review_not_live_import',version:'0.2.0',inputRecords:raw.length,
  snapshotValuesPreserved:false,
  knownPropertyValues:records.reduce((n,r)=>n+Object.keys(r.properties).length,0),omittedNullProperties:records.reduce((n,r)=>n+r.omittedNulls.length,0),
  deferredPropertyValues:records.reduce((n,r)=>n+Object.keys(r.deferredProperties).length,0),missingTargetsInSuppliedBatch:missing,
  liveTargetState:'not_checked',records};
 // Value-equivalence ignores object key order, matching the lossless catalog's contract.
 const canonical=(await import('../build/shared/port.js')).canonicalJson;
 report.snapshotValuesPreserved=records.every((r,i)=>r.sourceSnapshotJson===canonical(raw[i]));
 if(!report.snapshotValuesPreserved)throw Error('Snapshot roundtrip failed');
 await writeFile(output,JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({...report,records:undefined,missingTargetsInSuppliedBatch:missing.length},null,2));
}catch(error){console.error(error instanceof Error?error.message:String(error));process.exit(1);}
