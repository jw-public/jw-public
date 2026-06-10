# react-router v6 instead of v7

Status: accepted (2026-06-10) — revisit at the Meteor 3 upgrade

The plan said react-router v7, but its browser build uses `import.meta`, which Meteor 2.7's bundler cannot parse — the whole client module bundle fails with a page-wide SyntaxError. v6 has an identical API surface for everything this app uses (createBrowserRouter, RouterProvider, Outlet, Navigate, Link, router.subscribe), so we pinned v6. Bump to v7 once the app runs on Meteor 3 (modern bundler).
