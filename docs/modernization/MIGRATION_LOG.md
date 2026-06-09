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

Still Blaze: showSingle, showOverview shell (+ paginator/weekView), ManageAssignments page shell, CopyAssignments, Sidebar/MainLayout/ParallaxScreen (layouts stay for Phase 4 router swap). Dead stubs (manage-blueprints, emailserver settings) untouched.

## Phase 3 — Meteor 3
(pending)

## Phase 4 — react-router
(pending)

## Phase 5 — Bootstrap 5 + dependency sweep
(pending)

## Open items / decisions made autonomously
- App port 4000 + Mailpit 11025/18025 locally (port conflicts with unrelated containers); CI keeps port 3000.
