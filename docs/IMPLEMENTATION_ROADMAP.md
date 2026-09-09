# SEO Operating System — Implementation Roadmap

> Product source: `docs/PRD.md`
> Architecture source: `docs/SEO_ARCHITECTURE.md`
> UX source: `docs/UI_UX_SPEC.md`
> Workflow source: `docs/USER_STORY_PLAYBOOK.md`

---

# 1. Roadmap Objective

Implement the SEO Operating System incrementally without breaking the existing production Backlink Manager / SEO research workflows.

The roadmap is deliberately wave-based because the target product is much broader than the current application.

Each wave must:

1. inspect current implementation;
2. implement only the requested scope;
3. use additive migrations;
4. preserve existing data;
5. preserve unrelated working flows;
6. run build/type checks;
7. verify the implemented flow;
8. stop before the next wave.

---

# 2. Current Baseline

Existing production already contains working/foundation capability for:

- authentication;
- Dashboard;
- Domain Saya / historical domain workflows;
- Projects & Placement foundation;
- Domain Research;
- Keyword Research;
- Backlink Recommendation;
- Ahrefs/Apify provider wrapper;
- global domain cache;
- keyword metric/rank caches;
- research logging;
- legacy backlink history;
- placement/backlink tables;
- existing OpenAI semantic reasoning;
- legacy OpenSEO/older provider paths.

The new Operating System must be layered on top of this baseline.

---

# 3. Non-Negotiable Rules Across All Waves

## Production preservation

- No rebuild.
- No destructive data migration.
- No repository recreation.
- No framework migration.
- No unrelated refactor.

## Security

- RLS remains enabled where required.
- Service-role/provider secrets remain server-only.
- Shared internal access must use explicit team/workspace authorization.
- Never solve access errors by making tables public.

## AI

- AI does not invent factual SEO/analytics metrics.
- AI output remains distinguishable from measured data.
- Human controls final budget, final backlink strategy, and authoritative decisions.

## External calls

- Cache first.
- No paid research automatically on page load.
- Explicit user action for refresh/regenerate.
- Preserve partial success.

## UI

- Follow `docs/UI_UX_SPEC.md`.
- Project context first.
- Reuse current components/design tokens before creating duplicates.

---

# 4. Wave 0 — Architecture & Security Foundation

## Purpose

Prepare safe foundations required by the broader Project-centered application before large feature development.

## Scope

### A. Team/workspace authorization design

Introduce the minimum secure internal workspace model needed so authorized SEO team members can see shared Projects.

Expected direction:

- `app_workspaces`;
- `app_workspace_members`;
- additive `workspace_id` where needed;
- RLS based on membership;
- retain existing `user_id` as creator/ownership metadata.

### B. AI abstraction foundation

Create a provider-neutral application AI interface.

Requirements:

- existing OpenAI backlink recommendation still works;
- new provider path can use Lovable managed AI/AI Gateway;
- UI cannot depend directly on provider SDK/key;
- no broad migration of all AI behavior yet.

### C. Evidence/import architecture decision

Confirm implementation pattern for:

- private file storage;
- `project_evidence`;
- `data_imports`;
- extraction status;
- normalization/field mapping;
- provenance.

Only implement minimum shared infrastructure required for Wave 1.

## Out of scope

- full Site Audit;
- competitor module;
- proposal builder;
- delivery/tasks beyond foundation;
- backlink redesign;
- reporting.

## Exit criteria

Wave 0 is complete when:

- authorized team membership model is implemented safely;
- existing authentication still works;
- existing production data remains intact;
- shared Project access architecture is validated with authorized users/test users;
- AI service abstraction exists without breaking existing backlink reasoning;
- file/import foundation has a clear schema/service path;
- build succeeds;
- existing core SEO/backlink routes have no regression caused by this wave.

---

# 5. Wave 1 — Project Workspace Foundation

## Purpose

Turn Project into the core user workspace from Prospect stage onward.

## User outcome

An SEO Specialist can create a Project quickly, progressively add client context, attach evidence, see connection status, and use AI Client Intelligence.

## Scope

### A. Project lifecycle/profile

Additive Project fields or profile structure for:

- Prospect/Assessment/Proposal/Active/Lost/Archived;
- Industry;
- Objectives;
- Target Market;
- Current Problem;
- Contact Person;
- Budget Indication;
- Known Competitors;
- Discovery Notes.

Minimum creation remains:

- Project/Client Name;
- Website when known.

### B. New Project workspace UX

Build:

- Project List;
- Create Project;
- Project Header;
- Project Overview;
- Project local navigation foundation.

Project Overview includes:

- business context;
- lifecycle;
- connection summary;
- files/evidence summary;
- AI Client Intelligence summary;
- recommended next actions.

### C. Files & Evidence

Implement:

- upload/add evidence;
- supported initial files based on managed storage/extraction capability;
- Add Link;
- source metadata;
- processing status;
- evidence list/detail.

Do not pretend unsupported formats are fully parsed. Preserve the source and mark processing capability accurately.

### D. Data Source Registry

Implement Project connection/status registry UI.

Initial purpose is visibility and future integration readiness.

Only actually connect providers explicitly included and tested in the wave.

### E. Manual import foundation

Implement reusable import wizard foundation:

```text
Input → Detect → Normalize → Map → Validate → Preview → Confirm → Save
```

Wave 1 does not need every target importer, but the reusable component/service architecture should work for at least one representative structured import.

### F. AI Client Intelligence

AI can use available Project profile + evidence/extracted context to produce:

- Business Understanding;
- Client Objectives;
- Available Data & Access;
- Initial Findings;
- Missing Information;
- Suggested Questions;
- Recommended Next Actions.

AI-extracted Project field changes require Accept/Edit/Ignore.

## Out of scope

- full comprehensive audit engine;
- automatic competitor discovery;
- full project-aware keyword module redesign;
- proposal builder;
- Delivery Plan;
- reporting;
- backlink monitoring redesign.

## Exit criteria

- create Prospect Project with minimal input;
- update Project progressively;
- all authorized internal users can access the Project via secure membership RLS;
- add evidence to Project;
- evidence processing status is visible;
- structured import preview/confirmation works for representative data;
- AI Client Intelligence produces grounded output from available Project context;
- AI suggestions do not silently overwrite Project fields;
- Project can change lifecycle status without recreation;
- existing Domain/Keyword/Backlink workflows still work;
- build succeeds;
- production verification completed if published.

---

# 6. Wave 2 — Comprehensive Site Audit

## Purpose

Create a complete Site Audit workflow linked to Project context and Tasks.

## Scope

### A. Crawl/data collection orchestration

Use supported combination of:

- public crawl;
- OpenSEO where required;
- Apify where suitable;
- sitemap/robots;
- Project evidence;
- connected data when implemented.

### B. Audit run model

Create:

- `site_audits`;
- `audit_findings`;
- deterministic factual checks;
- source/evidence traceability.

### C. Comprehensive behavior

No normal scope selector.

Run all supported checks.

### D. Findings UX

Statuses:

- Passed;
- Urgent;
- Issue;
- Warning;
- Not Found;
- Unable to Verify.

### E. AI Audit Analyst

AI provides:

- grouping;
- priority recommendation;
- why it matters;
- how to fix;
- suggested copy/fix when applicable.

### F. Audit → Task

Create actionable Task with full finding source context.

## Exit criteria

- one Project can run a comprehensive audit;
- findings store factual evidence;
- AI analysis remains separate;
- issue can become Task;
- failed partial crawl does not erase successful findings;
- current production routes remain functional.

---

# 7. Wave 3 — Competitive Analysis + Keyword/SERP

## Purpose

Turn factual SEO/competitive data into Project-specific growth opportunities.

## Scope

### Competitive

- automatic discovery where provider supports;
- manual competitor add;
- ignore/remove;
- primary competitor;
- organic comparison;
- paid comparison where factual source exists;
- AI explanation.

### Keyword/SERP

Evolve existing Keyword Research into Project-aware research while preserving standalone functionality.

Support:

- Project context;
- competitor gaps;
- Search Console data when connected;
- factual cached metrics;
- SERP position/ranking URL;
- opportunity classification;
- Target Page recommendation.

### Project-specific opportunity layer

Create `keyword_opportunities` or equivalent additive model.

## Exit criteria

- competitor set can be generated and manually edited;
- competitor analysis is traceable to factual sources;
- Project-aware keyword opportunity list works;
- factual metrics reuse cache;
- AI can group Quick Wins / High Value / Gap / Content Opportunity;
- Target Page can be edited/overridden;
- selected keyword can proceed to SEO Plan.

---

# 8. Wave 4 — SEO Plan + Proposal

## Purpose

Turn findings into a coherent strategy and client-facing business case.

## Scope

### SEO Plan

Items can originate from:

- Audit;
- Competitor;
- Keyword;
- Backlink;
- Manual;
- AI suggestion.

### Proposal Builder

Implement modular proposal:

- add/remove/reorder sections;
- AI-generated draft per section;
- source context;
- manual editing;
- manual budget;
- versioning/status.

Potential section types follow the PRD.

### Deal conversion

Accepted proposal changes the same Project to Active.

Do not recreate Project.

## Exit criteria

- user can build SEO Plan from real findings;
- proposal can be generated and manually edited;
- budget remains user-controlled;
- proposal can be versioned;
- Project converts Prospect/Proposal → Active without losing history.

---

# 9. Wave 5 — Delivery Plan + Tasks

## Purpose

Bridge commercial scope into daily execution.

## Scope

### Delivery Plan

Generate draft from approved Proposal/SEO Plan.

Support:

- month/phase/workstream;
- quantity/unit;
- timing;
- manual editing.

### Tasks

Core workflow:

```text
To Do → In Progress → Done
```

Optional:

- Blocked;
- Cancelled.

Preserve source traceability.

Do not add mandatory approval workflow.

## Exit criteria

- active Project has editable Delivery Plan;
- scope can become Tasks selectively;
- audit/plan source remains visible in Task;
- Task can store before/after evidence and result.

---

# 10. Wave 6 — Backlink Integration & Expansion

## Purpose

Bring the existing Backlink Manager fully into the new Project Operating System without losing its existing functionality.

## Scope

### Backlink Planning

Support:

- manual data;
- API/project data;
- AI recommendation optional;
- human final quantity/strategy.

### Source Import

Use reusable normalization/import wizard.

### Historical Check

Check:

- same Project;
- other shared Project/history;
- legacy tables;
- prior keyword/target/vendor/price when available.

Do not automatically block reuse.

### Quality Research

Reuse global domain cache + Ahrefs provider.

### Decision

- Buy;
- Skip;
- Save for Later.

### Placement lifecycle

Normalize target lifecycle while preserving historical data.

### Live backlink monitoring

Add monitoring status and verification workflow.

## Exit criteria

- existing Domain/Keyword/Backlink Recommendation logic survives integration;
- manual source import normalizes correctly;
- duplicate warning is informative, not blocking;
- final strategy remains human-controlled;
- placement can progress to live backlink;
- live backlink has verification/monitoring state.

---

# 11. Wave 7 — Monitoring & Reporting

## Purpose

Close the lifecycle with measurable periodic reporting and next-action analysis.

## Scope

### Data inputs

- connected sources implemented by this point;
- Project SEO data;
- task/delivery progress;
- backlink data;
- audit history;
- manual evidence.

### Reporting

- report period;
- modular sections;
- custom AI prompt;
- edit/save versions;
- source refs;
- previous-period comparison;
- export/share where supported.

### AI Reporting

AI can explain:

- what changed;
- likely evidence-backed drivers;
- KPI movement;
- completed work;
- risks;
- next actions.

AI cannot fabricate unavailable values.

## Exit criteria

- report can be generated with connected and/or manual evidence;
- source coverage is visible;
- report versions/history are stored;
- user can compare periods;
- AI answer remains grounded in available data;
- export/share path works for implemented formats.

---

# 12. Integration Prioritization

Do not attempt all external connectors at once.

Recommended priority based on SEO workflow value:

1. Google Search Console;
2. Google Analytics / GA4;
3. Google Ads where relevant;
4. WordPress/CMS where useful;
5. Shopify/WooCommerce for ecommerce Projects;
6. additional paid-media sources based on actual Project need.

Connector presence in Lovable's catalog is not proof of completed application integration.

Each connector requires:

- authorization;
- Project property/account selection;
- data mapping;
- sync behavior;
- error handling;
- verification.

---

# 13. Migration Strategy

## Existing data

Preserve original legacy rows.

When mapping legacy data into new architecture:

- use additive references/migration records;
- do not rewrite original values unnecessarily;
- preserve Keyword/Target Page/history;
- record migration provenance;
- make migration idempotent where possible.

## Existing providers

Keep provider until parity is validated.

## Existing routes

Do not remove working routes prematurely.

New Project-centered UX can gradually become primary after equivalent functionality is verified.

---

# 14. Test Strategy Per Wave

Every wave should include:

## Unit/service checks

For normalization, provider mapping, and deterministic business logic.

## Database/RLS checks

For intended access and forbidden access.

## UI workflow test

Follow the user story end to end for that wave.

## Regression

Test the relevant existing production flow most likely to be affected.

## Build/typecheck

Required before completion.

## Production verification

Required if the wave is published/deployed.

---

# 15. Completion Rule

A wave is not complete because a screen renders.

It is complete only when:

```text
Schema / service
      +
UI workflow
      +
Security
      +
Data preservation
      +
Build
      +
Verification
```

all pass for the requested scope.

---

# 16. Recommended Immediate Execution Order

The next implementation action should be:

```text
WAVE 0 — Architecture & Security Foundation
```

Only after Wave 0 passes should Lovable execute:

```text
WAVE 1 — Project Workspace Foundation
```

Ready-to-use prompts are stored in:

```text
docs/prompts/LOVABLE_WAVE_0_FOUNDATION.md
docs/prompts/LOVABLE_WAVE_1_PROJECT_WORKSPACE.md
```

---

# Final Roadmap Rule

```text
ONE WAVE
→ BUILD
→ VERIFY
→ REPORT
→ STOP
```

Never let an implementation prompt silently continue into the next wave.
