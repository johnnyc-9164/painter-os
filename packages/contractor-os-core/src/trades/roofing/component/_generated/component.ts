/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    records: {
      create: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          coreReferences?: {
            pricing_rule?: string | null;
            scope?: string | null;
          };
          identifier: string;
          properties: {
            decking_replacement?: boolean;
            gutter_work?: boolean;
            layers_to_remove?: number;
            materials_spec?: string;
            measurement_unit?:
              | "sq_ft"
              | "linear_ft"
              | "units"
              | "squares"
              | "tons"
              | "cubic_yards"
              | "lf";
            measurement_value?: number;
            permit_number?: string;
            permit_required?: boolean;
            roof_pitch?: "flat" | "low" | "medium" | "steep";
            roof_type?:
              | "asphalt_shingle"
              | "metal"
              | "tile"
              | "flat_tpo"
              | "flat_epdm"
              | "slate"
              | "cedar_shake"
              | "other";
            skylight_count?: number;
            special_requirements?: string;
            trade?: "roofing";
          };
          requestKey: string;
          tenantId: string;
          title?: string | null;
        },
        { id: string; replayed: boolean; revision: number },
        Name
      >;
      get: FunctionReference<
        "query",
        "internal",
        { identifier: string; tenantId: string },
        {
          _creationTime: number;
          _id: string;
          coreReferences: {
            pricing_rule?: string | null;
            scope?: string | null;
          };
          createdAt: number;
          identifier: string;
          properties: {
            decking_replacement?: boolean;
            gutter_work?: boolean;
            layers_to_remove?: number;
            materials_spec?: string;
            measurement_unit?:
              | "sq_ft"
              | "linear_ft"
              | "units"
              | "squares"
              | "tons"
              | "cubic_yards"
              | "lf";
            measurement_value?: number;
            permit_number?: string;
            permit_required?: boolean;
            roof_pitch?: "flat" | "low" | "medium" | "steep";
            roof_type?:
              | "asphalt_shingle"
              | "metal"
              | "tile"
              | "flat_tpo"
              | "flat_epdm"
              | "slate"
              | "cedar_shake"
              | "other";
            skylight_count?: number;
            special_requirements?: string;
            trade?: "roofing";
          };
          revision: number;
          tenantId: string;
          title: string | null;
          updatedAt: number;
        } | null,
        Name
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          paginationOpts: {
            cursor: string | null;
            endCursor?: string | null;
            id?: number;
            maximumBytesRead?: number;
            maximumRowsRead?: number;
            numItems: number;
          };
          tenantId: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            coreReferences: {
              pricing_rule?: string | null;
              scope?: string | null;
            };
            createdAt: number;
            identifier: string;
            properties: {
              decking_replacement?: boolean;
              gutter_work?: boolean;
              layers_to_remove?: number;
              materials_spec?: string;
              measurement_unit?:
                | "sq_ft"
                | "linear_ft"
                | "units"
                | "squares"
                | "tons"
                | "cubic_yards"
                | "lf";
              measurement_value?: number;
              permit_number?: string;
              permit_required?: boolean;
              roof_pitch?: "flat" | "low" | "medium" | "steep";
              roof_type?:
                | "asphalt_shingle"
                | "metal"
                | "tile"
                | "flat_tpo"
                | "flat_epdm"
                | "slate"
                | "cedar_shake"
                | "other";
              skylight_count?: number;
              special_requirements?: string;
              trade?: "roofing";
            };
            revision: number;
            tenantId: string;
            title: string | null;
            updatedAt: number;
          }>;
        },
        Name
      >;
      update: FunctionReference<
        "mutation",
        "internal",
        {
          actorId: string;
          coreReferences?: {
            pricing_rule?: string | null;
            scope?: string | null;
          };
          expectedRevision: number;
          identifier: string;
          properties?: {
            decking_replacement?: boolean;
            gutter_work?: boolean;
            layers_to_remove?: number;
            materials_spec?: string;
            measurement_unit?:
              | "sq_ft"
              | "linear_ft"
              | "units"
              | "squares"
              | "tons"
              | "cubic_yards"
              | "lf";
            measurement_value?: number;
            permit_number?: string;
            permit_required?: boolean;
            roof_pitch?: "flat" | "low" | "medium" | "steep";
            roof_type?:
              | "asphalt_shingle"
              | "metal"
              | "tile"
              | "flat_tpo"
              | "flat_epdm"
              | "slate"
              | "cedar_shake"
              | "other";
            skylight_count?: number;
            special_requirements?: string;
            trade?: "roofing";
          };
          requestKey: string;
          tenantId: string;
          title?: string | null;
          unsetProperties?: Array<string>;
        },
        { id: string; replayed: boolean; revision: number },
        Name
      >;
    };
  };
