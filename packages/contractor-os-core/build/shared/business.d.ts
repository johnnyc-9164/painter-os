import type { BusinessStore, BusinessResult, TrustedBusinessArgs } from './businessTypes.js';
export { minorUnits, guardMaintenance } from './businessPolicy.js';
export type * from './businessTypes.js';
export declare function executeBusinessCommand(store: BusinessStore, args: TrustedBusinessArgs): Promise<BusinessResult>;
