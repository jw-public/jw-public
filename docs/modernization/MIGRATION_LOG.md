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
(pending)

## Phase 2 — Blaze → React
(pending)

## Phase 3 — Meteor 3
(pending)

## Phase 4 — react-router
(pending)

## Phase 5 — Bootstrap 5 + dependency sweep
(pending)

## Open items / decisions made autonomously
- App port 4000 + Mailpit 11025/18025 locally (port conflicts with unrelated containers); CI keeps port 3000.
