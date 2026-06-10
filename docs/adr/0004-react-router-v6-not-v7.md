# react-router v6 instead of v7

Status: accepted (2026-06-10) — revisit at the Meteor 3 upgrade

The plan said react-router v7, but its browser build uses `import.meta`, which Meteor 2.7's bundler cannot parse — the whole client module bundle fails with a page-wide SyntaxError. v6 has an identical API surface for everything this app uses (createBrowserRouter, RouterProvider, Outlet, Navigate, Link, router.subscribe), so we pinned v6. Bump to v7 once the app runs on Meteor 3 (modern bundler).

## Update 2026-06-10 (Meteor 3.3.2)

Re-tested on Meteor 3.3.2 during Phase 5: `import.meta` still breaks the
bundle (`SyntaxError: Cannot use 'import.meta' outside a module` followed by
a dead client). Meteor's linker has no import.meta support even on 3.3.
v6 stays pinned; revisit when Meteor's bundler (or an rspack-based build,
Meteor 3.4+) supports import.meta.
