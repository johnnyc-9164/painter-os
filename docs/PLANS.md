# Execution plans

Small bounded changes can use an issue/PR contract. Complex changes also create a plan from [the template](exec-plans/TEMPLATE.md) in exec-plans/active. Record source baseline, actual executor/reviewer, owned files, acceptance commands, progress and decisions. Move completed plans into exec-plans/completed after current-head review; do not erase unresolved gaps.

The [harness preparation plan](exec-plans/active/agent-harness-readiness.md) reserves only development tooling/docs. [Technical debt](exec-plans/tech-debt-tracker.md) records remaining work. The [existing PR template](../.github/pull_request_template.md) and [evidence skill](skills/painter-pr-evidence/SKILL.md) remain the handoff standard.

The weekly hygiene check validates current docs and reports debt. It does not execute business actions, repair code, auto-merge or provision an agent. Future autonomous cleanup must receive a bounded task contract and actual review identity.
