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
            ceiling_height_ft?: number;
            color_count?: number;
            lead_hazard_present?: boolean;
            masking_complexity?: "simple" | "moderate" | "complex";
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
            number_of_coats?: number;
            paint_finish?:
              | "flat"
              | "eggshell"
              | "satin"
              | "semi_gloss"
              | "gloss"
              | "cabinet_enamel";
            paint_grade?: "economy" | "standard" | "premium" | "luxury";
            paint_surface_type?:
              | "interior_walls"
              | "exterior_walls"
              | "trim"
              | "ceilings"
              | "cabinets"
              | "deck"
              | "fence"
              | "concrete_floor"
              | "garage_floor"
              | "other";
            permit_number?: string;
            permit_required?: boolean;
            prep_work?: "minimal" | "moderate" | "extensive" | "repair_needed";
            pressure_wash_required?: boolean;
            primer_required?: boolean;
            special_requirements?: string;
            surface_condition?:
              "new" | "good" | "fair" | "poor" | "needs_repair";
            trade?: "painting";
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
            ceiling_height_ft?: number;
            color_count?: number;
            lead_hazard_present?: boolean;
            masking_complexity?: "simple" | "moderate" | "complex";
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
            number_of_coats?: number;
            paint_finish?:
              | "flat"
              | "eggshell"
              | "satin"
              | "semi_gloss"
              | "gloss"
              | "cabinet_enamel";
            paint_grade?: "economy" | "standard" | "premium" | "luxury";
            paint_surface_type?:
              | "interior_walls"
              | "exterior_walls"
              | "trim"
              | "ceilings"
              | "cabinets"
              | "deck"
              | "fence"
              | "concrete_floor"
              | "garage_floor"
              | "other";
            permit_number?: string;
            permit_required?: boolean;
            prep_work?: "minimal" | "moderate" | "extensive" | "repair_needed";
            pressure_wash_required?: boolean;
            primer_required?: boolean;
            special_requirements?: string;
            surface_condition?:
              "new" | "good" | "fair" | "poor" | "needs_repair";
            trade?: "painting";
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
              ceiling_height_ft?: number;
              color_count?: number;
              lead_hazard_present?: boolean;
              masking_complexity?: "simple" | "moderate" | "complex";
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
              number_of_coats?: number;
              paint_finish?:
                | "flat"
                | "eggshell"
                | "satin"
                | "semi_gloss"
                | "gloss"
                | "cabinet_enamel";
              paint_grade?: "economy" | "standard" | "premium" | "luxury";
              paint_surface_type?:
                | "interior_walls"
                | "exterior_walls"
                | "trim"
                | "ceilings"
                | "cabinets"
                | "deck"
                | "fence"
                | "concrete_floor"
                | "garage_floor"
                | "other";
              permit_number?: string;
              permit_required?: boolean;
              prep_work?:
                "minimal" | "moderate" | "extensive" | "repair_needed";
              pressure_wash_required?: boolean;
              primer_required?: boolean;
              special_requirements?: string;
              surface_condition?:
                "new" | "good" | "fair" | "poor" | "needs_repair";
              trade?: "painting";
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
            ceiling_height_ft?: number;
            color_count?: number;
            lead_hazard_present?: boolean;
            masking_complexity?: "simple" | "moderate" | "complex";
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
            number_of_coats?: number;
            paint_finish?:
              | "flat"
              | "eggshell"
              | "satin"
              | "semi_gloss"
              | "gloss"
              | "cabinet_enamel";
            paint_grade?: "economy" | "standard" | "premium" | "luxury";
            paint_surface_type?:
              | "interior_walls"
              | "exterior_walls"
              | "trim"
              | "ceilings"
              | "cabinets"
              | "deck"
              | "fence"
              | "concrete_floor"
              | "garage_floor"
              | "other";
            permit_number?: string;
            permit_required?: boolean;
            prep_work?: "minimal" | "moderate" | "extensive" | "repair_needed";
            pressure_wash_required?: boolean;
            primer_required?: boolean;
            special_requirements?: string;
            surface_condition?:
              "new" | "good" | "fair" | "poor" | "needs_repair";
            trade?: "painting";
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
