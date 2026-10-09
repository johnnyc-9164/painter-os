# Base-owned factory approvals

Before dispatch, a maintainer reviews the issue contract and commits `<issue-number>.json` here on the PR base branch. The record is `{ "contract": <parsed complete contract>, "attempt": "<authorized attempt identifier>" }`. Generate the contract with the base helper's `from-issue` command; review scope, risk and evidence before committing it. No approvals are supplied by this change.

The guard requires the head contract to equal this base record and the PR `Factory-Attempt` trailer to match its attempt. Editing an issue or re-hashing a widened PR contract does not authorize changes. A new attempt or changed contract requires a new reviewed base record. An attempt identifier binds the claimed attempt, not runner identity or proof of a paid/provider run.

The workflow uses `pull_request_target` and reads head Git objects as data only, with read-only permissions and credentials not persisted. Never add head checkout, code execution, package installation, cache or artifact ingestion. The guard only applies to `factory/*`; repository required-check and branch-protection configuration must be verified separately. This is a path/contract boundary, not proof of implementation correctness or deployment approval.
