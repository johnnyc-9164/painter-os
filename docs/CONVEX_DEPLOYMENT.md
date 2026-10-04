# Painter OS: real Convex deployment gates

## Status / evidence

The production source uses the installed Convex `queryGeneric`, `mutationGeneric`, `anyApi`, and `componentsGeneric()` APIs. `runtime.ts` is hand-authored and infers `DataModelFromSchemaDefinition<typeof schema>`; it is **not generated code**. All temporary backend `_generated` shims were removed. Original Contractor OS component bindings belong to that component and are unchanged. Better Auth, Contractor OS core, and painting component mounts remain intact.

Backend typechecking and four convex-test integration tests pass. Tests mock the authenticated-user boundary, not persistence or product commands. They exercise tenant membership, bearer portal approval/replay/expiry, verified-email invitation acceptance, and write-role denial. convex-test needs a virtual `_generated` root-marker key in its module map; this is test-harness metadata only, not a shim file. **No live deployment, OAuth/login, HTTP cookie round-trip, storage upload, or mounted-component integration was verified.**

## Required deployment / credentials

1. Authenticate the Convex CLI with a deployment owner account, or supply a real deployment credential. None has been provisioned or claimed by this implementation.
2. From `packages/backend`, run `npx convex dev --configure` for development, then configure your production project and run `npx convex deploy`. Review schema/index deployment, Better Auth/core/painting component mount names, HTTP actions, auth-provider configuration, and actual CLI output. Any future genuine CLI codegen may create `_generated`; do not replace it with hand-written placeholders.
3. Set backend environment values on the **selected Convex deployment**:
   ```sh
   npx convex env set SITE_URL https://your-next-app.example
   npx convex env set BETTER_AUTH_SECRET '<at-least-32-random-secret-characters>'
   ```
   Never expose this secret in `NEXT_PUBLIC_*`. Auth factory fails closed when SITE_URL or secret is missing. SITE_URL must exactly match the public Next origin used in Better Auth trusted origins.
4. Set Next server/build environment:
   ```text
   PAINTER_RUNTIME=convex
   NEXT_PUBLIC_CONVEX_URL=https://<deployment>.convex.cloud
   NEXT_PUBLIC_CONVEX_SITE_URL=https://<deployment>.convex.site
   ```
   Only these two public URL names are used; no fabricated connectivity or secondary URL aliases. The Next bridge initializes lazily, so local mode requires no Convex URLs or credentials. Runtime selection belongs to API route orchestration, not this adapter.
5. Keep `/api/auth/[...all]` mounted to the lazy bridge's GET/POST handlers. The `/api/auth` JSON route should call `authCloud(action, data, request)` and return its NextResponse directly. It forwards actual Better Auth sign-in/email, sign-up/email, sign-out HTTP and preserves every Set-Cookie. It requires a matching Origin for state-changing browser requests. `snapshotCloud(request?)` uses authenticated Next request cookies via `fetchAuthQuery`/`fetchAuthMutation` and the bridge's token acquisition, and atomically initializes the first workspace if no active membership exists. Sign-up does not fabricate a Convex token; the browser must receive cookies then request the snapshot in a subsequent request.
6. Wire command routes to `commandCloud(command)`, portal GET to `portalCloud(token)`, and portal POST to `portalCommandCloud(token, command)`. Route orchestration must enforce authenticated command-request Origin checks and must not fall back to local data on a cloud error. Portal POST only allows approve/reject/requestChanges. Use no-store responses, no referrer leakage, and never log bearer URLs. Link pages and invitation-acceptance UI must be present for issued URLs to be usable; adapter functions do not create routes.

## Security / operational behavior

- Random 256-bit bearer tokens are generated in Next, with SHA-256 hashes persisted in Convex; backend hashes presented tokens using WebCrypto. Portals and invitations expire after seven days. Portal links convey authority without login. Customer identity comes from the stored authoritative customer; estimate ID/customer ID are never caller-selectable during public commands.
- Portals capture an immutable customer-safe estimate projection. Changed estimate revision invalidates new approvals; a transaction receipt still permits exact retry. Only related customer jobs, schedules, and non-draft invoice summaries are exposed, with no event history, private notes, cost/financial snapshots, integration metadata, or storage secrets. Customer-authenticated snapshots/results are also projected.
- Invitation acceptance is bound to matching **verified** Better Auth email and actual authenticated user ID. `member.invite` cannot insert a browser-supplied user ID; use createInvite/acceptInvite. Owner invitations are denied. Role changes remain owner-only. No email is sent by issuing a link.
- **Open auth limitation:** email/password login/signup works through Better Auth, but no verification-email delivery callback/provider or password-reset delivery is configured. New email/password users ordinarily have emailVerified=false and therefore cannot accept invitations until a real verification flow is configured. Do not remove this check or mark emails verified merely because a browser supplied them. Configure provider credentials and Better Auth sendVerificationEmail, and test link completion before enabling invitations in production.
- Demo requires an already authenticated user and `PAINTER_ALLOW_DEMO=true` in both Next and Convex deployment environments; absent flag fails closed. It is synthetic authenticated seeding, not anonymous login or a shared demo credential.
- Original component execute writes require owner/office_admin. Original component storage is separate and is not mirrored into Painter entity rows. File uploads reserve tenant/actor/job-bound staging rows and validate actual Convex storage MIME and size metadata, reject reused storage registration, and prohibit customer writes.
- Rate limiting, verification/reset-email delivery, actual invitation delivery, portal revocation UI, deployment monitoring, and real-cloud acceptance are not configured or verified here.

## Reproducible checks

```sh
npx tsc -p packages/backend/convex/tsconfig.json --noEmit
npx vitest run packages/backend/tests/painter.test.ts
npx tsc -p apps/web/tsconfig.json --noEmit
```

Before release, verify production sign-up → cookie propagation → authenticated snapshot → command → logout; verified-email invite acceptance; anonymous bearer portal approval and scope/expiry denials; cross-tenant storage reuse rejection; and real mounted-component operations. Passing mocked-auth tests is not evidence those deployment gates passed.

## Final web adapter additions

Configure PAINTER_LINK_SECRET (at least 32 random characters) securely on the web host, not as a NEXT_PUBLIC variable. Link tokens are deterministic per authenticated actor, action and request key, making exact issuance retries reuse the same bounded portal/invitation instead of minting additional links. The backend checks token-hash reuse conflicts and preserves expiry; portal creation checks expectedRevision. The web links are /p/<token> and /i/<token>.

The current web adapter intentionally supports the default membership workspace only. An explicit workspaceId query is rejected with WORKSPACE_SELECTION_NOT_SUPPORTED until consistent workspace selection is implemented across commands, files, invitations, links and roster. This prevents misdirected writes; it is not a complete multi-workspace switching UI.

Dockerfile is provided but no container image was built in this run. No deployment command was executed. See RELEASE_REPORT.md for current test evidence, store boundaries and remaining product scope.
