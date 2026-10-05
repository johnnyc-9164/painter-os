# Platform UX and permission contract

Authoritative sources: root `AGENTS.md`; `docs/contracts/issue-2-freeze.md`; existing `platformAccess.ts` current/bootstrap/revoke seam; `packages/backend/convex/platformInventory.ts`; four-field DTO `packages/backend/platform-contract.ts`.

- Better Auth validates the real session/user. Verified email plus an enabled stored platform grant permits each read. Workspace membership never supplies this authority.
- `/platform` and every child stay in an explicit route subtree. Unknown pages return 404. Unknown `/api/platform` paths return JSON 404 rather than contractor HTML.
- A signed-out account sees the platform sign-in form. Successful sign-in rechecks the original page; it never calls the tenant snapshot/bootstrap path. A signed-in denied account can recheck or sign out.
- Every inventory page and detail read is server-authorized. Projection contains only workspace ID, name, createdAt and demo. No arbitrary-table parameter, operational snapshot, member list or impersonation.
- Inventory accepts a native opaque cursor and page size 1–50; the UI asks for 20. Next page is a native URL link; First page safely resets the cursor. No unsupported total/page number is invented.
- Missing local/configured capability is unavailable, not an empty inventory. Backend/network failure remains 503. Signed out is 401, denied 403, malformed request 400 and authorized missing workspace 404. All data responses are private/no-store. Unrecognized native cursor errors stay unavailable, with a first-page reset; they are not conflated with genuine outages through broad error matching.
- Summary detail links to the existing public article route by workspace ID. This does not claim a custom domain or site binding.
- Sites, health, platform activity and SaaS billing show their unconnected state. No provider probe, mutation, grant or revenue metric exists in this UI.
- System tokens/shared controls are owned as documented in DESIGN.md. Pure transport tests, actual Better Auth/Convex fixtures, automatic-JSX state-render tests and built HTTP checks enforce the contract. Live/browser checks remain separately required.
