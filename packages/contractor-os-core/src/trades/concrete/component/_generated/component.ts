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
            concrete_finish?:
              "broom" | "smooth" | "exposed_aggregate" | "stamped" | "epoxy";
            concrete_type?:
              | "slab"
              | "driveway"
              | "sidewalk"
              | "foundation"
              | "decorative"
              | "stamped";
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
            reinforcement?: "none" | "rebar" | "wire_mesh" | "fiber";
            special_requirements?: string;
            thickness_inches?: number;
            trade?: "concrete";
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
            concrete_finish?:
              "broom" | "smooth" | "exposed_aggregate" | "stamped" | "epoxy";
            concrete_type?:
              | "slab"
              | "driveway"
              | "sidewalk"
              | "foundation"
              | "decorative"
              | "stamped";
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
            reinforcement?: "none" | "rebar" | "wire_mesh" | "fiber";
            special_requirements?: string;
            thickness_inches?: number;
            trade?: "concrete";
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
              concrete_finish?:
                "broom" | "smooth" | "exposed_aggregate" | "stamped" | "epoxy";
              concrete_type?:
                | "slab"
                | "driveway"
                | "sidewalk"
                | "foundation"
                | "decorative"
                | "stamped";
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
              reinforcement?: "none" | "rebar" | "wire_mesh" | "fiber";
              special_requirements?: string;
              thickness_inches?: number;
              trade?: "concrete";
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
            concrete_finish?:
              "broom" | "smooth" | "exposed_aggregate" | "stamped" | "epoxy";
            concrete_type?:
              | "slab"
              | "driveway"
              | "sidewalk"
              | "foundation"
              | "decorative"
              | "stamped";
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
            reinforcement?: "none" | "rebar" | "wire_mesh" | "fiber";
            special_requirements?: string;
            thickness_inches?: number;
            trade?: "concrete";
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
