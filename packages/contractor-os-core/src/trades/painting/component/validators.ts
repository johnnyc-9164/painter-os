// Generated. All source fields remain optional.
import { v } from "convex/values";
export const properties = v.object({
 trade: v.optional(v.literal("painting")),
 measurement_value: v.optional(v.number()),
 measurement_unit: v.optional(v.union(v.literal("sq_ft"),v.literal("linear_ft"),v.literal("units"),v.literal("squares"),v.literal("tons"),v.literal("cubic_yards"),v.literal("lf"))),
 permit_required: v.optional(v.boolean()),
 permit_number: v.optional(v.string()),
 materials_spec: v.optional(v.string()),
 special_requirements: v.optional(v.string()),
 paint_finish: v.optional(v.union(v.literal("flat"),v.literal("eggshell"),v.literal("satin"),v.literal("semi_gloss"),v.literal("gloss"),v.literal("cabinet_enamel"))),
 paint_grade: v.optional(v.union(v.literal("economy"),v.literal("standard"),v.literal("premium"),v.literal("luxury"))),
 paint_surface_type: v.optional(v.union(v.literal("interior_walls"),v.literal("exterior_walls"),v.literal("trim"),v.literal("ceilings"),v.literal("cabinets"),v.literal("deck"),v.literal("fence"),v.literal("concrete_floor"),v.literal("garage_floor"),v.literal("other"))),
 number_of_coats: v.optional(v.number()),
 color_count: v.optional(v.number()),
 primer_required: v.optional(v.boolean()),
 pressure_wash_required: v.optional(v.boolean()),
 prep_work: v.optional(v.union(v.literal("minimal"),v.literal("moderate"),v.literal("extensive"),v.literal("repair_needed"))),
 masking_complexity: v.optional(v.union(v.literal("simple"),v.literal("moderate"),v.literal("complex"))),
 lead_hazard_present: v.optional(v.boolean()),
 ceiling_height_ft: v.optional(v.number()),
 surface_condition: v.optional(v.union(v.literal("new"),v.literal("good"),v.literal("fair"),v.literal("poor"),v.literal("needs_repair"))),
});
export const coreReferences = v.object({scope:v.optional(v.union(v.string(),v.null())),pricing_rule:v.optional(v.union(v.string(),v.null()))});
export const fields = {tenantId:v.string(),identifier:v.string(),title:v.union(v.string(),v.null()),properties,coreReferences,revision:v.number(),createdAt:v.number(),updatedAt:v.number()};
export const document = v.object({...fields,_id:v.id("specs"),_creationTime:v.number()});
export const receipt = v.object({id:v.id("specs"),revision:v.number(),replayed:v.boolean()});
