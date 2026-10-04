// Generated. All source fields remain optional.
import { v } from "convex/values";
export const properties = v.object({
 trade: v.optional(v.literal("garage_door")),
 measurement_value: v.optional(v.number()),
 measurement_unit: v.optional(v.union(v.literal("sq_ft"),v.literal("linear_ft"),v.literal("units"),v.literal("squares"),v.literal("tons"),v.literal("cubic_yards"),v.literal("lf"))),
 permit_required: v.optional(v.boolean()),
 permit_number: v.optional(v.string()),
 materials_spec: v.optional(v.string()),
 special_requirements: v.optional(v.string()),
 door_type: v.optional(v.union(v.literal("single"),v.literal("double"),v.literal("roll_up"),v.literal("sectional"),v.literal("carriage_style"))),
 door_material: v.optional(v.union(v.literal("steel"),v.literal("wood"),v.literal("aluminum"),v.literal("fiberglass"),v.literal("vinyl"))),
 door_count: v.optional(v.number()),
 spring_type: v.optional(v.union(v.literal("torsion"),v.literal("extension"))),
 opener_included: v.optional(v.boolean()),
});
export const coreReferences = v.object({scope:v.optional(v.union(v.string(),v.null())),pricing_rule:v.optional(v.union(v.string(),v.null()))});
export const fields = {tenantId:v.string(),identifier:v.string(),title:v.union(v.string(),v.null()),properties,coreReferences,revision:v.number(),createdAt:v.number(),updatedAt:v.number()};
export const document = v.object({...fields,_id:v.id("specs"),_creationTime:v.number()});
export const receipt = v.object({id:v.id("specs"),revision:v.number(),replayed:v.boolean()});
