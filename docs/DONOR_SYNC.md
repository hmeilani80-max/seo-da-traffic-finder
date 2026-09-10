# Donor Repository Synchronization

Donor/reference repository:

- `hmeilani80-max/origin-wave-01-rebuild-github`
- Synced through donor commit: `920d95837d4bc537cf3d7a640642e9ff832fd731`
- Sync date: 2026-09-10

Production repository remains the source of truth for runtime architecture, authentication, data, providers, and deployment.

## Synchronization rule

The donor is synchronized by **behavior and UX intent**, not by raw code merge.

Preserve production:

- TanStack Start + TanStack Router
- React
- Supabase / Lovable Cloud database and auth
- existing production SEO/backlink services
- Apify/Ahrefs provider path and caches
- existing GitHub history and production data

Never import donor infrastructure that conflicts with production:

- Firebase / Firebase Admin
- Drizzle schema/database
- Express `server.ts`
- React Router / BrowserRouter
- donor auth context

## Latest donor changes reviewed

### `abb8615` — multi-project support

**Adapted.**

Production implementation:

- global `ProjectSwitcher` reads the real Supabase `projects` table;
- switching opens `/projects/:projectId`;
- last selected Project is remembered locally for convenience;
- Project creation continues to use the existing production Projects flow.

Not copied:

- donor `ProjectContext` API layer;
- donor Firebase ownership model;
- donor Express project endpoint.

### `5395c69` — dynamic dashboard/project data

**Principle adopted, donor backend not copied.**

The donor replaces several static screens with project-scoped API data. Production follows the same principle: no fake SEO metrics and no mock dashboard numbers. Wave 1 Project Workspace uses real Supabase counts for evidence, data-source readiness, placement orders, and AI intelligence runs.

Deferred by roadmap:

- Site Audit data model → Wave 2;
- project-aware Keyword/SERP opportunity layer → Wave 3;
- Tasks → Wave 5.

The donor's random/mock audit generator is explicitly not ported.

### `920d958` — Keyword Explorer

**Adapted with a privacy hardening change.**

Production adds an external Keyword Explorer route and sidebar entry pointing to:

`https://ebran-keyword-explorer.lovable.app`

Unlike the donor implementation, production does **not** append authenticated user ID or email to the iframe URL. The external tool runs in an isolated browser session.

## Navigation alignment

The production sidebar now follows the donor's grouped SEO OS information architecture where the corresponding production capability actually exists:

- MAIN
- RESEARCH & INTELLIGENCE
- EXTERNAL TOOLS
- EXECUTION
- WORKSPACE

Future navigation groups/routes are added only when their implementation wave is real and tested. No dead Site Audit, Competitors, SEO Plan, Tasks, Proposal, or Reporting routes are created early.

## Next synchronization

On the next donor sync:

1. compare donor commits after `920d95837d4bc537cf3d7a640642e9ff832fd731`;
2. classify each change as ADAPT / DEFER / REJECT;
3. port only compatible behavior into the active production wave;
4. run build + TypeScript checks;
5. update this file with the new donor sync SHA.
