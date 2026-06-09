# Bootstrap 5 with visual parity instead of a UI redesign

Status: accepted (2026-06-09)

The modernization migrates every view to React in one autonomous, Playwright-validated run. We chose Bootstrap 5 + react-bootstrap over Mantine (the `cline_docs/` plan) or Tailwind because it keeps the migration mechanical: each Blaze/Bootstrap-3 template translates to near-identical markup, so "looks like before and works" is an objectively checkable criterion and no design decisions are delegated to the autonomous agent.

Principle: **functionally identical, visually as close as practical.** Consolidation and redesign are separate projects — mixing them makes Playwright diffs unattributable (bug vs. intentional change). A redesign can follow later on the consolidated React codebase.
