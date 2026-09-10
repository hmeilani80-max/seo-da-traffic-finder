# Wave 0 — Architecture & Security Foundation

Status: **CLOSED / COMPLETE**

Completion date: **10 September 2026**

Production project: **SEO DA & Traffic Finder / Backlink Manager**

## Scope completed

Wave 0 establishes the minimum safe foundation required for the Project-centered SEO Operating System without rebuilding or destructively changing the existing production application.

### 1. Team/workspace authorization

Implemented:

- `app_workspaces`
- `app_workspace_members`
- additive `workspace_id` on `projects`, `placement_orders`, and `backlinks`
- membership-based RLS policies
- existing `user_id` retained as creator/ownership metadata
- automatic workspace assignment for new Project/Placement/Backlink rows
- existing authenticated users provisioned into the internal workspace

Current production validation on 10 September 2026:

- internal workspaces: **1**
- authenticated users: **2**
- active workspace members: **2**
- projects without `workspace_id`: **0**
- placement orders without `workspace_id`: **0**
- backlinks without `workspace_id`: **0**

Public signup does **not** automatically grant access to the internal workspace. Future membership onboarding must remain deliberate.

### 2. AI abstraction foundation

Implemented:

- provider-neutral entry point in `src/lib/ai/provider.server.ts`
- shared AI request/result types in `src/lib/ai/types.ts`
- default provider explicitly documented as `AI_PROVIDER=openai`
- existing OpenAI Backlink Recommendation kept intact
- factual SEO metrics remain outside the generative AI layer
- unsupported provider configuration fails explicitly instead of silently falling back to fabricated output

This satisfies the Wave 0 abstraction requirement. Provider-specific adapters can be added incrementally in later waves without coupling feature UI directly to one AI provider.

### 3. Evidence/import foundation

Implemented:

- private `project-evidence` Storage bucket
- `project_evidence`
- `data_imports`
- extraction/processing status fields
- structured mapping and normalization summary fields
- source/provenance fields
- Storage RLS policies for authenticated upload/update/delete and workspace-member reads

The Wave 0 layer intentionally provides infrastructure only. The user-facing Evidence and Import workflows belong to Wave 1.

### 4. Production schema reconciliation

The Lovable production database had Wave 0/1 migrations that were previously ahead of GitHub source control. The production-applied migrations are mirrored in `supabase/migrations/`:

- `20260909200729_35d67f14-73bf-4e6d-840a-00c1f7e021e7.sql`
- `20260909200912_df1c0a32-f32b-43b2-b3e9-662c48c47a5b.sql`
- `20260909200958_eba0a4f3-ef81-4ff4-bfd9-f16a66d06d61.sql`
- `20260909201303_6868370a-cc6c-412e-9b01-f5c205f88e2f.sql`
- `20260909233000_seed_existing_workspace_members.sql`
- `20260909233100_project_evidence_bucket.sql`

No destructive migration was required.

### 5. Repeatable verification

A production-safe verification script is tracked at:

`supabase/tests/wave0_foundation.sql`

It verifies:

- required Wave 0 tables exist
- RLS is enabled on the workspace/project foundation tables
- internal workspace and active membership exist
- no existing Project/Placement/Backlink row is orphaned from a workspace
- the Evidence bucket exists and remains private
- automatic workspace assignment triggers exist
- required Storage policies exist
- anonymous users cannot execute the membership authorization helper
- authenticated users can execute the membership authorization helper

The script was executed against the Lovable production database on 10 September 2026 and returned:

```text
wave0_foundation: PASS
workspaces: 1
auth_users: 2
active_members: 2
orphan_projects: 0
orphan_placement_orders: 0
orphan_backlinks: 0
```

A final post-merge production verification returned the same healthy state.

### 6. RLS behavior validation

The earlier manual transaction/rollback validation remains applicable because the subsequent PRD implementation commit did not modify authentication or the Wave 0 database policies/migrations.

Previously verified:

- project insert automatically receives workspace assignment: **PASS**
- project data-source insert under workspace RLS: **PASS**
- another member of the same workspace can read a shared Project: **PASS**
- non-member cannot read the shared Project: **PASS**
- test rows rolled back: **PASS**

### 7. Supabase type safety

The PRD implementation commit temporarily replaced generated Supabase types with `Database = any`. Wave 0 finalization removes that regression and restores an explicit schema-derived `Database` type based on the current production schema.

This keeps the new workspace/evidence fields visible to TypeScript while preserving legacy tables used by the production application.

## Explicitly preserved

Wave 0 does not rebuild or remove the existing application. The following remain preserved:

- TanStack Start + React
- Vite
- Tailwind/current components
- Lovable Cloud hosting
- current authentication flow
- custom domain/runtime configuration
- existing GitHub repository
- existing Domain Research workflow
- existing Keyword Research workflow
- existing Backlink Recommendation workflow
- existing Ahrefs/Apify cache/provider implementation
- historical backlink/domain data

## Wave 0 exit criteria

| Exit criterion | Result |
| --- | --- |
| Secure team/workspace membership model | PASS |
| Existing authentication preserved | PASS |
| Existing production data preserved | PASS |
| Shared Project access architecture validated | PASS |
| Provider-neutral AI abstraction exists | PASS |
| Evidence/import foundation exists | PASS |
| Production-safe repeatable verification exists | PASS |
| Build verification | PASS — PR #7, final GitHub Actions `PR Build` run #38 |
| Existing core SEO/backlink routes preserved | PASS |
| Merge to `main` | PASS — PR #7 merged |
| Post-merge production verification | PASS |

## Next wave

**Wave 0 is closed.**

The next implementation target is:

```text
WAVE 1 — Project Workspace Foundation
```

Wave 1 should complete the user-facing workflows that already have backend foundations: Evidence, Import Wizard, Data Source Registry, AI Client Intelligence, progressive Project fields, and lifecycle controls.
