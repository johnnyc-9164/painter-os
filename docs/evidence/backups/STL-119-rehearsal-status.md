# STL-119 — Restore rehearsal status

**Date:** 2026-11-02 (America/Chicago)
**Outcome:** **NOT EXECUTED; approval and environment prerequisites remain.** This document is a truthful hold receipt, not a successful restore log.

| Gate | Observed status |
| --- | --- |
| Convex CLI access to Johnny Cage's team (`johnny-cage`) | Authenticated on the Painter development Sprite at start of this task |
| Production Convex project/deployment positively identified | Not established in this run |
| Scheduled backup actually enabled | Not performed / not verified; requires owner authorization and potentially Pro plan |
| Verified backup snapshot including file storage | Not established |
| Dedicated, approved non-production restore target | Not established |
| Non-production restore completed and verified | Not attempted |
| RPO and RTO measured | Not available |
| Any production data mutation, schema change or deployment | None performed by this task |

**Required continuation:** The maintainer approves the relevant plan/backup settings and separate restore target after confirming exact project/deployment identities; a reviewer signs off on the isolated restore procedure; execute the drill outside production and append its measured, redacted evidence here. Preserve this issue as open until all acceptance conditions pass.

References: [Convex backup requirements](https://docs.convex.dev/database/backup-restore), [Vercel rollback constraints](https://vercel.com/docs/instant-rollback), and [STL-119 contract](../../../.factory/contracts/STL-119.json).
