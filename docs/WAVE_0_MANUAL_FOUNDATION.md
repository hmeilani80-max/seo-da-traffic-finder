# Wave 0 / Wave 1 — Manual Reconciliation

Branch: `wave0-manual-foundation`

## What we discovered

The Lovable production database was already ahead of the GitHub migration folder. Four migrations had been applied directly to production on 2026-09-09 but were missing from source control:

- `20260909200729` — Wave 0 workspace/security/evidence/import foundation
- `20260909200912` — automatic workspace assignment trigger
- `20260909200958` — project evidence Storage policies
- `20260909201303` — Wave 1 project profile, AI intelligence, field suggestions, and project data-source registry

Those applied migrations are now mirrored into `supabase/migrations/` so the repository reflects the production schema.

## Current production foundation

Production already has:

- `app_workspaces`
- `app_workspace_members`
- `workspace_id` on `projects`, `placement_orders`, and `backlinks`
- project lifecycle/profile fields
- `project_evidence`
- `data_imports`
- `project_intelligence_runs`
- `project_field_suggestions`
- `project_data_sources`
- `project-evidence` Storage bucket and RLS policies
- automatic workspace assignment for new project-scoped rows

The existing owner-based RLS policies remain in place. Workspace-member policies are also active on project-scoped data.

## Membership repair

Manual validation found:

- 2 existing authenticated users
- 1 internal workspace (`internal-seo-team`)
- 0 active workspace memberships

This made the Wave 1 workspace-scoped tables unusable even though their schema existed.

The two accounts that existed before the repair cutoff were added as active members of the internal workspace. The matching idempotent repair SQL is tracked in:

`20260909233000_seed_existing_workspace_members.sql`

Future public signups are intentionally **not** auto-added to the internal workspace.

## Verification completed

- GitHub Actions clean build: PASS
- existing production row counts before repair:
  - projects: 0
  - placement_orders: 0
  - backlinks: 0
- active workspace members after repair: 2/2 existing auth users
- transaction/rollback RLS test:
  - project insert automatically received a workspace: PASS
  - project data-source insert under workspace RLS: PASS
  - second workspace member can read the shared project: PASS
  - non-member cannot read the shared project: PASS
- test rows were rolled back; no operational test data remains

## AI abstraction in this branch

- `src/lib/ai/types.ts`
- `src/lib/ai/provider.server.ts`
- `AI_PROVIDER=openai` default

Existing Backlink Recommendation continues using the current OpenAI helper unchanged. New SEO OS workflows can migrate to the provider-neutral entry point incrementally.

## Explicitly unchanged

- authentication UI/flow
- production navigation/sidebar
- current Projects page
- Domain Research
- Keyword Research
- Backlink Recommendation
- current Ahrefs/Apify cache/provider implementation
- existing operational data

## Important security note

Public account registration currently exists in `src/routes/auth.tsx`. Because this is an internal workspace model, new accounts must not automatically receive membership in `internal-seo-team`. Workspace onboarding/invitation should be implemented deliberately in a later access-management step.

## Recommended next implementation

Proceed to the Project Workspace UI using the schema already present in production. Adapt the donor `origin-wave-01-rebuild-github` only for UX/information hierarchy; do not port Firebase, React Router, Drizzle, or Express.
