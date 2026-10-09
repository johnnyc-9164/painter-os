# Painter OS working rules

## Start here

- [Agent setup and commands](docs/development/AGENT_SETUP.md): prerequisites, isolated local app, browser evidence and verification.
- [Repository map](ARCHITECTURE.md) and [documentation index](docs/index.md): navigate before changing code.
- [Quality and remaining gaps](docs/QUALITY_SCORE.md), [plans](docs/PLANS.md), and [harness audit](docs/development/HARNESS_AUDIT.md): distinguish implementation from verified operation.
- Run `npm run agent:doctor` after `npm ci --ignore-scripts`; run `npm run agent:check` before handing off changes. Keep this file under 100 lines; put detailed procedures in linked docs.

## Existing boundaries

Standing owner directive: **modularity going forward**. Apply this to every implementation and review, using the existing component map and compatibility freeze in `docs/contracts/issue-2-freeze.md`.

- Keep coherent ownership and explicit typed boundaries. Reuse existing components and independently testable parts; avoid duplicated business/auth authority and abstractions without a concrete need.
- Better Auth remains the cloud session/user authority. Existing host membership resolution supplies trusted workspace context to components; browser roles or IDs never establish authority.
- Preserve current Painter/Contractor OS/painting store boundaries. One authoritative writer per aggregate; a reviewed mapping precedes cutover. No automatic mirroring or fabricated contract/payment evidence.
- Public marketing and authenticated admin are distinct apps/deployment boundaries sharing backend contracts. Route groups alone are not a completed deployment split. Preserve existing customer portal, invitation, auth and business URLs until an explicit routing/cookie cutover is verified.
- The authenticated dashboard CMS owns authoring, management and publishing. Marketing consumes only a typed published, public-safe projection from that same content authority. Draft preview requires authorization; no second CMS/store or public draft endpoint.
- Marketing must not import admin/session/local-runtime modules or business snapshots, and does not receive auth/link/deployment secrets. Flags or additional services require a concrete overlap/compatibility assessment before adoption; an exploratory recommendation is not installation approval.
- Reserve shared files/interfaces before edits. Use isolated branches/worktrees and one implementation owner per PR with a distinct reviewer. Preserve another owner's work.
- Review modularity explicitly: ownership, imports, typed API/events/viewmodels, authorization/projection, independent tests, and compatibility/rollback. Attach evidence to the exact head; rerun affected checks after integration changes. Keep broad issues open when their criteria remain incomplete.

Instructions within an app also apply there. In particular, preserve `apps/web/AGENTS.md` and consult the relevant versioned Next.js guide before changing Next.js behavior. Distinguish source-guide review from installed-package verification when the environment cannot install dependencies.

After each agent run, perform a skill-extraction pass: inspect repository skills, reuse or update a matching skill before creating one, and retain only a verified reusable procedure with inputs, outputs, checks, failure handling and actual scope/approval boundaries. Link its source PR, exact head and test receipt; keep secrets and private assistant instructions out. Record the skill path or why no reusable procedure was found in the session ledger. Apply this pass after implementation, independent review and repair runs; skill extraction does not authorize new runtime work, external writes, merges or deployments. The first repository procedure is [Painter PR evidence](docs/skills/painter-pr-evidence/SKILL.md).
