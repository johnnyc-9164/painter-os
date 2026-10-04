// Generated. All source fields remain optional.
import { v } from "convex/values";
export const properties = v.object({
 trade: v.optional(v.literal("roofing")),
 measurement_value: v.optional(v.number()),
 measurement_unit: v.optional(v.union(v.literal("sq_ft"),v.literal("linear_ft"),v.literal("units"),v.literal("squares"),v.literal("tons"),v.literal("cubic_yards"),v.literal("lf"))),
 permit_required: v.optional(v.boolean()),
 permit_number: v.optional(v.string()),
 materials_spec: v.optional(v.string()),
 special_requirements: v.optional(v.string()),
 roof_type: v.optional(v.union(v.literal("asphalt_shingle"),v.literal("metal"),v.literal("tile"),v.literal("flat_tpo"),v.literal("flat_epdm"),v.literal("slate"),v.literal("cedar_shake"),v.literal("other"))),
 roof_pitch: v.optional(v.union(v.literal("flat"),v.literal("low"),v.literal("medium"),v.literal("steep"))),
 layers_to_remove: v.optional(v.number()),
 decking_replacement: v.optional(v.boolean()),
 gutter_work: v.optional(v.boolean()),
 skylight_count: v.optional(v.number()),
});
export const coreReferences = v.object({scope:v.optional(v.union(v.string(),v.null())),pricing_rule:v.optional(v.union(v.string(),v.null()))});
export const fields = {tenantId:v.string(),identifier:v.string(),title:v.union(v.string(),v.null()),properties,coreReferences,revision:v.number(),createdAt:v.number(),updatedAt:v.number()};
export const document = v.object({...fields,_id:v.id("specs"),_creationTime:v.number()});
export const receipt = v.object({id:v.id("specs"),revision:v.number(),replayed:v.boolean()});
