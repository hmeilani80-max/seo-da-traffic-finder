# Lovable Implementation Prompt — Wave 0: Architecture & Security Foundation

Copy/paste this prompt into the connected Lovable project.

---

Follow these repository documents as source of truth:

- `docs/SEO_ARCHITECTURE.md`
- `docs/PRD.md`
- `docs/USER_STORY_PLAYBOOK.md`
- `docs/KNOWLEDGE_BASE.md`
- `docs/UI_UX_SPEC.md`
- `docs/IMPLEMENTATION_ROADMAP.md`

This is the existing production application **SEO DA & Traffic Finder / Backlink Manager** running on Lovable Cloud with TanStack Start + React, Vite, Tailwind, Lovable-managed Supabase, the existing GitHub repository, existing production data, and existing working SEO/backlink workflows.

## IMPLEMENT WAVE 0 ONLY

The goal of Wave 0 is to create the minimum safe architectural foundation required for the broader SEO Operating System.

Do **not** build Site Audit, Competitors, Proposal, Reporting, or redesign the full application in this wave.

---

## 1. Inspect current state first

Before editing anything, inspect only the files/schema directly relevant to:

- authentication/session;
- current `projects`, `placement_orders`, `backlinks` data access;
- current RLS policies;
- existing `user_id` ownership behavior;
- server-side SEO provider functions;
- existing OpenAI helper/backlink recommendation path;
- existing Lovable Cloud/Supabase integration;
- existing storage/file capability if already present.

Also inspect production schema/data counts before migrations.

Do not refactor unrelated files.

---

## 2. Secure internal workspace/team access foundation

Target product requirement:

> All authorized internal SEO users can see all Projects and shared Project operational data.

Current ownership-based RLS must not simply be removed.

Implement an additive team/workspace authorization foundation using the architecture in `docs/SEO_ARCHITECTURE.md`.

Preferred model:

- `app_workspaces`
- `app_workspace_members`
- additive `workspace_id` on Project-scoped records where required for this foundation
- retain existing `user_id` fields as creator/owner/audit metadata
- RLS based on authenticated active workspace membership

Important:

- do not disable RLS;
- do not create public access;
- do not create unrestricted `authenticated` policies just to make queries work;
- do not delete or rewrite existing user ownership metadata;
- preserve existing rows;
- use additive migrations only;
- provide a safe migration/backfill path.

Because this application currently has production legacy data, do not mass-backfill operational/legacy tables blindly. Only migrate/backfill what is required for the Wave 0 Project foundation and explain any rows intentionally left on legacy ownership behavior.

If a default internal workspace needs to be created, do so deterministically and safely. Do not invent membership for unknown users. Use the current authenticated/known app-user context or the safest available migration strategy and document any manual setup required.

---

## 3. AI provider abstraction foundation

Current code has a server-only OpenAI helper used by backlink recommendation.

Create or establish a provider-neutral AI service abstraction for future workflows.

Requirements:

- existing backlink recommendation must continue to work;
- do not remove `OPENAI_API_KEY` support;
- introduce a path/adapter for Lovable managed AI / AI Gateway using the supported Lovable integration pattern;
- do not expose AI/provider credentials to browser code;
- UI components must not call AI providers directly;
- provider-specific response formats should be normalized behind the service;
- factual SEO metric generation remains forbidden for generative AI.

This wave only needs the foundation/adapter and a small safe verification path. Do not migrate every AI feature yet.

If Lovable managed AI cannot be called with the current project/runtime configuration without additional setup, implement the abstraction cleanly, preserve OpenAI as the working provider, and report the exact missing configuration instead of fabricating a working integration.

---

## 4. Evidence/import foundation

Prepare only the minimum reusable foundation required by Wave 1.

Inspect whether private Supabase Storage / managed file storage already exists.

Add additive database/storage foundation for:

- Project evidence metadata;
- processing status;
- source/provenance;
- generic import metadata / mapping / normalization summary.

Preferred architecture from the docs:

- `project_evidence`
- `data_imports`

Do not build the full evidence UI or universal importer yet unless a tiny internal test surface is needed for verification.

Do not store uploaded binary file bodies in normal Postgres text columns.

Do not store provider credentials inside evidence/connection metadata.

---

## 5. Preserve current application behavior

Do not break:

- `/auth`;
- Dashboard;
- Domain Saya;
- Projects & Placement;
- Domain Research;
- Keyword Research;
- Backlink Recommendation;
- current cache behavior;
- historical domain/backlink data;
- production custom domain.

Do not redesign the sidebar in Wave 0.

---

## 6. Migrations

All schema changes must be additive.

Before applying migrations:

- inspect current table definitions;
- inspect current RLS;
- inspect current foreign keys/indexes;
- avoid duplicate objects if a previous migration already created an equivalent structure.

Migrations must have a rollback/recovery explanation.

Never drop production tables or production records.

---

## 7. Verification

At minimum verify:

### Database/security

- new workspace/member tables exist if implemented;
- RLS is enabled;
- unauthorized authenticated users cannot gain arbitrary access merely by knowing a Project ID;
- authorized workspace member can access the intended Project/shared records;
- existing data remains present;
- original `user_id` values are preserved.

### AI

- existing backlink/OpenAI reasoning path still compiles/works as before;
- new AI abstraction can route to its configured provider or reports an explicit configuration limitation;
- no API key appears in browser bundle/source.

### Existing app regression

- auth still works;
- existing Dashboard loads;
- Domain Research route loads;
- Keyword Research route loads;
- Backlink Recommendation route loads;
- Projects/Placement route loads.

### Build

- run build;
- run TypeScript verification available in the project;
- report any pre-existing warnings separately from new errors.

If publishing is explicitly required in this turn, verify production after publish. Otherwise do not publish automatically.

---

## 8. Final report

Report:

- files changed;
- migrations created;
- tables/columns/indexes created;
- RLS policies created/changed;
- data/backfill performed;
- AI abstraction changes;
- Lovable AI/AI Gateway status;
- existing OpenAI status;
- storage/evidence foundation created;
- build/typecheck result;
- tests executed;
- production data preservation result;
- manual configuration required;
- known limitations;
- recommended rollback/recovery path.

---

## STOP CONDITION

Do not continue to Wave 1.

Do not build Project Workspace UI.

Do not build Site Audit.

Do not add Competitor Analysis.

Do not add Proposal/Task/Reporting modules.

Do not redesign unrelated pages.

Do not deprecate existing providers.

After Wave 0 implementation, verification, and reporting, STOP.
