# Wave 1 — Project Workspace Foundation

Status: **IMPLEMENTED / MERGED — AUTHENTICATED BROWSER UAT PENDING**

Implementation was performed directly through GitHub and database access. **No Lovable AI agent/token was used.**

Main implementation PR: **#8**

## Implemented scope

- Project lifecycle control: Prospect / Assessment / Proposal / Active / Lost / Archived.
- Progressive Project profile fields: Industry, Objectives, Target Market, Current Problem, Contact Person, Budget Indication, Known Competitors, Discovery Notes.
- Project Overview with evidence/data-access/intelligence readiness summary.
- Files & Evidence: file upload, Add Link, source/provenance metadata, processing status, evidence list/detail, signed file access.
- Unsupported binary formats are preserved as evidence and explicitly marked as not automatically parsed.
- Data Source Registry for Google Search Console, GA4, and Google Ads readiness/status. Registry status does not claim a connector is active.
- Representative structured import: competitor-domain CSV with detect, normalize, map, validate, preview, confirm, and save flow. Confirmed domains are added to Known Competitors and import provenance is stored in `data_imports`.
- Grounded AI Client Intelligence using the provider-neutral Wave 0 AI service.
- AI output covers Business Understanding, Client Objectives, Available Data & Access, Initial Findings, Missing Information, Suggested Questions, and Recommended Next Actions.
- AI field suggestions require explicit Accept/Edit/Ignore and never silently overwrite Project fields.
- Intelligence run history is persisted.
- Site Audit is explicitly disabled/labeled as Wave 2 instead of being presented as a working Wave 1 feature.

## Automated verification

GitHub Actions PR Build for PR #8: **PASS**.

A production-safe database workflow test was executed against the Lovable Cloud database and verified:

- progressive Project update: PASS;
- lifecycle change: PASS;
- Evidence persistence and processing status: PASS;
- Data Source Registry persistence: PASS;
- structured import persistence: PASS;
- intelligence run persistence: PASS;
- AI field suggestion decision persistence: PASS;
- UAT cleanup: PASS.

Final residue check:

```text
residual_projects: 0
residual_evidence: 0
residual_imports: 0
```

The repeatable verification is tracked in:

`supabase/tests/wave1_project_workspace.sql`

## Preservation / regression scope

PR #8 changed only:

- `src/routes/_authenticated/project/$projectId.tsx`
- `src/lib/project-workspace.ts`
- `src/lib/project-intelligence.functions.ts`
- this Wave 1 documentation

Therefore existing standalone Domain Research, Keyword Research, and Backlink Recommendation implementation files were not modified by Wave 1. The complete application build passed after the changes.

## Verification gates

| Gate | Result |
| --- | --- |
| Project Workspace implementation | PASS |
| PR Build | PASS |
| Production database data-flow verification | PASS |
| Existing Domain Research source preserved | PASS |
| Existing Keyword Research source preserved | PASS |
| Existing Backlink Recommendation source preserved | PASS |
| No destructive database migration | PASS |
| Merge to `main` | PASS — PR #8 |
| GitHub → Lovable source sync | PASS |
| Authenticated interactive browser UAT | PENDING |

## Why Wave 1 is not marked CLOSED yet

The Project route requires an authenticated application session. This execution environment does not have the user's application login session, so an actual click-through browser UAT cannot be truthfully claimed.

Until that final gate is run, Wave 1 is **implemented and merged**, but not marked CLOSED under the roadmap definition-of-done.

The interactive UAT should cover:

1. create/open a Project;
2. edit lifecycle and progressive fields;
3. upload one evidence file and add one evidence link;
4. open the saved evidence and confirm processing status;
5. update Data Source Registry status;
6. import a small competitor CSV, review preview, and confirm save;
7. run AI Client Intelligence;
8. Accept one suggestion, Edit one suggestion, and Ignore one suggestion;
9. reload the Project and confirm all persisted state remains correct.

Only after this authenticated click-through passes should Wave 1 be marked **CLOSED** and Wave 2 start.
