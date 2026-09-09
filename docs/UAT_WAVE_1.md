# UAT — Wave 1 Project Workspace Foundation

> Scope: Wave 1 only
> Rule: do not start Wave 2 until blocking Wave 1 issues are resolved.

## A. Authentication & Internal Access

- [ ] `/auth` shows login only; no public registration CTA.
- [ ] Existing internal account can sign in.
- [ ] Unauthenticated user is redirected to `/auth`.
- [ ] First authorized internal account can bootstrap the default internal workspace when no member exists.
- [ ] A non-member account cannot create/access shared Project data merely by authenticating.
- [ ] No service-role/API secret appears in browser code/network responses.

## B. Global Dashboard Visual UAT

Compare against the approved visual direction in `docs/UI_VISUAL_REFERENCE.md`.

- [ ] Sidebar is light/white and easy to scan.
- [ ] Active navigation and main CTAs use orange/orange-red emphasis.
- [ ] Main canvas is light/warm, not generic dark admin UI.
- [ ] Dashboard has a prominent teal/blue-green hero area.
- [ ] KPI cards use selective pastel treatments rather than coloring every card strongly.
- [ ] Cards/tables have rounded, clean, modern SaaS styling.
- [ ] Dashboard uses actual stored counts; no fabricated SEO metrics.
- [ ] Existing SEO tools remain reachable.

## C. Project Creation

- [ ] Open **Projects**.
- [ ] Create a Project with name only.
- [ ] Optional domain can be left blank.
- [ ] New Project lifecycle starts as `Prospect`.
- [ ] Project receives valid workspace membership/context.
- [ ] Project appears in Project list and Dashboard.
- [ ] Search/filter Project list works.

## D. Project Overview

- [ ] Opening `/projects/:id` shows Project Overview, not an empty tab body.
- [ ] Hero shows Project/client name.
- [ ] Domain appears when available.
- [ ] Lifecycle badge/status appears.
- [ ] Objectives appear when available.
- [ ] Overview cards show Objective, Data Sources, Evidence, and AI Intelligence state using real data/empty states.
- [ ] Business context section shows Industry, Target Market, Contact, Budget Indication, Pain Point, Objective.
- [ ] Next Actions respond to missing Project information.
- [ ] Recent Evidence section is visible.
- [ ] AI Intelligence status section is visible.

## E. Progressive Project Profile

- [ ] **Lengkapi Profil** opens edit dialog.
- [ ] Can update website/domain.
- [ ] Can update Industry.
- [ ] Can update Objectives.
- [ ] Can update Target Market.
- [ ] Can update Current Problem/Pain Point.
- [ ] Can update Contact Person.
- [ ] Can update Budget Indication.
- [ ] Can update Competitors.
- [ ] Can update Discovery Notes.
- [ ] Saved human-confirmed fields remain after refresh.

## F. Lifecycle

Test without deleting the Project:

- [ ] Prospect
- [ ] Assessment / Research
- [ ] Proposal
- [ ] Active
- [ ] Lost / Not Proceeding
- [ ] Archived

Verify lifecycle changes do not recreate the Project or lose its data.

## G. Files & Evidence

- [ ] **File & Evidence** tab opens.
- [ ] Upload supported file to private `project-evidence` storage.
- [ ] Original filename/source reference is preserved.
- [ ] Add URL/link evidence.
- [ ] Add manual note evidence.
- [ ] Existing evidence list updates after save.
- [ ] Text/CSV/JSON/text-like sources may extract text when supported.
- [ ] Unsupported file types are stored without falsely claiming successful extraction.
- [ ] File access uses signed/private access, not a public bucket URL.

## H. Structured Manual Import

- [ ] Paste structured list data.
- [ ] System detects headers/columns.
- [ ] Suggested field mapping is visible/editable.
- [ ] Normalized preview is shown before permanent save.
- [ ] Invalid/missing rows are visible in preview.
- [ ] Nothing is committed until explicit confirmation.
- [ ] Raw/original import reference is preserved.

Expected pattern:

```text
Input → Detect → Normalize → Map → Validate → Preview → Confirm → Save
```

## I. Data Sources Registry

- [ ] Data Sources tab opens.
- [ ] GSC, GA4, Google Ads, Meta Ads, TikTok Ads, Shopify, WooCommerce are clearly marked as **planned connectors**, not falsely connected.
- [ ] CMS/Hosting access can be recorded manually.
- [ ] Allowed Wave 1 states are limited to:
  - Belum Terhubung
  - Bukti Manual / Akses Tersedia
  - Akses Diminta
- [ ] UI does not claim OAuth works before it is actually implemented.

## J. AI Client Intelligence

Current runtime default: **OpenAI**, not Lovable managed AI.

- [ ] AI page opens.
- [ ] Optional custom prompt can be entered.
- [ ] AI only analyzes actual Project context/evidence/data-source statuses.
- [ ] Missing information is identified as missing rather than invented.
- [ ] No DR/traffic/keyword/analytics/ads/ecommerce metric is fabricated.
- [ ] Output includes relevant sections such as Business Understanding, Objectives, Available Data, Initial Findings, Missing Information, Discovery Questions, Next Actions.
- [ ] AI field suggestions are stored as pending suggestions.
- [ ] Suggestion can be edited before acceptance.
- [ ] Accept explicitly updates Project field.
- [ ] Ignore does not modify Project field.
- [ ] AI never silently overwrites confirmed human data.

## K. Existing Workflow Regression

Verify these existing modules still open/work at their prior baseline:

- [ ] Domain Saya
- [ ] Domain Research
- [ ] Keyword Research
- [ ] Backlink Recommendation
- [ ] Placement Orders
- [ ] Historical domain/backlink data remains available

## L. Responsive / UX Smoke Test

- [ ] Desktop layout works at typical 1440px width.
- [ ] Sidebar and content do not overlap.
- [ ] Tables remain usable at smaller widths.
- [ ] Project hero is readable on mobile/tablet.
- [ ] Buttons/forms remain usable without horizontal overflow.

## Exit Criteria

Wave 1 is accepted when:

1. authentication/internal access is safe;
2. Project can be created and progressively completed;
3. Project Overview contains useful real context and empty states;
4. Evidence/manual import works without bypassing preview/confirmation;
5. Data Sources does not fake connectors;
6. AI uses actual evidence and human review;
7. existing SEO/backlink flows have no blocking regressions;
8. approved UI direction is visibly reflected;
9. GitHub TypeScript/build CI is green.

Only after these criteria pass should implementation continue to **Wave 2 — Comprehensive Site Audit**.
