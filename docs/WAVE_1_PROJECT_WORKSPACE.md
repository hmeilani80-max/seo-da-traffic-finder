# Wave 1 — Project Workspace Foundation

Status: **IMPLEMENTED / VERIFYING**

Implementation is performed directly through GitHub and database access. No Lovable AI agent/token is used.

## Implemented scope

- Project lifecycle control: Prospect / Assessment / Proposal / Active / Lost / Archived.
- Progressive Project profile fields: Industry, Objectives, Target Market, Current Problem, Contact Person, Budget Indication, Known Competitors, Discovery Notes.
- Project Overview with evidence/data-access/intelligence readiness summary.
- Files & Evidence: file upload, Add Link, source/provenance metadata, processing status, evidence list/detail, signed file access.
- Unsupported binary formats are preserved as evidence and explicitly marked as not automatically parsed.
- Data Source Registry for Google Search Console, GA4, and Google Ads readiness/status. Registry status does not claim a connector is active.
- Representative structured import: competitor-domain CSV with detect, normalize, map, validate, preview, confirm, and save flow. Confirmed domains are added to the Project's Known Competitors and import provenance is stored in `data_imports`.
- Grounded AI Client Intelligence using the provider-neutral Wave 0 AI service. Output covers Business Understanding, Client Objectives, Available Data & Access, Initial Findings, Missing Information, Suggested Questions, and Recommended Next Actions.
- AI field suggestions require explicit Accept/Edit/Ignore and never silently overwrite Project profile fields.
- Intelligence run history is persisted.
- Site Audit remains explicitly disabled/labeled as Wave 2 rather than presented as a working Wave 1 feature.

## Verification gates

- [ ] PR build passes.
- [ ] Existing Domain Research remains intact.
- [ ] Existing Keyword Research remains intact.
- [ ] Existing Backlink Recommendation remains intact.
- [ ] Production schema remains additive/no destructive migration.
- [ ] Project workspace end-to-end UAT passes.

Wave 1 is only CLOSED after these gates pass and the PR is merged to `main`.
