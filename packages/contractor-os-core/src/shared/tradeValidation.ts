import { TRADE_FIELDS, type Trade } from './tradeManifest.js';
import type { TradeProperties, CoreReferences } from './tradeTypes.js';
import { validateProperties } from './domain.js';
import { boundedString, object } from './port.js';
export function validateTrade<T extends Trade>(trade:T,input:unknown):TradeProperties[T] {
 const value=validateProperties('co_trade_spec',input);
 for(const name of Object.keys(value)) if(!(TRADE_FIELDS[trade] as readonly string[]).includes(name)) throw new Error(`WRONG_TRADE_FIELD: ${name}`);
 if(value.trade!==undefined&&value.trade!==trade) throw new Error('TRADE_MISMATCH');
 return value as TradeProperties[T];
}
export function patchTrade<T extends Trade>(trade:T,previous:unknown,changes:unknown,unset:readonly string[]=[]):TradeProperties[T] {
 const result={...validateTrade(trade,previous),...validateTrade(trade,changes)} as Record<string,unknown>;
 if(unset.length>52||new Set(unset).size!==unset.length)throw new Error('INVALID_UNSET');
 for(const key of unset){
  if(!(TRADE_FIELDS[trade] as readonly string[]).includes(key))throw new Error('WRONG_TRADE_FIELD');
  if(Object.hasOwn(changes as object,key))throw new Error('AMBIGUOUS_PATCH');
  delete result[key];
 }
 return validateTrade(trade,result);
}
export function validateCoreReferences(input:unknown):CoreReferences {
 if(!object(input))throw new Error('INVALID_CORE_REFERENCES');
 for(const [key,value] of Object.entries(input)){
  if(key!=='scope'&&key!=='pricing_rule')throw new Error('UNKNOWN_CORE_REFERENCE');
  if(value!==null)boundedString(value,'INVALID_CORE_REFERENCE');
 }
 return {...input} as CoreReferences;
}
