import { v } from 'convex/values';
export const blueprint = v.union(v.literal("co_automation_rule"), v.literal("co_bid"), v.literal("co_campaign"), v.literal("co_change_order"), v.literal("co_client"), v.literal("co_contact"), v.literal("co_contract"), v.literal("co_daily_report"), v.literal("co_document"), v.literal("co_invoice"), v.literal("co_job"), v.literal("co_lead"), v.literal("co_outreach"), v.literal("co_payment"), v.literal("co_pricing_rule"), v.literal("co_proposal"), v.literal("co_scope"), v.literal("co_site_visit"), v.literal("co_subcontractor"), v.literal("co_trade_spec"));
export const entityView = v.object({
  id: v.id('entities'), blueprint, identifier: v.string(),
  title: v.union(v.string(), v.null()), snapshotJson: v.string(), importedAt: v.number(),
});
export const importResult = v.object({
  created: v.number(), unchanged: v.number(), duplicates: v.number(),
  replayed: v.boolean(), receiptId: v.id('imports'),
});
export const linkResult = v.object({
  relation: v.string(), position: v.number(), targetIdentifier: v.string(),
  targetBlueprint: v.union(v.string(), v.null()),
  status: v.union(v.literal('missing'), v.literal('ambiguous'), v.literal('resolved')),
  target: v.union(v.object({ blueprint, identifier: v.string(), title: v.union(v.string(), v.null()) }), v.null()),
});
