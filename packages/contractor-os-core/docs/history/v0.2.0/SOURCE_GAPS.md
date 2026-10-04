# Remaining source gaps

The new attachment is a human-readable summary, not raw Port blueprint JSON.
It substantially improves the model but does not establish the missing rules.

| Area | Known | Still missing / behavior |
|---|---|---|
| Identity | 20 contractor definitions, 32 total headings | Source summary incorrectly reports 18 contractor definitions |
| Properties | 199 individually specified fields, 42 enum fields | required, defaults, nullable, min/max, patterns and other raw constraints |
| Trade specification | 7 individually typed general fields | 45 grouped field mentions, 44 unique names: exact types, enums and constraints |
| Arrays | client.tags, subcontractor.certifications, document.tags are arrays | Element schemas unknown; JSON elements retained |
| Relations | 45 named relations; declared targets or named co_* target expansion | Required, most cardinalities, one-to-one constraints, inverse ownership and deletion policy |
| Explicit many | job.subcontractors and subcontractor.jobs | Whether their two stored directions must be synchronized |
| Calculations | Names; contact.full_name is described as first + last | All remaining formula bodies, units, rounding, missing-value rules |
| Aggregations | Names | Filters, relation paths, counts vs sums, status conditions |
| Scorecards | Prior export definitions retained | Newly mentioned trade scorecards and executable/specified evaluation contracts |
| Workflows | 11 earlier input contracts retained | Full business execution, prerequisite evidence and permitted transition rules |
| Import rows | 6 historical rows | 1 referenced contact record absent; 2 affected relation occurrences |

## Required is different from typed

The schema checks the type and enum of fields that are present. It deliberately
leaves fields optional because the source does not specify the required arrays.
It does not assert that an empty contract is operationally complete.

## Enum is different from transition

An allowed status label is not authorization to enter that status. No transition
graph, approval authority, evidence requirement, or irreversible operation is
inferred from the enum. Record maintenance is not workflow execution.

## Formula names are not executable definitions

`effective_rate`, `estimated_gallons`, `billing_variance`, `retainage_amount`,
`balance_due`, and other names are catalogued but not implemented. A plausible
formula would still be an invention without the source's actual expression and
business rules. `computeKnown` returns definition_missing for named calculations
without a definition rather than returning a misleading zero.

For closure, the already supplied export request remains in PORT_EXPORT_REQUEST.md.
Only remaining raw definitions are needed; the typed work in this version is reusable.
