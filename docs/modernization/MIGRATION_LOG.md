# Migration Log — Overnight Run (2026-06-09)

One line per step: ✅ done · ⏭️ skipped · ↩️ reverted (with reason). This file is the morning report.

## Phase 0 — Foundation
- ✅ Plan + ADRs 0001/0002 committed on branch `modernization`
- ✅ Baseline established: `tsc` clean, 101 Mocha unit tests green (coverage 90 % stmts)
- ✅ Meteor 2.7.3 installed locally (x86_64 under Rosetta — Apple Silicon launcher refused arm64)
- ✅ Mailpit running on host ports 11025 (SMTP) / 18025 (UI+API) — 1025/3000 were taken by another project, app therefore runs on port 4000
- ✅ Playwright scaffolding in `e2e/` (own package.json, modern Node, `E2E_BASE_URL` env)
- ✅ Specs 01–03 stable (5 consecutive green runs): login, group creation, assignment lifecycle incl. "Zusage" email assertion via Mailpit
- 📌 Characterization findings (pre-existing legacy behavior, NOT regressions):
  - Cold page load of `/group/:id/manage-assignments` renders a **blank page**; users only ever arrive via client-side navigation. (Will incidentally be fixed by the react-router phase — behavior change is acceptable/desired.)
  - Cold load of `/admin/*` redirects to `/` because the role subscription isn't ready when the route trigger runs.
  - The tabular (DataTables) tables refresh lazily after inserts — not a reliable test oracle; specs assert reactive signals instead (form reset, sidebar entry).
  - "Zusage" email is sent when the assignment is **closed**, not when the coordinator stages an applicant as participant.
  - metismenu sidebar submenus collapse on reactive re-renders (click retries needed).
- 🔄 in progress: remaining characterization specs (registration, cancel/reenable emails, notifications, profile, admin pages, password reset)

## Phase 1 — React 15 → 18
- ✅ React 18.3.1 + TypeScript 5.9 (from 15.7 / 2.3!) — surprisingly only 9 type errors
- ✅ AssignmentPanelFooter: last mixin user → `useTracker` function component
- ✅ react-meteor-data 0.2 → 2.5.1; react-addons-*/react-mixin/smart-mixin/react-bootstrap removed
- ⚠️ `react-template-helper` still mounts via legacy `ReactDOM.render` (deprecation warning) — disappears with the router swap in Phase 4
- ⚠️ `prop-types`/`create-react-class` re-added ONLY as peers of legacy react-bootstrap-daterangepicker — remove together with it in Phase 2
- ✅ Validated: tsc clean, 101 unit tests, suite 17/17, React 18.3.1 confirmed in client

## Phase 2 — Blaze → React
Migrated so far (each committed individually, suite 17/17 after each):
- ✅ Dashboard (+DashboardPanel)
- ✅ notificationsDropdown (open state in React, mark-seen on close preserved)
- ✅ InfoSite, GroupMembers (first DataTable use)
- ✅ ManageApplicants (accept/deny; new `groupApplicants` publication; `groupMembers` pub now includes emails)
- ✅ Login + forgot-password modal, ResetPassword (InlineAlerts replaces global bootstrapAlerts on these screens)
- ✅ ModifyProfile (hand-rolled forms per ADR 0003; autosave settings; password change)
- ✅ RegisterInGroup wizard (SimpleSchema named-context validation kept)

Infrastructure built: `client/react/components/DataTable.tsx` (tabular/DataTables replacement, keeps dataTables_* classes), `InlineAlerts.tsx`.

- ✅ AdminUsers (react-select multi-selects, `adminAllUsers` publication; slide animations dropped)
- ✅ ModifyGroups (insert/update panels; spec 02 moved to react-select selectors)
- ✅ **assignmentForm** (react-datepicker replaces jQuery datetimepicker; collection2 validation path; hidden start/end inputs kept for tests)
- ✅ **assignmentManager** (React state instead of ReactiveArrays; modal mounts via createRoot — Blaze-shell hop inside bootbox unmounted the React tree; bootbox confirms kept)
- ⚠️ Learned: conditional `Meteor.subscribe` inside one `useTracker` computation flaps ready state → endless re-renders. Use separate trackers keyed by deps.
- New npm deps: react-select, react-datepicker, date-fns.

- ✅ singleAssignmentView (detail page; embeds React AssignmentForm; same-day previews)
- ✅ manageAssignments page (react-datepicker range filter; selection/clipboard in state; new `assignmentsForGroupTable` publication)
- ✅ copyAssignments (week copy, quick-select buttons)
- ✅ showOverview (month pagination, filters, lazy week accordion)
- ✅ Cleanup: 9 atmosphere packages removed (autoform, tabular, select2×3, jquery-ui, reactive-modal, reactivearray, bootstrap-3-modal) + jQuery daterangepicker/datepicker npm stack + all dead Blaze glue files

**Phase 2 complete.** Every page/feature template is React. Only the layout shells remain Blaze by design (MainLayout, Sidebar, ParallaxScreen + the `{{> React}}` wrapper templates) — they fall together with flow-router in Phase 4.

⚠️ Behavior notes (intentional, suite-validated):
- Empty optional form fields are stored as `undefined`, not `""` (AutoForm stored empty strings)
- jQuery slide animations on admin edit panels dropped
- showOverview filter state no longer persists across page navigation (was a module-level ReactiveVar)

## Phase 3 — Meteor 3 (NOT in this PR — next project)
Deliberately stopped before this step. Honest scoping after Phase 2:
1. **Isomorphic domain layer must go async.** The classes in `collections/lib/classes/` (User, Group, Assignment, …) call `findOne()/fetch()/count()` synchronously and run on BOTH client (minimongo, stays sync) and server (Fibers gone in Meteor 3 → must be `*Async`). This needs an explicit design decision (split client/server paths vs. async-everywhere) — not something to decide overnight without review.
2. **simpl-schema migration.** aldeed:simple-schema v1 (atmosphere) → npm simpl-schema + collection2 v4; all schema definitions need porting.
3. Remaining atmosphere packages need M3-compatible versions: alanning:roles v4 (role document format migration!), flow-router-extra, blaze-layout (or go straight to Phase 4 first), publish-composite, publish-counts, collection-helpers, ongoworks:security, emgee:libphonenumber (→ npm libphonenumber-js), mizzao:bootboxjs (→ React modals), mrt:gsap (→ npm gsap or CSS).
4. `.github/workflows/dockerpublish.yml` meteor-release pin + `Dockerfile` (node:14 + fibers!) must change in the same step.

Recommendation: do Phase 4 (router swap) BEFORE Meteor 3 — it removes blaze-layout, react-template-helper, blaze-html-templates and the layouts, shrinking the package surface further.

## Phase 4 — react-router ✅ (added to this PR after review continued)
- ✅ flow-router + BlazeLayout → **react-router v6** (`lib/client/routes.tsx`); guards as components. **Blaze is completely gone** (blaze-html-templates → static-html; react-template-helper, blaze-layout, spacebars, gsap, bootstrap-alerts, subs-cache, jquery-scrollto removed — 9 more packages).
- ✅ MainLayout/Sidebar/ParallaxScreen React; metisMenu JS + TweenLite + vendored jQuery pickers + customTemplateHelpers deleted.
- ✅ Reactive `Routes.getParam()` bridge keeps Tracker reactivity for non-component code; isomorphic link building in `lib/RoutePaths.ts`.
- 🐛→✅ Fixed for real (not just documented): cold-load blank page on /manage-assignments, admin cold-load redirect (guard now waits for the roles null-publication), two subscription races that crashed the React tree on cold loads (Dashboard pendingGroups, ShowOverview group doc).
- ⚠️ ADR 0004: react-router **v6** not v7 — v7's `import.meta` breaks Meteor 2.7's bundler. Bump with Meteor 3.
- Validated: tsc clean, 101 unit tests, suite 17/17 ×3.

## Phase 5 — Bootstrap 5 + dependency sweep (NOT in this PR)
All React components intentionally still emit Bootstrap-3 markup (panel/btn-xs/col-xs…). The BS3→BS5 class sweep stays one atomic, suite-validated step. Tier-3 list unchanged (moment→dayjs etc.).

## Open items / decisions made autonomously
- App port 4000 + Mailpit 11025/18025 locally (port conflicts with unrelated containers); CI keeps port 3000.
- **CI on master was already broken**: GitHub hard-fails `actions/upload-artifact@v3` since 2024, so the test/docker jobs died at job setup. Bumped checkout/cache/upload-artifact to v4 and CodeQL to v3 in this PR.
