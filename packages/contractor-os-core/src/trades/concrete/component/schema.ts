import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { fields } from "./validators.js";
export default defineSchema({
 specs:defineTable(fields).index("by_tenant_identifier",["tenantId","identifier"]).index("by_tenant",["tenantId"]),
 requests:defineTable({tenantId:v.string(),requestKey:v.string(),signature:v.string(),id:v.id("specs"),revision:v.number()}).index("by_tenant_request",["tenantId","requestKey"]),
 events:defineTable({tenantId:v.string(),actorId:v.string(),identifier:v.string(),requestKey:v.string(),operation:v.union(v.literal("create"),v.literal("update")),beforeJson:v.union(v.string(),v.null()),afterJson:v.string(),occurredAt:v.number()}).index("by_tenant_identifier",["tenantId","identifier"]),
});
