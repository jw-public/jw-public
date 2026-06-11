# jw-public

jw-public is an open source tool designed to help Jehovah's Witnesses organize public witnessing activities. It provides a central hub for managing groups, assignments and the people who staff them.

## Features

- **User management**: registration with group application, coordinator approval, admin user administration
- **Group management**: create and edit groups, manage coordinators and members
- **Assignment management**: create assignments, members apply, coordinators accept applicants and close assignments, week-by-week copying
- **Notifications**: in-app notifications plus email (acceptance, cancellation, re-enabling), templates in German, English and French
- **Kubernetes**: production deployment manifests included

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Meteor 3.3 (Node 22, async/await — no fibers) |
| Frontend | React 18, react-router v6, Bootstrap 5 |
| Language | TypeScript (compiled natively by Meteor's `typescript` package) |
| Database | MongoDB (bundled by Meteor in development) |
| Unit tests | mocha 11 + tsx (runs the TS sources directly), coverage via c8 |
| E2E tests | Playwright + Mailpit (email assertions) |
| Lint/format | ESLint 9 + Prettier (CI-gated) |

Architecture decisions live in [`docs/adr/`](docs/adr/); the 2026 modernization is documented step by step in [`docs/modernization/MIGRATION_LOG.md`](docs/modernization/MIGRATION_LOG.md).

## Local development

### Prerequisites

- [Meteor](https://docs.meteor.com/about/install.html) (the version pinned in `src/.meteor/release`)
- Docker (only for the Mailpit mail catcher)

### Start the app

```bash
cd src
meteor npm install
meteor npm run dev   # starts the Mailpit container + the app on :4000
```

The app is now at <http://localhost:4000>, the Mailpit inbox at <http://localhost:18025>.

On the first start against an empty database the app seeds itself with an admin account and a default group (`Standardgruppe`):

| Field | Value |
|---|---|
| Login | `admin@trolley.com` |
| Password | `admin3210` |

Notes:

- Port 4000 is just a convention to avoid clashes; any port works. CI uses 3000.
- If file changes are not picked up (some sandboxed/macOS setups), start with `METEOR_WATCH_FORCE_POLLING=true`.
- `npm run compile` is a pure type-check (`tsc --noEmit`) — Meteor compiles the TypeScript itself.
- After adding/removing Meteor packages run `npm run types` (regenerates the type stubs zodern:types places under `.meteor/local/types`; a running dev server does this automatically).
- Commits run `eslint --fix` + Prettier on the staged files (husky + lint-staged).

## Manual testing

A quick tour that touches every core flow (all email lands in Mailpit, <http://localhost:18025>):

1. **Login** as `admin@trolley.com` / `admin3210`.
2. **Create an assignment**: sidebar → *Gruppe Standardgruppe* → *Einsätze verwalten* → fill the form (date, time, user goal) → *Speichern*. It appears in the table and on the group's *Termine* overview.
3. **Apply as a member**: open *Übersicht* → group's month view → expand the week → *Bewerben* on the assignment panel. The panel turns yellow (*Bewerbung zurückziehen*).
4. **Accept & close as coordinator**: on the same panel open the gear menu → *Abschließen* → toggle the applicant into the participant column → *Termin abschließen* → confirm. The panel turns green (*Angenommen.*) and a **"Zusage" email** arrives in Mailpit.
5. **Cancel & re-enable**: gear menu → *Absagen*, enter a reason → panel turns red, an "Absage" email goes out. Gear menu → *Termin stattfinden lassen* reverses it.
6. **Notifications**: the bell in the top bar shows unread events from steps 4–5; opening it marks them seen, *Benachrichtigungen entfernen* clears them.
7. **Registration**: log out, open the group's *Registrierungs-Link* (sidebar) in a private window, complete the two-step wizard. Back as admin: accept the applicant under *Offene Gruppenbewerbungen*.
8. **Password reset**: *Passwort vergessen?* on the login screen — the reset link arrives in Mailpit.

## Automated tests

```bash
# Unit tests (mocha on the TS sources, no Meteor runtime needed)
cd src
npm test              # type-check + unit tests
npm run test:watch    # watch mode
npm run test:coverage # c8 coverage report -> ../coverage-report

# Lint & formatting (both are CI gates)
npm run lint
npm run format:check

# End-to-end suite (needs the app running on :4000 and Mailpit, see above)
cd ../e2e
npm ci
npx playwright install chromium
npx playwright test
```

The Playwright suite (17 specs) is the regression oracle for the whole app — login, group management, the full assignment lifecycle including email assertions, registration, notifications and password reset. Defaults: `E2E_BASE_URL=http://localhost:4000`, `MAILPIT_URL=http://localhost:18025` (override via env).

**Heads-up:** never edit files under `src/` while the e2e suite is running — the dev server hot-reloads mid-test and produces misleading failures.

The suite also pins six core views as visual snapshots (`tests/00-visual.spec.ts`). The PNGs are Linux renderings and only compared in CI; to update them, let CI fail once and commit the actuals from the `playwright-report` artifact.

## CI & deployment

GitHub Actions ([`dockerpublish.yml`](.github/workflows/dockerpublish.yml)) runs on every PR: type-check, lint, format check, unit tests, the full Playwright suite against a production-like app, a Docker image build (hadolint-checked) and the user-docs build. Pushes to `master` publish the image. Kubernetes manifests for production are in [`kubernetes/`](kubernetes/).

## Directory structure

| Path | Contents |
|---|---|
| `src/` | the Meteor application |
| `src/client/` | React UI (layouts, templates, shared components in `client/react/`) |
| `src/server/` | publications, methods, security rules, the service graph (`server/services.ts`) |
| `src/collections/` | collection definitions, schemas, client-side domain helpers |
| `src/lib/`, `src/imports/` | isomorphic helpers (routing, i18n, logging, interfaces) |
| `src/tests/` | unit tests (mocha) |
| `e2e/` | Playwright characterization suite |
| `docs/adr/` | architecture decision records |
| `docs/modernization/` | plan and log of the 2026 modernization |
| `userdocs/` | end-user documentation site |
| `kubernetes/` | production deployment manifests |
| `orga/translation/` | translation source files |
