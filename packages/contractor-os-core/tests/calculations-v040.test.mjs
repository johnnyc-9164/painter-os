import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
let calc={};
try { calc=await import('../build/shared/calculations.js'); } catch(e) { if(e.code!=='ERR_MODULE_NOT_FOUND') throw e; }
const specs=JSON.parse(readFileSync(new URL('../model/schema-supplement.json',import.meta.url),'utf8'));
const now=Date.parse('2026-09-22T00:00:00Z');
function evaluate(bp,name,p){assert.equal(typeof calc.evaluateCalculation,'function','calculation evaluator must exist');return calc.evaluateCalculation(bp,name,p,now);}
const cases=[
 ['co_change_order','total_change',{},0],['co_change_order','total_change',{labor_change:-100,materials_change:25},-75],
 ['co_scope','total_estimated_cost',{estimated_labor_cost:125.5,estimated_materials_cost:25},150.5],
 ['co_contract','contract_duration_days',{start_date:'2026-09-22T00:00:00Z',end_date:'2026-09-24T23:59:59Z'},2],
 ['co_contract','contract_duration_days',{},null],
 ['co_contract','retainage_amount',{amount:1000,retainage_percent:10},100],
 ['co_job','billing_variance',{contract_amount:1000,percent_complete:50,billed_to_date:400},-100],
 ['co_job','outstanding_balance',{contract_amount:1000,collected_to_date:100},900],
 ['co_trade_spec','estimated_gallons',{trade:'painting',measurement_value:351,number_of_coats:2},3],
 ['co_trade_spec','estimated_gallons',{trade:'painting',measurement_value:351,number_of_coats:0},0],
 ['co_trade_spec','estimated_gallons',{trade:'painting',measurement_value:351},2],
 ['co_trade_spec','estimated_gallons',{trade:'roofing',measurement_value:351},null],
 ['co_trade_spec','estimated_squares',{trade:'roofing',measurement_value:101},2],
 ['co_trade_spec','estimated_squares',{trade:'painting',measurement_value:101},null],
 ['co_pricing_rule','effective_rate',{base_rate:100,overhead_percent:10,profit_margin_percent:20},132],
 ['co_pricing_rule','material_multiplier',{material_markup_percent:25},1.25],
 ['co_contact','full_name',{first_name:'Test',last_name:'Person'},'Test Person'],
 ['co_contact','full_name',{},' '],['co_contact','full_name',{first_name:'Test'},'Test '],
 ['co_subcontractor','compliance_status',{},'unknown'],
 ['co_subcontractor','compliance_status',{insurance_expiry:'2026-08-01T00:00:00Z'},'unknown'],
 ['co_subcontractor','compliance_status',{insurance_expiry:'2026-09-21T23:59:59Z',license_expiry:'2027-01-01T00:00:00Z'},'expired'],
 ['co_subcontractor','compliance_status',{insurance_expiry:'2026-09-22T00:00:00Z',license_expiry:'2027-01-01T00:00:00Z'},'expiring_soon'],
 ['co_subcontractor','compliance_status',{insurance_expiry:'2026-10-22T00:00:00Z',license_expiry:'2027-01-01T00:00:00Z'},'compliant'],
 ['co_subcontractor','insurance_days_remaining',{insurance_expiry:'2026-09-21T23:59:59Z'},-1],
 ['co_subcontractor','license_days_remaining',{},null],
 ['co_subcontractor','license_days_remaining',{license_expiry:'2026-10-22T00:00:00Z'},30],
 ['co_invoice','balance_due',{amount:100,amount_paid:40},60],
 ['co_invoice','balance_due',{amount:100,amount_paid:null},100],
 ['co_bid','days_until_deadline',{submission_deadline:'2026-09-21T23:59:59Z'},-1],
 ['co_bid','days_until_deadline',{},null],
];
for(const [i,[bp,name,p,expected]] of cases.entries())test(`v040 formula ${i}: ${bp}.${name}`,()=>{
 const actual=evaluate(bp,name,p);assert.equal(actual.status,'computed');
 if(typeof expected==='number')assert.ok(Math.abs(actual.value-expected)<1e-9);else assert.equal(actual.value,expected);
 // Run the exact supplied JQ formula as an independent oracle. Freeze only the now token.
 const expression=specs.calculations[bp][name].replace(/\bnow\b/g,`(${now/1000})`);
 const jq=spawnSync('jq',['-c',expression],{input:JSON.stringify({properties:p}),encoding:'utf8'});
 assert.equal(jq.status,0,jq.stderr);assert.deepEqual(actual.value,JSON.parse(jq.stdout));
});
test('v040 formulas report a JQ date-format conflict rather than silently normalizing an offset',()=>{
 assert.equal(evaluate('co_bid','days_until_deadline',{submission_deadline:'2026-09-22T01:00:00+01:00'}).status,'invalid_input');
});
test('v040 formulas fail closed on a missing non-defaulted amount',()=>{
 assert.equal(evaluate('co_invoice','balance_due',{}).status,'invalid_input');
});
test('v040 formulas do not execute unknown expression names',()=>{
 assert.equal(evaluate('co_job','arbitrary_code',{}).status,'definition_missing');
});
test('v040 formula time requires a finite, valid epoch',()=>{
 assert.equal(typeof calc.evaluateCalculation,'function');assert.throws(()=>calc.evaluateCalculation('co_bid','days_until_deadline',{},NaN),/INVALID_AS_OF/);
});
