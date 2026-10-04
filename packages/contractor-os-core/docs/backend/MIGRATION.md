# v0.2.0 to v0.3.0 adoption

This is an additive schema change plus a deliberately stricter mutation policy.
Existing 20 domain table field shapes are retained. domainEvents gains OPTIONAL
command/evidenceJson/policyVersion fields. businessRequests and businessEvidence
are new tables. co_job gains an index on tenantId and relations.contract.

There is no auto-migration or production cutover script. In a development copy:
verify contract/client/job lineage, identify duplicate jobs per contract, confirm
financial values have two decimal places, reconcile amount_paid and job totals,
and retain original data before any correction. Existing statuses/arrays may be
stored by the old version but refused by the new operational commands. Array-valued
relations on a required single-parent business path must be reviewed, not guessed.

The default package export changes from the catalog client to ContractorBackend;
import the old ContractorOS client from ./catalog. The TypedContractorOS client
remains at ./domain. Existing recorded entities are not deleted or overwritten by
installing the source. Existing callers that changed statuses or balances through
maintenance endpoints must switch to workflow commands. App administrators must
explicitly map the separate attest permission; it is not granted to operators.

Rollback: disable the host workflow exports first. Do not merely reinstall the old
permissive maintenance API over a live financial dataset. Preserve newly recorded
events and receipts, inspect any post-upgrade data, and authorize a scoped rollback.
No migration or rollback was run as part of this build.
