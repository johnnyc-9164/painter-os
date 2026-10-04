import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('nine independently installable trade components exist',()=>{
 const trades=['painting','plumbing','roofing','garage_door','electrical','hvac','concrete','landscaping','drywall_framing'];
 for(const trade of trades) assert.ok(fs.existsSync(`src/trades/${trade}/component/convex.config.ts`),`${trade} missing`);
});
import {validateTrade,patchTrade,validateCoreReferences} from '../build/shared/tradeValidation.js';
import {TRADE_FIELDS} from '../build/shared/tradeManifest.js';
import {execFileSync} from 'node:child_process';
test('exact nine source trades and 52 fields accounted for',()=>{
 const source=JSON.parse(fs.readFileSync('model/blueprints.summary.json')).blueprints.co_trade_spec.properties;
 assert.deepEqual(Object.keys(TRADE_FIELDS),source.trade.enum);
 assert.deepEqual([...new Set(Object.values(TRADE_FIELDS).flat())].sort(),Object.keys(source).sort());
});
test('every trade accepts empty optional shape and rejects foreign fields',()=>{
 for(const trade of Object.keys(TRADE_FIELDS)){
  assert.deepEqual(validateTrade(trade,{}),{});
  assert.deepEqual(validateTrade(trade,{trade}),{trade});
  assert.throws(()=>validateTrade(trade,{trade:trade==='painting'?'roofing':'painting'}),/TRADE_MISMATCH/);
  const foreign=trade==='roofing'?{paint_finish:'flat'}:{roof_type:'metal'};
  assert.throws(()=>validateTrade(trade,foreign),/WRONG_TRADE_FIELD/);
  assert.throws(()=>patchTrade(trade,{}, {},[Object.keys(foreign)[0]]),/WRONG_TRADE_FIELD/);
 }
});
test('shared fixture and height applicability preserved',()=>{
 for(const t of ['electrical','plumbing']) assert.deepEqual(validateTrade(t,{fixture_count:0}),{fixture_count:0});
 for(const t of ['painting','drywall_framing']) assert.deepEqual(validateTrade(t,{ceiling_height_ft:8}),{ceiling_height_ft:8});
 assert.throws(()=>validateTrade('painting',{paint_finish:'imaginary'}),/INVALID_ENUM/);
 assert.throws(()=>patchTrade('painting',{number_of_coats:2},{number_of_coats:1},['number_of_coats']),/AMBIGUOUS_PATCH/);
 assert.deepEqual(patchTrade('painting',{number_of_coats:2},{},['number_of_coats']),{});
});
test('reference shape rejects caller-added claims and invalid strings',()=>{
 assert.deepEqual(validateCoreReferences({scope:'scope-external'}),{scope:'scope-external'});
 assert.throws(()=>validateCoreReferences({tenantId:'victim'}),/UNKNOWN_CORE_REFERENCE/);
 assert.throws(()=>validateCoreReferences({scope:''}),/INVALID_CORE_REFERENCE/);
});
test('IR rejects unsupported trade, source drift, missing fields and contradictory applicability',()=>{
 execFileSync('python3',['-c',`
import copy,json,sys
sys.path.insert(0,'tools')
from generate_trades import validate_ir
ir=json.load(open('model/trades.ir.json'));source=json.load(open('model/blueprints.summary.json'))
validate_ir(ir,source)
for mode in range(4):
 bad=copy.deepcopy(ir)
 if mode==0:bad['trades']['options']=bad['trades'].pop('painting')
 if mode==1:bad['fields']['trade']['definition']['required']=True
 if mode==2:del bad['fields']['fixture_count']
 if mode==3:bad['fields']['fixture_count']['appliesTo']=['painting']
 try:validate_ir(bad,source)
 except AssertionError:continue
 raise Exception('invalid IR accepted')
`]);
});
