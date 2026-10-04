import test from 'node:test';
import assert from 'node:assert/strict';
let projections={};try{projections=await import('../build/shared/projections.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
const doc=(blueprint,id,properties={},relations={},tenantId='a')=>({blueprint,id,identifier:id,title:id,tenantId,properties,relations,revision:1});
function reader(rows){return {
 async byId(bp,id){return rows.find(r=>r.blueprint===bp&&r.id===id)??null;},
 async incoming(bp,relation,id,limit){return rows.filter(r=>r.blueprint===bp&&r.tenantId==='a'&&r.relations[relation]===id).slice(0,limit);},
};}
async function run(root,rows=[]){assert.equal(typeof projections.projectRecord,'function','read projection must exist');return projections.projectRecord(root,reader(rows),Date.parse('2026-09-22T00:00:00Z'));}
test('v040: multi-hop mirrors follow declared relations',async()=>{
 const c=doc('co_client','c'),l=doc('co_lead','l',{}, {client:'c'}),s=doc('co_scope','s',{trade_type:'painting'},{lead:'l'});
 const t=doc('co_trade_spec','t',{trade:'painting',measurement_value:700,number_of_coats:2},{scope:'s'});
 const r=await run(t,[c,l,s]);assert.equal(r.mirrors.scope_client.value,'c');assert.equal(r.calculations.estimated_gallons.value,4);
});
test('v040: foreign tenant mirror and missing target have the same safe result',async()=>{
 const root=doc('co_contact','p',{}, {client:'c'});
 const missing=await run(root,[]),foreign=await run(root,[doc('co_client','c',{}, {},'b')]);
 assert.deepEqual(foreign.mirrors.client_name,missing.mirrors.client_name);assert.equal(foreign.mirrors.client_name.value,null);
});
test('v040: aggregates deduplicate by ID and keep explicit relationship scope',async()=>{
 const root=doc('co_client','c');const a=doc('co_job','j1',{status:'active'},{client:'c'}),b=doc('co_job','j2',{status:'complete'},{client:'c'});
 const r=await run(root,[a,a,b,doc('co_job','other',{status:'active'},{client:'another'})]);
 assert.equal(r.aggregates.total_jobs.value,2);assert.equal(r.aggregates.active_jobs.value,1);
 assert.equal(r.aggregates.total_jobs.semantics,'component_explicit_paths_v1');
});
test('v040: unfiltered source totals retain draft and voided invoice amounts',async()=>{
 const root=doc('co_job','j',{contract_amount:1000,collected_to_date:100});
 const r=await run(root,[doc('co_invoice','draft',{amount:300,status:'draft'},{job:'j'}),doc('co_invoice','void',{amount:200,status:'voided'},{job:'j'})]);
 assert.equal(r.aggregates.total_invoiced.value,500);assert.equal(r.calculations.outstanding_balance.value,900);
});
test('v040: a capped aggregate returns null, never a partial authoritative total',async()=>{
 const root=doc('co_campaign','camp');const rows=Array.from({length:80},(_,i)=>doc('co_outreach',`o${i}`,{}, {campaign:'camp'}));
 const r=await run(root,rows);assert.equal(r.aggregates.total_outreach_sent.status,'incomplete');assert.equal(r.aggregates.total_outreach_sent.value,null);
});
test('v040: many-side aggregate uses explicit supplied jobs and reports missing targets',async()=>{
 const root=doc('co_subcontractor','s',{}, {jobs:['j','missing']});
 const r=await run(root,[doc('co_job','j')]);assert.equal(r.aggregates.total_jobs.status,'incomplete');assert.equal(r.aggregates.total_jobs.value,null);
});
test('v040: legacy arrays in single relations cannot be silently picked or flattened',async()=>{
 const root=doc('co_contact','p',{}, {client:['a','b']});
 await assert.rejects(run(root,[doc('co_client','a'),doc('co_client','b')]),/INVALID_CARDINALITY/);
});
test('v040: inconsistent incoming links cannot contaminate aggregate values',async()=>{
 assert.equal(typeof projections.projectRecord,'function');
 const root=doc('co_client','c');const bad={async byId(){return null;},async incoming(){return [doc('co_job','bad',{}, {client:'c'},'b')];}};
 const r=await projections.projectRecord(root,bad,0);assert.equal(r.aggregates.total_jobs.status,'incomplete');assert.equal(r.aggregates.total_jobs.value,null);
});
test('v040: no silent conversion between sq_ft and roofing squares',async()=>{
 const root=doc('co_trade_spec','t',{trade:'roofing',measurement_unit:'squares',measurement_value:5});
 const r=await run(root);assert.equal(r.calculations.estimated_squares.value,1);assert.ok(r.warnings.includes('SOURCE_FORMULA_ASSUMES_SQUARE_FEET'));
});

// Exercise every supplied mirror, not just a representative client chain.
const {DERIVED_MANIFEST}=await import('../build/shared/derivedManifest.js');
const {definition}=await import('../build/shared/domain.js');
for(const [bp,paths] of Object.entries(DERIVED_MANIFEST.mirrors))for(const [name,path]of Object.entries(paths)){
 test(`v040: supplied mirror ${bp}.${name} -> ${path}`,async()=>{
  const root=doc(bp,'root'), rows=[];let current=root;
  const segments=path.split('.');
  for(const segment of segments.slice(0,-1)){
   const relation=definition(current.blueprint).relations[segment];assert.ok(relation,path);
   const child=doc(relation.target,`n${rows.length}`);current.relations[segment]=child.id;rows.push(child);current=child;
  }
  const field=segments.at(-1);let expected=current.title;
  if(field!=='$title'){
   const f=definition(current.blueprint).properties[field];assert.ok(f,path);
   expected=f.enum?.[0]??(f.type==='number'?42:f.format==='date-time'?'2026-09-22T00:00:00Z':f.format==='email'?'fixture@example.test':'fixture');
   current.properties[field]=expected;
  }
  const result=await run(root,rows);assert.equal(result.mirrors[name].value,expected);assert.equal(result.mirrors[name].status,'computed');
 });
}
for(const [bp,definitions] of Object.entries(DERIVED_MANIFEST.aggregates))for(const [name,agg]of Object.entries(definitions)){
 test(`v040: declared aggregate path ${bp}.${name}`,async()=>{
  const root=doc(bp,'root'), child=doc(agg.target,'child');
  if(agg.pathPolicy.kind==='incoming_single')child.relations[agg.pathPolicy.relation]=root.id;
  else root.relations[agg.pathPolicy.relation]=[child.id];
  if(agg.property)child.properties[agg.property]=25;
  if(agg.filter)child.properties[agg.filter.property]=agg.filter.equals;
  const r=await run(root,[child]);assert.equal(r.aggregates[name].status,'computed');assert.equal(r.aggregates[name].value,agg.func==='count'?1:25);
 });
}
