/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as backend from "../backend.js";
import type * as contractorOs from "../contractorOs.js";
import type * as memberships from "../memberships.js";
import type * as trades from "../trades.js";
import type * as typedRecords from "../typedRecords.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  backend: typeof backend;
  contractorOs: typeof contractorOs;
  memberships: typeof memberships;
  trades: typeof trades;
  typedRecords: typeof typedRecords;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  contractorOs: import("../../../src/component/_generated/component.js").ComponentApi<"contractorOs">;
  contractorPainting: import("../../../src/trades/painting/component/_generated/component.js").ComponentApi<"contractorPainting">;
  contractorPlumbing: import("../../../src/trades/plumbing/component/_generated/component.js").ComponentApi<"contractorPlumbing">;
  contractorRoofing: import("../../../src/trades/roofing/component/_generated/component.js").ComponentApi<"contractorRoofing">;
  contractorGarageDoor: import("../../../src/trades/garage_door/component/_generated/component.js").ComponentApi<"contractorGarageDoor">;
  contractorElectrical: import("../../../src/trades/electrical/component/_generated/component.js").ComponentApi<"contractorElectrical">;
  contractorHvac: import("../../../src/trades/hvac/component/_generated/component.js").ComponentApi<"contractorHvac">;
  contractorConcrete: import("../../../src/trades/concrete/component/_generated/component.js").ComponentApi<"contractorConcrete">;
  contractorLandscaping: import("../../../src/trades/landscaping/component/_generated/component.js").ComponentApi<"contractorLandscaping">;
  contractorDrywallFraming: import("../../../src/trades/drywall_framing/component/_generated/component.js").ComponentApi<"contractorDrywallFraming">;
};
