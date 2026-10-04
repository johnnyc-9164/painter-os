# Request to give Port

Export the COMPLETE Contractor OS DATA MODEL as JSON blueprint definitions, not just entity rows.

Include every blueprint whose identifier starts with `co_`, even if it has zero entities. Also include definitions for all referenced Contractor OS blueprint targets, including `co_bid`, `co_contact`, and `co_subcontractor`; explicitly report any target that does not exist.

For each blueprint preserve its exact identifier/title, full property schemas, nested object/array types, required fields, enums, defaults, formats, constraints, and writable vs computed properties. Include every relation with its exact target blueprint, required flag and many/single cardinality. Include complete mirror-property, calculation-property and aggregation-property definitions and any exact expressions or query configuration.

Export the related workflow/action definitions, input schemas, trigger configuration, complete execution nodes and connections, prerequisite checks, approval requirements, scorecards and rules. Include relevant permissions and tenant/ownership rules that are actually configured. Report unsupported export categories or missing definitions explicitly. Do not infer rules from descriptions or invent absent configuration.

Create separate files for blueprint definitions, workflows/actions, scorecards/rules and permissions. Include a manifest listing what was and was not exported. Keep business entity records separate from the model. Exclude unrelated AI-agent conversations, invocations, personal history, raw secret values and credentials. Include only configuration necessary to understand the model; reference secrets by variable name, never their value.

This export will be translated into a reusable Convex backend component. Stable identifiers, relation targets and executable rule definitions must survive. JSON is the handoff format; do not substitute a UI screenshot or only rows exported from catalog tables.
