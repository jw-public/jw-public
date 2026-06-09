# Migration Log — Overnight Run (2026-06-09)

One line per step: ✅ done · ⏭️ skipped · ↩️ reverted (with reason). This file is the morning report.

## Phase 0 — Foundation
- ✅ Plan + ADRs 0001/0002 committed on branch `modernization`
- ✅ Baseline established: `tsc` clean, 101 Mocha unit tests green (coverage 90 % stmts)
- ✅ Meteor 2.7.3 installed locally (x86_64 under Rosetta — Apple Silicon launcher refused arm64)
- ✅ Mailpit running on host ports 11025 (SMTP) / 18025 (UI+API) — 1025/3000 were taken by another project, app therefore runs on port 4000
- ✅ Playwright scaffolding in `e2e/` (own package.json, modern Node, `E2E_BASE_URL` env)
- 🔄 in progress: characterization specs against the unchanged app

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
