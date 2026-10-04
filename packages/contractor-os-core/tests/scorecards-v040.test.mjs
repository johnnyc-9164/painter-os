import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
let scoring={};try{scoring=await import('../build/shared/scorecards.js');}catch(e){if(e.code!=='ERR_MODULE_NOT_FOUND')throw e;}
function evaluate(bp,p){assert.equal(typeof scoring.evaluateScorecards,'function','scorecard evaluator must exist');return scoring.evaluateScorecards(bp,p);}
test('v040: prior client health predicates are executed without inferring business approval',()=>{
 const [r]=evaluate('co_client',{email:'test@example.test',phone:'synthetic',client_type:'commercial',address:'synthetic',status:'active'});
 assert.equal(r.rulesTested,3);assert.equal(r.rulesPassed,3);assert.equal(r.percentPassed,100);assert.equal(r.authorizesAction,false);
 assert.equal(r.levels.find(x=>x.title==='Basic').status,'untested');
});
test('v040: missing scorecard predicates cannot yield a passing grade',()=>{
 const results=evaluate('co_trade_spec',{trade:'painting',number_of_coats:2});assert.equal(results.length,9);
 for(const r of results){assert.equal(r.status,'definition_missing');assert.equal(r.percentPassed,null);assert.equal(r.rulesTested,0);}
});
test('v040: titles do not replace actual predicates',()=>{
 const [r]=evaluate('co_contract',{signed_at:'2026-09-22T00:00:00Z',contract_type:'lump_sum',status:'draft'});
 assert.equal(r.rules.find(x=>x.identifier==='contract_completeness_cc_silver').result,'Passed');
 assert.equal(r.authorizesAction,false); // Source title says Fully Executed; predicate does NOT test status.
});
test('v040: every one of the 22 source rules is retained in the evaluator',()=>{
 const source=JSON.parse(readFileSync(new URL('../docs/scorecard-definitions.json',import.meta.url),'utf8'));
 const got=source.scorecards.flatMap(s=>evaluate(s.properties.blueprint,{}).flatMap(r=>r.rules.map(x=>x.identifier)));
 assert.equal(new Set(got).size,22);for(const r of source.rules)assert.ok(got.includes(r.identifier));
});
test('v040: unknown query operators fail closed',()=>{
 assert.equal(typeof scoring.evaluateRuleQuery,'function');
 assert.equal(scoring.evaluateRuleQuery({combinator:'and',conditions:[{operator:'run_code',property:'x'}]},{x:true}).result,'Unknown');
});
test('v040: numbers and booleans are not coerced from strings',()=>{
 assert.equal(typeof scoring.evaluateRuleQuery,'function');
 const q={combinator:'and',conditions:[{operator:'=',property:'insurance_verified',value:true}]};
 assert.equal(scoring.evaluateRuleQuery(q,{insurance_verified:'true'}).result,'Not passed');
});
test('v040: zero is present, not an empty monetary value',()=>{
 const [r]=evaluate('co_proposal',{amount:0,status:'draft'});assert.equal(r.rules.find(x=>x.identifier.endsWith('_bronze')).result,'Passed');
});
