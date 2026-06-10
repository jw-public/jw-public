# Modernization Plan — Overnight Run (2026-06-09)

Decisions agreed with Dominik (see ADRs 0001, 0002):

- **Incremental on Meteor 3**, no Next.js rewrite, MongoDB + Meteor Accounts stay (ADR 0001).
- **Bootstrap 5 + react-bootstrap, visual parity** — no redesign (ADR 0002).
- **Playwright characterization suite first**, written against the unchanged app; it is the oracle for every step. Cypress is removed (its 2 specs get ported). Mailpit asserts emails.
- **Forms:** SimpleSchema stays the single source of truth; AutoForm/uniforms-bootstrap3 → uniforms v4 + bootstrap5 theme.
- **Router:** flow-router(+BlazeLayout) stays during migration; one atomic swap to react-router v7 at the end.
- **Dependency tiers:** Tier 1 dies tonight (jQuery ecosystem, bootbox, select2, datetimepickers, metismenu, autoform, create-react-class, flow-router); Tier 2 upgraded in place (React 18, Bootstrap 5, Meteor 3.x, InversifyJS, SimpleSchema, moment 2.x latest, TS); Tier 3 explicitly deferred (moment→dayjs, SimpleSchema→zod, DB, redesign). `aldeed:tabular` → TanStack Table.

## Phases

| # | Phase | Exit criterion |
|---|-------|----------------|
| 0 | Foundation: app runs locally (docker-compose + Mongo + Mailpit), deterministic seed script, Playwright suite green against UNCHANGED app | Suite green on legacy app |
| 1 | React 15 → 18: 11 existing components → function components + hooks; Blaze↔React bridge on `createRoot` | Suite green |
| 2 | Blaze → React template-by-template: leaves → forms (AutoForm→uniforms) → pages → layout/sidebar last. Bootstrap-3 classes are KEPT in new components | Suite green after each template; no Blaze templates left except layout glue |
| 3 | Meteor 2.7 → 3.x: server async/await migration, atmosphere package surface minimal | Suite + unit tests green |
| 4 | Router swap: flow-router/BlazeLayout → react-router v7 | Suite green |
| 5 | Bootstrap 3 → 5 sweep (one atomic step) + dependency cleanup | Suite green, visual check |
| 6 | Final report | MIGRATION_LOG.md complete |

## Loop rules

1. Branch `modernization`; master is never touched. Commit after EVERY green step (small commits, descriptive messages).
2. A step = smallest unit that can be validated (one template, one package swap, one phase gate).
3. After each step: targeted Playwright spec(s) for the touched area, then full suite at phase gates. Unit tests (`npm test`) must stay green from Phase 3 on (they run against compiled TS; before Phase 3 they run as today).
4. On red: up to 3 fix attempts. Still red → `git checkout`/revert the step, log it in MIGRATION_LOG.md under "Skipped/Blocked", continue with the next item. Never leave the branch red.
5. Never delete a Blaze template before its React replacement passes its spec.
6. MIGRATION_LOG.md gets one line per step (done/skipped/reverted + reason). This file is the morning report.
7. Out of scope tonight (hard no): Tier-3 swaps, redesign, schema changes, prod deployment changes beyond what the app needs to run.
8. **Goal: a green PR.** Branch `modernization` is pushed and a PR against `master` is opened; the GitHub Actions checks (`test`, `docker`, CodeQL) must pass. Consequences: `.github/workflows/dockerpublish.yml` must swap Cypress→Playwright (and drop `record: true`); on the Meteor-3 phase the pinned `meteor-release: 2.7.3` and the `Dockerfile` (node:14 + fibers) must be updated in the same step.

## Status

- [x] Plan agreed, ADRs 0001/0002/0003 written
- [x] Phase 0 — Playwright suite (17 specs) green vs legacy app, Mailpit email assertions, Cypress removed
- [x] Phase 1 — React 18.3, TypeScript 5.9, react-meteor-data 2.5 (hooks)
- [x] Phase 2 — all page templates React; tabular/AutoForm/select2/jquery-ui stack removed
- [ ] Phase 3 — Meteor 3 (scoped in MIGRATION_LOG; package surface now minimal)
- [x] Phase 4 — react-router v6 + layouts; Blaze fully removed (ADR 0004)
- [ ] Phase 5 — Bootstrap 3→5 sweep
- [x] Phase 6 — MIGRATION_LOG.md is the report
