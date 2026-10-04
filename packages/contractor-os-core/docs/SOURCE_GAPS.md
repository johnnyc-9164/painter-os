# Remaining source gaps and fidelity boundaries — v0.4.0

Resolved: all 52 trade properties now have explicit types; 43 single and 2 many
contractor relations are known; all 68 contractor mirror paths and 16 contractor
JQ formulas are now available.

Not supplied: contractor property required flags/defaults; element schemas for
client/document `tags` and subcontractor `certifications`; ten contractor
scorecards' predicates; complete raw workflow actions and executable automation
conditions. The _team section still summarizes some formulas and has undeclared
metric dependencies. Display enum-color metadata is not fully enumerated.

The runtime preserves source semantics instead of silently correcting these points:

- `effective_rate` multiplies by `1 + profit_margin_percent/100`: that is a markup
  operation. It does not divide by `1 - margin`. The source field name is retained.
- Painting gallons and roofing squares assume square-foot inputs in their formula
  bodies, even though other units are allowed. Non-sq_ft use produces a warning;
  the backend does not silently convert units or use this result to charge money.
- `co_job.outstanding_balance` is contract amount minus collected. Operational
  billed receivable is billed minus collected. These are distinct outputs.
- Aggregate filters marked none include all statuses, including draft and voided
  invoices and pending outreach. Their titles do not add hidden status filters.
- `co_change_order.amount` and calculated `total_change` are independent in the
  supplied model. No equality, fee, tax or pricing formula is silently added.
- Exact source date formulas accept UTC whole-second strings. A schema-valid ISO
  offset or fractional-second value receives a calculation diagnostic rather than
  silently changing the source's strptime semantics.
- JQ full_name does not trim: two missing names produce one space. The source
  compliance formula returns unknown if either date is missing, even if the other
  is already expired. These formulas are not independent legal verification.
- Older scorecard rule titles do not substitute for predicates. For example, a
  rule titled Fully Executed tests signed_at and contract_type, not contract status.
  Its result cannot authorize job creation; the separate command guard still does.

Aggregation traversal: the 19 definitions omit path filters. Port documents
all-possible-path traversal by default. This component instead exposes its selected
path in every aggregate result under `component_explicit_paths_v1`. It is not a
claim of exact Port aggregation parity. Paths live in `model/schema-supplement.json`.

Reference: https://docs.port.io/context-lake/data-model/setup-blueprint/properties/aggregation-property/
