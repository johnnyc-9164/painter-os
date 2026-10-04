// Generated. All source fields remain optional.
import { v } from "convex/values";
export const properties = v.object({
 trade: v.optional(v.literal("drywall_framing")),
 measurement_value: v.optional(v.number()),
 measurement_unit: v.optional(v.union(v.literal("sq_ft"),v.literal("linear_ft"),v.literal("units"),v.literal("squares"),v.literal("tons"),v.literal("cubic_yards"),v.literal("lf"))),
 permit_required: v.optional(v.boolean()),
 permit_number: v.optional(v.string()),
 materials_spec: v.optional(v.string()),
 special_requirements: v.optional(v.string()),
 drywall_type: v.optional(v.union(v.literal("standard"),v.literal("moisture_resistant"),v.literal("fire_rated"),v.literal("soundproof"))),
 framing_type: v.optional(v.union(v.literal("wood"),v.literal("metal"),v.literal("none"))),
 finishing_level: v.optional(v.union(v.literal("level_1"),v.literal("level_2"),v.literal("level_3"),v.literal("level_4"),v.literal("level_5"))),
 ceiling_height_ft: v.optional(v.number()),
});
export const coreReferences = v.object({scope:v.optional(v.union(v.string(),v.null())),pricing_rule:v.optional(v.union(v.string(),v.null()))});
export const fields = {tenantId:v.string(),identifier:v.string(),title:v.union(v.string(),v.null()),properties,coreReferences,revision:v.number(),createdAt:v.number(),updatedAt:v.number()};
export const document = v.object({...fields,_id:v.id("specs"),_creationTime:v.number()});
export const receipt = v.object({id:v.id("specs"),revision:v.number(),replayed:v.boolean()});
