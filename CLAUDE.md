# Painter OS — Claude Code instructions

You are working in **johnnyc-9164/painter-os**.

Read these files before changing anything:

1. `AGENTS.md` (root) — standing modularity and authority rules
2. `docs/contracts/issue-2-freeze.md` — compatibility freeze and ownership map
3. `.github/pull_request_template.md` — every PR must fill this contract
4. `docs/CONVEX_DEPLOYMENT.md` — real cloud deployment gates
5. `apps/web/AGENTS.md` — Next.js version-specific agent rules

## Current phase priority (do this first)

The product lifecycle is implemented and locally verified. The remaining work is **making it real in the cloud**, not adding features.

Order of work:

1. Live Convex deployment (`docs/CONVEX_DEPLOYMENT.md`)
2. Better Auth email delivery (verification + password reset) — hard blocker for cloud invitations
3. Required secrets: `BETTER_AUTH_SECRET`, `PAINTER_LINK_SECRET` (≥32 chars), Convex URLs, `SITE_URL`
4. Vercel deploy + real cloud smoke tests (signup → cookie → snapshot → command → logout, verified invite, portal approve/deny)
5. Only after the above: Stripe, real email/SMS, calendar, offline field, multi-workspace UX

Do not start payment integrations, LLM agents, or marketing redesigns while #1–4 are incomplete.

## Hard constraints (never violate)

- **Better Auth** is the only cloud session / user authority. Browser roles or IDs never establish authority.
- Host membership resolution (`painterMembers` / `painterWorkspaces`) is the only cloud membership authority.
- Painter product tables and original Contractor OS component are **separate stores**. No automatic mirroring, dual-write, or fabricated migration.
- Marketing app (`apps/marketing`) must not import admin/session/local-runtime modules or receive auth/deployment secrets.
- Local SQLite (`PAINTER_RUNTIME=local`) is acceptance-only. Never treat it as production fallback or expose it to the internet.
- Do not mark emails verified just because the browser supplied them. Invitation acceptance requires real verified identity.
- Do not put secrets in `NEXT_PUBLIC_*`.
- One authoritative writer per aggregate. Preserve original monetary precision and append-only payment rules.
- Do not self-merge. Do not promote production. Do not weaken auth/guards to make tests pass.

## How to work

- Use an isolated branch / worktree.
- Fill the PR task contract before coding. Own exact files; name shared-file owners.
- Prefer the smallest change that satisfies the acceptance criteria.
- Reuse existing Base UI / shadcn compositions and domain commands. Do not invent parallel auth or business engines.
- After implementation, run the relevant checks and attach **exact-head** evidence (see `docs/skills/painter-pr-evidence/SKILL.md`).
- Keep broad issues open when only a slice is complete.

## Local commands (safe defaults)

```sh
# install (respects lockfile)
npm ci --ignore-scripts

# local acceptance harness (no Convex required)
npm run dev:local          # http://localhost:3001

# full verification gate
npm run verify

# type / lint / tests only
npm run check-types
npm run lint
npm test
npm run test:convex

# HTTP + browser acceptance (server must already be running)
npm run test:http
npm run test:browser
```

Cloud commands require real credentials. Do not invent them. Do not fall back to local when cloud is configured but misbehaving.

## What "done" looks like for a task

- Owned files listed and respected
- Acceptance criteria observed and tested
- Exact head SHA + commands + results recorded
- Independent review against that head (implementation owner does not self-approve)
- No secrets committed, no product behavior changed outside the allowed scope

When in doubt, stop and ask. Prefer a blocked status over a silent architecture violation.
