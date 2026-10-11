# IR-to-component inventory

Status: inventory only, no code changed. Sources: issue #6 (execution contract, Oct 4 2026) and issue #188 (split request). Every path below was checked against the worktree at `origin/main` (commit `7c80a47`) with `ls`/`grep`. "missing" means no file or export with that name exists in `packages/ui/src`, `apps/web/src`, or the other workspace sources searched.

Legend: **implemented** = a named composition or hook exists as its own exported file; **missing** = no such file/export; **inline** = equivalent UI exists only as a local function inside a monolith.

## 1. Compositions named in #6

| Named in #6 | Status | Canonical path (intended) | Current equivalent UI (verified) | Notes |
| --- | --- | --- | --- | --- |
| AppShell | missing | `packages/ui/src/components/app-shell.tsx` | inline: `apps/web/src/components/painter-app.tsx:89` (`<div className="app-shell">` with `<aside className="sidebar">`, `main-shell`) | Shell markup lives inside `PainterApp`. |
| Sidebar | missing | `packages/ui/src/components/sidebar.tsx` | inline: `apps/web/src/components/painter-app.tsx:89` (`sidebar`, `sidebar-brand`, `sidebar-bottom`); nav data `const nav` at `painter-app.tsx:19` | Mobile open state handled inline. |
| headers/toolbars | missing | `packages/ui/src/components/page-header.tsx`, `toolbar.tsx` | inline: `painter-app.tsx:55` (`const toolbar`, `className="toolbar"`), page titles map `painter-app.tsx:25` (`titles`); app-wide header component `apps/web/src/components/header.tsx` (`export default function Header`) | `header.tsx` is an existing app-level header, not a reusable page header. |
| EntityTable | missing | `packages/ui/src/components/entity-table.tsx` | inline: `painter-app.tsx:57` (`function table(records, type, actions)` rendering `div.table-wrap > table`) | Typed by `Entity` local type, not a generic row type. |
| StatusBadge | missing | `packages/ui/src/components/status-badge.tsx` | inline: `painter-app.tsx:32` (`function Badge({value})`, success/neutral variants by value list) | Only a pill component inside the monolith; `packages/ui/src/components/marker.tsx` and `bubble.tsx` exist but are not status badges. |
| summaries | missing | `packages/ui/src/components/summary-metric.tsx` | inline: `painter-app.tsx:91` (`function Metric({title,value,foot,icon})` on `section.card.metric`); dashboard composition `painter-app.tsx:61` (`overview()`) | `packages/ui/src/components/card.tsx` exists and can host a metric card. |
| ScheduleBoard | missing | `packages/ui/src/components/schedule-board.tsx` | inline: `painter-app.tsx:63` (`function board(records, type)`, kanban lanes; lanes for `lead` and `job`) and `painter-app.tsx:66` (`function schedule()`, 42-cell month calendar, `calendar-controls`) | Two distinct views (kanban and calendar) are both inline. |
| FieldChecklist | missing | `packages/ui/src/components/field-checklist.tsx` | inline: `painter-app.tsx:65` (`function fieldCard(e)`, reads `items`/`checklist`, default phases Prep, Prime, Coats, Cleanup); CSS class `checklist` in `painter-app.tsx` | Field data shape is untyped (`Record<string, unknown>[]`). |
| loading/empty/error states | missing | `packages/ui/src/components/empty.tsx` exists; loading/error missing | `empty.tsx` exists (`packages/ui/src/components/empty.tsx`) but is not used by `painter-app.tsx`; inline: `painter-app.tsx:56` (`function empty(label, action)`), `painter-app.tsx:87` (`loading-screen`), `role="alert"` error blocks at `painter-app.tsx:88-89` and `painter-forms.tsx` (`className="error"`) | `skeleton.tsx` exists in `packages/ui/src/components/`; not wired to the monolith. |
| Base UI / shadcn primitives (context) | implemented | `packages/ui/src/components/{button,dialog,dropdown-menu,input,label,textarea,tooltip,card,skeleton,empty,sonner}.tsx` | `painter-forms.tsx` `CommandForm` (`painter-forms.tsx:48`) uses `dialog-*` classes | Primitives exist; the named compositions above do not. |

Additional existing UI relevant to the same surfaces (not named in #6, listed so reviewers can see reuse candidates):

- `apps/web/src/components/next-action-panel.tsx`: already a separate component, consumed by `painter-app.tsx` `overview()`.
- `apps/web/src/components/painter-forms.tsx`: `CommandForm` (line 48) and `datetime` helper; these are the current create/schedule forms.
- `apps/web/src/components/customer-portal.tsx`: separate customer surface, not part of the painter app shell.

## 2. Typed hooks named in #6

`packages/ui/src/hooks/` contains only `.gitkeep`. No `apps/web/src/hooks/` directory exists.

| Named in #6 | Status | Canonical path (intended) | Current equivalent (verified) | Notes |
| --- | --- | --- | --- | --- |
| useJob() | missing | `apps/web/src/hooks/use-job.ts` (or `packages/ui/src/hooks/`, decision pending) | none as a hook; data read via `painter-app.tsx:33` `async function request<T>(url, init)` and `painter-app.tsx:60` `loadQueueSnapshot()` (`/api/snapshot`) | Job detail is derived inside `painter-app.tsx:64` `detail(e)`. |
| useJobs() | missing | same as above | `of('job')` selector inside `painter-app.tsx:61` `overview()` and `painter-app.tsx:71` list rendering | Derived from the snapshot, not a hook. |
| useCreateEstimate() | missing | `apps/web/src/hooks/use-create-estimate.ts` | command submit inside `painter-forms.tsx` (`function submit`), using `estimate`/`estimateId` fields; `apps/web/src/lib/command-intent.ts` `createIntentKeys` (line 17) for retry keys | Retry-key reuse already exists in `lib/command-intent.ts`. |
| useScheduleJob() | missing | `apps/web/src/hooks/use-schedule-job.ts` | schedule command in `painter-forms.tsx` (`schedule` field), input normalization `apps/web/src/lib/schedule-input.ts` (`export function normalizeScheduleInput`) | Scheduling is also reached via `painter-app.tsx:66` calendar. |
| Typed data hooks (general, #6 acceptance) | missing | `apps/web/src/hooks/` | `apps/web/src/lib/convex-runtime.ts` exports `snapshotCloud`, `commandCloud`; `apps/web/src/lib/local-runtime.ts` exports `snapshotLocal`, `commandLocal` | Server-side adapters exist; no client hook layer. |

Hook note: `request<T>` in `painter-app.tsx` is untyped at the entity level (`Entity` with `data: Record<string, unknown>`). The #6 acceptance criterion "no raw database documents/any-driven feature contracts" is therefore unmet for every item above.

## 3. Open PR overlap: #153 (`feature/native-appointment-ui`)

Checked with `mcp__github__pull_request_read` `get_files` on PR #153. Files changed:

- `apps/web/src/app/api/estimate-appointments/route.ts`
- `apps/web/src/components/native-estimate-appointments.css`
- `apps/web/src/components/native-estimate-appointments.tsx`
- `apps/web/src/components/painter-app.tsx` **(owned by #6)**
- `apps/web/src/lib/appointment-http.ts`
- `apps/web/src/lib/appointment-server.ts`
- `docs/evidence/native-estimate-appointment-ui.md`
- `tests/native-appointment-ui.test.tsx`
- `tests/native-appointments.browser.mjs`
- `vitest.forms.config.ts`

Overlap with #6-owned files: `apps/web/src/components/painter-app.tsx` only. Files under `packages/ui/**`, `painter-forms.tsx`, and new `apps/web/src/hooks/**` are not touched by #153. `native-estimate-appointments.tsx` is a new appointment surface that overlaps conceptually with `ScheduleBoard` and `useScheduleJob`; coordinate before extracting schedule code.

## 4. Proposed extraction order

Constraint: no edits to `painter-app.tsx` until #153 merges, because #153 changes that file. Each step is independently testable and keeps `painter-app.tsx` rendering unchanged until its consumer is ready.

1. **Pure primitives in `packages/ui` (no `painter-app.tsx` edit).** `status-badge.tsx` (from `Badge`, `painter-app.tsx:32`), `summary-metric.tsx` (from `Metric`, `painter-app.tsx:91`), `loading-state.tsx`, `error-state.tsx`. Add component tests. Wire into `painter-app.tsx` only in step 5.
2. **Typed view-model types** in `packages/ui/src/lib` or `apps/web/src/lib`, defining `Entity`-derived row, job, estimate and field-item shapes. Blocked on #2 typed contracts; record the dependency rather than inventing fields.
3. **Typed hooks against agreed APIs** in `apps/web/src/hooks/`: `use-jobs.ts`, `use-job.ts`, then `use-create-estimate.ts` and `use-schedule-job.ts`, reusing `lib/command-intent.ts` keys and `lib/schedule-input.ts`. Do not touch `painter-forms.tsx` until step 6.
4. **Layout and collection compositions** in `packages/ui`: `app-shell.tsx`, `sidebar.tsx`, `page-header.tsx`, `toolbar.tsx`, `entity-table.tsx`. Storybook-free component tests only.
5. **Consume in `painter-app.tsx`** (after #153 merges and is rebased): replace `Badge`, `Metric`, `table`, `empty`, `toolbar`, and the shell markup with the step 1 and step 4 components; keep route titles and nav data unchanged.
6. **Feature compositions**: `schedule-board.tsx` (kanban `board` and calendar `schedule`), `field-checklist.tsx` (from `fieldCard`), updating `painter-forms.tsx` `CommandForm` to call step 3 hooks. Coordinate with the #153 owner on schedule-related surfaces first.
7. **Auth screens are excluded** (owned by #4 and the auth agent). `sign-in-form.tsx`, `sign-up-form.tsx`, `workspace-setup.tsx` are out of scope.

Rollback for each step: revert the scoped composition and its consumer edit; no persisted data is touched by UI-only steps.

## 5. Gaps against #6 acceptance

- Compositions with typed view models: missing (all listed items).
- Typed hooks `useJob`, `useJobs`, `useCreateEstimate`, `useScheduleJob`: missing.
- Shared capability projections for role rules: not inventoried here; the role logic in `painter-app.tsx` is not yet mapped and should be a follow-up.
- Desktop/mobile, keyboard, focus and state evidence: none exists for these compositions because none is extracted.
