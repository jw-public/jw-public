# Hand-rolled React forms instead of uniforms

Status: accepted (2026-06-09) — amends the forms decision in PLAN.md

The plan was AutoForm → uniforms with SimpleSchema as the single source of truth. During migration two facts emerged: the "existing uniforms pattern" in the codebase was a never-finished stub (`SimpleForm`/`ManageBlueprintsComponent` render "Not implemented"), and uniforms v4 has no bridge for the atmosphere SimpleSchema v1 that all collections use — adopting uniforms would force a simpl-schema(npm) migration of every collection first.

Instead the React forms are plain controlled components. SimpleSchema remains the single validation source: client and server still validate through aldeed:collection2 on insert/update, exactly as AutoForm did. A future uniforms/zod adoption stays possible per form; this decision avoids coupling the Blaze migration to a schema-library migration.
