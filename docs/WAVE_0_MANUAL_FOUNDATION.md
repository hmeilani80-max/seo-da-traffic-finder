# Wave 0 — Manual Foundation Implementation

Branch: `wave0-manual-foundation`

This implementation is intentionally additive and does not change navigation or feature pages.

## Added

### Workspace authorization foundation

- `app_workspaces`
- `app_workspace_members`
- membership/admin helper functions
- one personal `SEO Workspace` per existing operational owner
- additive `workspace_id` on `projects`, `placement_orders`, and `backlinks`
- automatic workspace assignment for new rows so existing client code can continue to insert records unchanged
- shared workspace **read** policies on Projects, Placement Orders, and Backlinks

The original owner-based RLS policies are intentionally preserved during Wave 0. Shared write access is not enabled yet.

### Evidence/import foundation

- `project_connections`
- `project_evidence`
- `data_imports`
- project/workspace-consistent foreign keys
- workspace-member RLS

No storage bucket or file parser is provisioned in this wave. Those are Wave 1 implementation concerns.

### AI abstraction foundation

- `src/lib/ai/types.ts`
- `src/lib/ai/provider.server.ts`
- `AI_PROVIDER=openai` default

Existing OpenAI backlink recommendation is intentionally not refactored in this wave. New AI workflows can use the provider-neutral entry point; the existing path remains unchanged to minimize regression risk.

`lovable` is reserved as a provider name but fails closed until a verified managed-AI adapter is implemented. No undocumented Lovable AI endpoint is assumed.

## Explicitly not changed

- existing routes and sidebar
- authentication flow
- Domain Research
- Keyword Research
- Backlink Recommendation
- existing provider/cache code
- generated Supabase integration files/types
- existing production records

## Migration behavior

The migration backfills existing operational rows into a personal workspace based on their existing `user_id`; it does not alter `user_id`.

For new rows, a database trigger assigns the selected Project workspace where applicable, otherwise the owner's personal workspace. This keeps the current application insert calls compatible.

## Before merging to main

1. Run a clean application build/typecheck.
2. Review the SQL migration against the current production schema.
3. Apply the migration in a controlled environment.
4. Verify existing row counts before/after.
5. Verify login.
6. Verify Projects, Placement Orders, Domain Research, Keyword Research, and Backlink Recommendation.
7. Verify an authorized second workspace member can read a shared Project, while a non-member cannot.
8. Do not enable shared writes until Wave 1 UI/service behavior is tested.

## Rollback note

Do not destructively roll back by dropping existing operational data. If the workspace layer must be disabled, first remove the additive workspace read policies/triggers, then leave the new columns/tables in place until data dependencies are audited.
