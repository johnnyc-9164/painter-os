<!-- Fill this contract before execution. Replace pending fields with actual identities; never represent a role label as an active agent. For a completion PR, fill commit-specific evidence. -->
# Task contract

## Identity and status
- Linked issue / canonical contract:
- Objective owner / actual executor agent and session:
- Independent reviewer / actual identity:
- Branch and isolated worktree:
- Base branch / baseline SHA / current head SHA:
- Status: queued | assigned | running | blocked | verified | merged

## Problem and intended behavior
Describe a concrete trigger, current behavior and expected result.

## Owned files and components
List exact paths, public APIs and schema boundaries. Name shared-file owners.

## Dependencies and parallel work
List blocking issues/PRs/contracts and work safe to execute independently.

## Allowed changes
Define the implementation scope.

## Prohibited changes and architecture constraints
Preserve the agreed modular Convex/public API architecture and official Better Auth component. Reuse Base UI/shadcn compositions and existing infrastructure. Do not introduce duplicate authority/auth, unrelated refactors, committed secrets, destructive migration or unapproved provider changes.

## Acceptance criteria
- [ ] Concrete observable behavior and invariants:
- [ ] Tenant/role boundaries, retries and compatibility where applicable:
- [ ] Regression or reproducible evidence:
- [ ] Independent review against the current head:

## Validation plan and executed evidence
| Gate | Exact command or procedure | Result | Commit SHA | Evidence link |
|---|---|---|---|---|
| Reproduction / regression | | Not run | | |
| Type / lint / tests / build as applicable | | Not run | | |
| Cloud / browser / live settings as applicable | | Not run | | |
| Independent review | | Pending | | |

Do not count archived evidence as a fresh pass. Distinguish configured, executed, passed and independently verified.

## Risks, compatibility and rollback
Document migrations, data effects, versions and reversible recovery steps.

## Blockers and escalation conditions
State missing capability/permission, contract conflict or dependency precisely. Continue independent work; never weaken guards to hide blockers.

## Completion and handoff
- PR target and dependency/merge order:
- Remaining work and owning issue:
- Actual reviewer verdict and evidence:

Implementation owner writes scoped regression tests; verification agent authors independent acceptance evidence. Use separate branches/worktrees, coordinate shared files and retain current-commit evidence. Do not create empty repair PRs, merge automatically or promote production automatically. A contract does not dispatch an agent.
