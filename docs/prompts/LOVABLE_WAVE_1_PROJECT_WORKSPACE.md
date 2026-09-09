# Lovable Implementation Prompt — Wave 1: Project Workspace Foundation

Use this prompt **only after Wave 0 has been completed and verified**.

---

Follow these repository documents as source of truth:

- `docs/SEO_ARCHITECTURE.md`
- `docs/PRD.md`
- `docs/USER_STORY_PLAYBOOK.md`
- `docs/KNOWLEDGE_BASE.md`
- `docs/UI_UX_SPEC.md`
- `docs/IMPLEMENTATION_ROADMAP.md`

Use the existing production application and existing codebase. Do not rebuild it.

## IMPLEMENT WAVE 1 ONLY

Goal:

Create the Project-centered workspace foundation for an internal SEO Specialist:

```text
Create Prospect Project
      ↓
Progressively add context
      ↓
Add Files / Evidence / Links
      ↓
See Data Source status
      ↓
Run AI Client Intelligence
      ↓
Review suggested information / next actions
```

Do not implement the comprehensive Site Audit or later waves in this task.

---

## 1. Verify Wave 0 foundation first

Before coding, verify the current repository/database already contains the Wave 0 foundation for:

- internal workspace/team membership;
- secure shared Project access;
- AI provider abstraction;
- Project evidence/import foundation.

If Wave 0 is incomplete or unsafe, STOP and report the blocker instead of working around it.

Do not disable RLS or bypass workspace membership.

---

## 2. Inspect current Project implementation

Inspect:

- current `/projects` route;
- `src/lib/projects.ts` or its current equivalent;
- existing Project schema;
- current Dashboard/sidebar only where directly needed;
- existing authentication context;
- existing UI components/design tokens;
- current evidence/import tables/services from Wave 0.

Reuse working pieces.

Do not refactor Domain Research, Keyword Research, Backlink Recommendation, or unrelated legacy tables.

---

## 3. Extend Project model additively

Product rule:

```text
1 Project = 1 Client = 1 primary Website
```

Project exists before Deal.

Support lifecycle:

- Prospect;
- Assessment;
- Proposal;
- Active;
- Lost;
- Archived.

Support progressive optional information:

- Industry;
- Objectives;
- Target Market;
- Current Problem / Pain Point;
- Contact Person;
- Budget Indication;
- Known Competitors;
- Discovery Notes.

Minimum creation must remain simple:

- Project / Client Name;
- Primary Website optional if not known yet.

Do not require a long form before creating the Project.

Use additive migrations only.

---

## 4. Build Project List / Projects home

Replace or evolve the current backlink-centric Project management experience carefully.

Do not remove existing Placement access/functionality. If necessary, keep existing placement functions reachable inside the Project or through an existing route until Wave 6.

Project list should show at minimum:

- Project name;
- domain;
- lifecycle status;
- objective summary if available;
- last updated;
- next useful action / evidence state if practical.

Actions:

```text
[Create Project]
[Open Project]
```

All authorized internal workspace members can see all Projects according to Wave 0 RLS.

---

## 5. Project Workspace shell

Build a Project page/workspace following `docs/UI_UX_SPEC.md`.

Required header:

- Project / Client Name;
- primary domain;
- lifecycle status;
- objectives as tags/chips where available;
- relevant actions.

Required initial local navigation/sections:

- Overview;
- Intelligence;
- Data Sources;
- Files & Evidence.

You may show later modules as disabled/coming later only if that improves orientation, but do not create fake functional routes for Site Audit/Competitors/etc. Prefer not to create dead navigation.

Project context should remain obvious.

---

## 6. Project Overview

Create an overview inspired by the approved UI/UX reference and `docs/UI_UX_SPEC.md`.

Use modular cards, not a long administrative form.

Minimum cards/sections:

### Business Context

- Industry;
- Objectives;
- Target Market;
- Current Problem;
- lifecycle status.

### Data / Access Summary

- connected/available/not connected source counts or cards;
- evidence count;
- processing issues if any.

### AI Client Intelligence Summary

- What I Understand;
- Missing Information;
- Recommended Next Actions.

### Recent Evidence / Activity

Show recent Project evidence or relevant Project updates.

Do not invent SEO Health/Traffic cards unless factual data is actually available and linked to the Project.

---

## 7. Progressive Project editing

Provide simple edit UX.

User can update Project fields at any time.

Do not make all fields required.

AI suggestions and manual values must remain distinguishable.

When a user confirms a value, it becomes authoritative Project data until manually changed.

---

## 8. Files & Evidence

Implement the first production Project evidence workflow using the Wave 0 storage/schema foundation.

Required input methods where technically supported in this wave:

- file upload;
- Add Link;
- manual note/text.

Target file types should include the formats supported by the actual managed extraction/storage path. At minimum, support a useful subset such as PDF/DOCX/text/spreadsheet/image if the platform can process them safely.

Important:

- do not claim extraction support for a file type that is only stored;
- preserve original source;
- show processing state;
- processing failure must not delete source metadata;
- allow retry when safe.

Evidence list should show:

- title/filename;
- source type;
- processing status;
- created date;
- uploader;
- link/open action where appropriate.

---

## 9. Reusable manual import wizard foundation

Implement the reusable UX/service pattern:

```text
Input
→ Detect
→ Normalize
→ Field Mapping
→ Validate
→ Preview
→ Confirm
→ Save
```

For Wave 1, prove the pattern using **one representative structured Project import** rather than implementing every future importer.

Good representative example:

- generic domain/data list upload attached to the Project;
- or a simple structured discovery dataset.

The component/service must be reusable later for Backlink Source imports and other structured data.

Preview must show:

- row count;
- field mapping;
- normalized value;
- invalid rows;
- duplicates if detectable;
- missing required data.

No uncertain mapping should be committed before confirmation.

---

## 10. Data Sources registry

Create Project Data Sources screen/section.

Show connection cards for target categories such as:

- Google Search Console;
- Google Analytics / GA4;
- Google Ads;
- Shopify;
- WooCommerce;
- WordPress/CMS;
- other future sources.

But distinguish clearly between:

- actual connected implementation;
- available connector not yet connected;
- not implemented/unsupported;
- manual alternative.

Do not fake OAuth/data sync.

Wave 1 may implement only a minimal number of real connections if they are already easy/safe through the Lovable connector architecture.

If no real connector is implemented in this wave, the registry still provides accurate status and manual evidence alternative.

---

## 11. AI Client Intelligence

Use the provider-neutral AI service from Wave 0.

AI input can include:

- Project profile;
- evidence text/metadata that is actually available;
- links/manual notes where processed;
- user-entered objective/prompt.

Default output:

### Business Understanding

### Client Objectives

### Available Data & Access

### Initial Findings

### Missing Information

### Suggested Discovery Questions

### Recommended Next Actions

Store the intelligence run/output so history is available.

Do not present AI inference as a factual measured SEO metric.

---

## 12. AI suggested Project fields

When AI identifies likely structured Project data, show review UI.

Example:

```text
Industry      → Healthcare
Objective     → Lead Generation
Target Market → Indonesia
```

Actions:

```text
[Accept]
[Edit]
[Ignore]
[Accept All]
```

AI must not update authoritative Project fields until user action.

---

## 13. Visual direction

Follow `docs/UI_UX_SPEC.md` and the approved SEO dashboard visual direction.

Important characteristics:

- clean light main canvas;
- left navigation consistent with existing app;
- Project context prominent;
- modular white cards;
- subtle borders/shadows;
- clear primary actions;
- blue/teal primary accents using existing tokens where possible;
- tables only where data is tabular;
- AI appears as contextual analysis card;
- avoid generic admin-form appearance.

Do not make a pixel-for-pixel copy of the reference.

Do not redesign unrelated legacy pages in Wave 1.

---

## 14. Preserve existing backlink/SEO workflows

Wave 1 must not break:

- current Domain Saya/history;
- Domain Research;
- Keyword Research;
- Backlink Recommendation;
- current Placement/Backlink data access;
- existing cache behavior;
- current auth/custom domain.

If the current `/projects` page includes Placement functionality that cannot yet be fully integrated into the new Project workspace without risking regression, preserve it through a compatible secondary section/link until Wave 6.

Do not delete existing placement records or code simply because the new Project UX is introduced.

---

## 15. Tests / verification

Verify at minimum:

### Project

- create Project with only Name;
- create Project with Name + domain;
- edit progressive fields;
- change lifecycle status;
- same Project remains after status changes.

### Shared access

- authorized workspace member can see Project;
- non-member cannot see shared Project;
- RLS remains enabled.

### Evidence

- upload/store one supported file;
- add one link/manual evidence;
- processing status visible;
- failed processing preserves source record.

### Import

- one representative structured import;
- mapping can be edited;
- normalized preview appears;
- invalid row is shown;
- save only happens after confirmation.

### AI Client Intelligence

- run AI using Project context;
- output is saved/displayed;
- missing info is identified when evidence is incomplete;
- Project field suggestion requires user approval;
- no fabricated SEO metrics.

### Regression

- auth works;
- Dashboard loads;
- Domain Saya loads;
- Domain Research loads;
- Keyword Research loads;
- Backlink Recommendation loads;
- existing placement access remains available.

### Build

- build passes;
- TypeScript checks pass;
- report any known pre-existing issues separately.

If publishing is explicitly requested in the implementation turn, publish and verify the production routes. Otherwise do not publish automatically.

---

## 16. Final implementation report

Report:

- files changed;
- migrations created;
- tables/columns/policies changed;
- Project UX routes/components created/changed;
- evidence/storage implementation;
- import wizard implementation;
- connection registry implementation;
- AI provider used;
- AI Client Intelligence behavior;
- build/typecheck result;
- regression tests;
- deployment/production verification if performed;
- tests not executed;
- manual setup required;
- known limitations.

---

## STOP CONDITION

Do not continue to Wave 2.

Do not implement the comprehensive Site Audit engine.

Do not build Competitive Analysis.

Do not redesign the full Keyword Research workflow yet.

Do not build SEO Plan or Proposal Builder.

Do not build Delivery Plan/Task system beyond anything strictly required as a dependency.

Do not redesign Backlink Manager.

Do not implement Reporting.

After Wave 1 implementation, verification, and reporting, STOP.