# Incremental modernization on Meteor 3 instead of a Next.js rewrite

Status: accepted (2026-06-09) — supersedes the rewrite plan in `cline_docs/` (Next.js + Mantine + PostgreSQL/Drizzle + NextAuth)

The app runs on Meteor 2.7.3 with three parallel view layers (Blaze, React 15 via wrapper templates, jQuery/Bootstrap-3 plugins). A complete rewrite to Next.js with a MongoDB→PostgreSQL migration was documented in `cline_docs/`, but it leaves nothing runnable until nearly everything is finished — incompatible with autonomous, Playwright-validated migration in small steps, and it adds data- and auth-migration risk for a working production app.

We instead modernize in place: upgrade to Meteor 3.x (modern Node, async API), migrate all Blaze templates to modern React, remove the jQuery/AutoForm/Bootstrap-3 ecosystem, and keep MongoDB and Meteor Accounts. The app must stay deployable after every step. A future Next.js migration remains possible but is explicitly out of scope.
