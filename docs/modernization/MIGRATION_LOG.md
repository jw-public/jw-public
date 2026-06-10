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

## Phase 3 (continued) — Meteor 3 async sweep (branch meteor3)
- ✅ Server domain layer fully async: publish.ts/methods.ts/security.ts rewritten; all 11 assignment controller classes + UserFactory/UserSettingsReaderFactory/UserMailer on `*Async` APIs; interface contracts annotated `Promise<...>`
- ✅ Unit tests adapted: minimongo-standalone test double got `*Async` shims (Promise-wrapped sync calls — same as client minimongo); all test call sites await; throw-assertions became rejection-assertions. **101/101 green**, tsc clean.
- 🐛→✅ `/logout` cold-load race: on Meteor 3 the client briefly looks "settled" before the DDP connection is up; calling `Meteor.logout()` in that window is a server no-op and the resume login re-establishes the session (and wedges `Meteor.loggingIn()` at `true`, which also blanks the login form — broke specs 01/07/08). Logout route now waits for `connected && !loggingIn` and stays mounted until the user is really gone.
- ✅ Reset-password URL had `//` (ROOT_URL trailing slash) — normalized.
- ⚠️ Lesson: never edit files under src/ while the Playwright suite runs — the dev-server rebuild hot-code-pushes mid-test and produces identical-looking timeout failures across specs.
- ‼️ **Build-pipeline gotcha (cost ~2h):** the app has NO `typescript` Meteor package — Meteor bundles the **tsc-emitted `.js` files** (`npm run compile`), the `.ts/.tsx` sources are invisible to it. Every TS edit needs `npm run compile` before the dev server/e2e sees it. (Candidate for Phase 5: add the `typescript` package and make tsc `noEmit`.) Sandboxed dev server also needs `METEOR_WATCH_FORCE_POLLING=true` on macOS.
- 🐛→✅ bootbox 5 + Bootstrap 3: dialogs keep template `aria-hidden="true"` when shown (BS4+ removes it, BS3 never) → visible dialogs invisible to `getByRole`; broke specs 03/04/05/10 whenever focus sat outside the dialog. vendor.ts now strips `aria-hidden` on `show.bs.modal`.
- 🐛→✅ Meteor 3 client writes validate against the `insertAsync/updateAsync/removeAsync` allow keys — groups registering only the legacy sync keys leave client writes deny-by-default (broke notification clearing). security.ts registers every rule under both keys.
- 🐛→✅ SimpleSchema `custom` validators are sync → the two `Group.groupExists()` (`.count()`) checks in Users.ts blew up `createUser`/`addToGroup` on M3. Moved to async `Accounts.validateNewUser` resp. covered by `addToGroup`'s existing group fetch.
- ✅ **Meteor 3.3.2 green: 101/101 unit tests, 17/17 Playwright (50.8s)**
- ✅ CI meteor pin 2.16→3.3.2 + Dockerfile node:14+fibers → node:22 (same step, per plan)

## Phase 4 — react-router ✅ (added to this PR after review continued)
- ✅ flow-router + BlazeLayout → **react-router v6** (`lib/client/routes.tsx`); guards as components. **Blaze is completely gone** (blaze-html-templates → static-html; react-template-helper, blaze-layout, spacebars, gsap, bootstrap-alerts, subs-cache, jquery-scrollto removed — 9 more packages).
- ✅ MainLayout/Sidebar/ParallaxScreen React; metisMenu JS + TweenLite + vendored jQuery pickers + customTemplateHelpers deleted.
- ✅ Reactive `Routes.getParam()` bridge keeps Tracker reactivity for non-component code; isomorphic link building in `lib/RoutePaths.ts`.
- 🐛→✅ Fixed for real (not just documented): cold-load blank page on /manage-assignments, admin cold-load redirect (guard now waits for the roles null-publication), two subscription races that crashed the React tree on cold loads (Dashboard pendingGroups, ShowOverview group doc).
- ⚠️ ADR 0004: react-router **v6** not v7 — v7's `import.meta` breaks Meteor 2.7's bundler. Bump with Meteor 3.
- Validated: tsc clean, 101 unit tests, suite 17/17 ×3.

## Phase 5 — Bootstrap 5 + dependency sweep (branch phase5)
- ✅ **Bootstrap 3.4.1 → 5.3.8** (one atomic sweep, suite-validated 17/17 + visual screenshot check):
  - BS5 dist CSS vendored as `client/lib/bootstrap5.import.less` (CSS-as-LESS keeps cascade order deterministic; empty custom props `--x: ;` patched to `initial` — the LESS 4 parser rejects them); vendored BS3 LESS (5491 lines) deleted
  - Class sweep over all 25 React component files: panel→card (+card-primary/green/red/yellow/danger/info variants in sb-admin-2.less), col-xs→col, col-md-offset→offset-md, btn-xs→btn-sm, btn-default→btn-outline-secondary, pull-*→float-*, sr-only→visually-hidden, label→badge text-bg-*, control-label→form-label, input-group-addon→input-group-text, `in`→`show`, data-toggle→data-bs-toggle, caret spans dropped
  - Deliberate BS3 *bridge styles* in custom.less (markup unchanged, parity-first): html 14px baseline, .page-header, .form-group, .radio-inline/.checkbox, .well, ul.pagination>li>a, hidden radios in btn-groups, dropdown-menu li>a, .navbar-toggle hamburger
  - sb-admin-2 theme ported (topbar rebuilt as block layout `.sb-admin-topbar`, sidebar nav styles inlined — BS5 navbar is flex)
  - BS3 LESS vars/mixins the template styles needed re-created in variables.less/mixins.less (.card-variant replaces .panel-variant)
  - **bootbox 5 → 6** (BS5 templates). Gotcha: the locales register on the package main `dist/bootbox.js`, NOT on `bootbox.all.min.js` (separate module instance) — `setLocale("de")` silently no-ops otherwise
  - Specs: 3 selectors followed the markup (div.panel→div.card etc.)
- ✅ Dependency cleanup (npm 10 strict peers, CI-validated): jquery 2→3.7, mocha-jenkins-reporter ^0.4.8, sinon-chai & typedoc removed
- ✅ **CVE sweep** (production tree clean): underscore→1.13.8, marked 3→4 (mail pipeline; stale 0.x typings removed), moment-timezone→0.5.48, meteor-node-stubs→1.2.27 (bundled browser crypto polyfills). ONE accepted prod finding: qs (moderate, DoS edge case) sits in node-stubs' bundledDependencies — not overridable.
- ✅ **Unit-test pipeline modernized (branch tooling)**: the 2017 Babel-6 stack (babel-cli/core/register/preset-es2015/-es2016, istanbul, isparta, remap-istanbul, mocha-jenkins-reporter) is GONE — Node 22 runs the tsc output (ES2017) natively; `npm test` = tsc + plain mocha 11, coverage via c8. npm audit: 66 → 4 (all dev-only/accepted: mocha-latest's own diff/serialize-javascript pins + the qs note above).
- ⛔ **`typescript` Meteor package is BLOCKED**: InversifyJS uses constructor **parameter decorators** (`@inject(...)`) — a TypeScript-only feature Babel cannot compile, and Meteor's typescript package is Babel-based. Prerequisite: migrate DI away from parameter decorators (e.g. property injection or factory bindings). Until then the tsc-emit pipeline stays (`npm run compile` after every TS edit!).
- Tier 3 REMAINING (deliberately separate steps): moment→dayjs, bootbox→React modals, DI ohne Parameter-Decorators → dann `typescript` Meteor package, SimpleSchema→zod, React 19, inversify 8, chai/mocha/sinon majors, marked 18, jquery 4

## Open items / decisions made autonomously
- App port 4000 + Mailpit 11025/18025 locally (port conflicts with unrelated containers); CI keeps port 3000.
- **CI on master was already broken**: GitHub hard-fails `actions/upload-artifact@v3` since 2024, so the test/docker jobs died at job setup. Bumped checkout/cache/upload-artifact to v4 and CodeQL to v3 in this PR.
