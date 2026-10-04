import { type Trade } from './tradeManifest.js';
import type { TradeProperties, CoreReferences } from './tradeTypes.js';
export declare function validateTrade<T extends Trade>(trade: T, input: unknown): TradeProperties[T];
export declare function patchTrade<T extends Trade>(trade: T, previous: unknown, changes: unknown, unset?: readonly string[]): TradeProperties[T];
export declare function validateCoreReferences(input: unknown): CoreReferences;
