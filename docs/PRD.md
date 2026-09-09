# Product Requirements Document — SEO Operating System

> Product: SEO DA & Traffic Finder / Backlink Manager evolution
> Version: Discovery Draft v1.0
> Baseline: 2026-09-10
> Primary user: Internal SEO Specialist

---

# 1. Executive Summary

The existing application is a production **SEO DA & Traffic Finder / Backlink Manager** with working domain research, keyword research, backlink recommendation, project/placement foundations, SEO caches, and legacy backlink history.

The product must evolve additively into an internal **SEO Operating System** that supports the complete SEO lifecycle:

```text
Prospect
→ Discovery & Evidence Collection
→ AI Client Intelligence
→ Comprehensive Site Audit
→ Competitive Analysis
→ Keyword & SERP Research
→ SEO Plan
→ Proposal + Manual Budget
→ Deal
→ Active Delivery Plan
→ Tasks
→ Backlink/Off-Page Execution
→ Monitoring
→ Reporting
→ Continuous Optimization
```

The key product problem is fragmentation. Today, an SEO Specialist may need spreadsheets, Docs, Slides, screenshots, multiple SEO tools, analytics systems, ad platforms, and manual copying between them. The target platform keeps context and decisions connected to one Project.

This is **not a greenfield rebuild**. Existing production architecture, data, authentication, routes, custom domain, caches, providers, and working workflows must be preserved while the broader workflow is introduced incrementally.

---

# 2. Product Goals

## G1 — One SEO workspace from pre-sales to reporting

A user can start from a prospect and retain the same Project context after the client deals and becomes active.

## G2 — Accept both connected and manual data

The system remains usable with or without direct integrations. Files, screenshots, spreadsheets, JSON, links, and manual input are first-class data sources.

## G3 — Normalize before data becomes operational

Imported data is detected, mapped, normalized, previewed, and confirmed before permanent structured save when mapping is uncertain.

## G4 — AI-assisted, human-controlled decisions

AI accelerates analysis and drafting, while the SEO Specialist controls final strategy, commercial values, task execution, and factual commitments.

## G5 — Factual metrics remain trustworthy

DR, Traffic, Search Volume, KD, CPC, SERP Position, backlink counts, and other factual metrics come from real sources/cache and are never invented by AI.

## G6 — Research becomes execution

Audit findings, competitor opportunities, keyword recommendations, and backlink findings can be traced into SEO Plan items, Delivery Plan, Tasks, and later reporting.

## G7 — Preserve history and evidence

The system retains enough provenance to explain what data was used, what AI recommended, what the SEO Specialist decided, what was implemented, and what changed afterward.

---

# 3. Non-Goals for Initial Product Expansion

The following are not required for the first expanded version:

- Client Portal;
- client login;
- mandatory client approval workflow;
- mandatory internal approval states in Tasks;
- per-Project visibility restrictions between internal SEO Specialists;
- automatic AI pricing decisions;
- automatic AI contractual guarantees;
- autonomous implementation of AI fixes;
- automatic final backlink quantity/strategy;
- replacing the current framework/hosting/repository;
- destructive migration of existing backlink/legacy data.

---

# 4. Primary Persona

## Internal SEO Specialist

Responsibilities may include:

- client discovery;
- site audit;
- competitive analysis;
- keyword/SERP research;
- SEO strategy;
- proposal creation;
- on-page/technical/content/off-page planning;
- backlink research and buying decisions;
- task execution/tracking;
- reporting and analysis.

### Access model

For the target initial version, all authenticated internal SEO users can see all Projects and shared operational data.

PIC/Owner is an operational assignment, not an authorization boundary.

---

# 5. Core Product Model

## 5.1 Project

Product rule:

```text
1 Project = 1 Client = 1 primary Website
```

The Project starts before the client has signed.

Recommended lifecycle states:

- Prospect;
- Assessment / Research;
- Proposal;
- Active;
- Lost / Not Proceeding;
- Archived.

The same Project continues after Deal.

## 5.2 Project Context

Everything relevant should be linkable to the Project:

- discovery fields;
- files/evidence;
- source connections;
- AI Client Intelligence;
- site audits;
- competitors;
- keyword research;
- SERP results;
- SEO Plan;
- proposal versions;
- Delivery Plans;
- Tasks;
- backlink plans/orders/live links;
- periodic reports.

---

# 6. Current Production State

## 6.1 Current visible product modules

The current application navigation is backlink-centric and includes:

- Dashboard;
- Domain Saya;
- Proyek & Placement;
- Rekomendasi Backlink;
- Riset Domain;
- Riset Keyword;
- Pengaturan.

## 6.2 Current technical stack

Preserve:

- TanStack Start + React;
- Vite;
- Tailwind CSS + current component system;
- Lovable Cloud hosting;
- Lovable Cloud managed Supabase;
- existing GitHub repository/history;
- existing custom domain;
- existing authentication flow.

## 6.3 Current production data

Existing/legacy operational tables include:

- `domain_sudah_pernah`;
- `traffic_nol`;
- `sudah_dibeli`;
- `check_logs`;
- `search_history`.

Newer additive SEO/backlink architecture currently includes:

- `projects`;
- `placement_orders`;
- `backlinks`;
- `global_domain_cache`;
- `keyword_metrics_cache`;
- `keyword_rank_cache`;
- `seo_research_runs`.

At the discovery baseline, historical legacy data and SEO caches/logs contain production records, while the newer `projects`, `placement_orders`, and `backlinks` tables do not yet contain active rows. Production data must be preserved.

## 6.4 Current SEO intelligence

Current architecture/code includes:

- Apify Actor `pro100chok/ahrefs-seo-tools` provider wrapper;
- domain cache;
- keyword metrics cache;
- keyword rank cache;
- research-run logging;
- direct server-side OpenAI helper for semantic backlink reasoning;
- legacy OpenSEO/older Apify integrations retained during migration.

## 6.5 Current gaps vs target product

The following target modules are not represented as current production routes/data workflows:

- Prospect/Discovery workspace;
- Project evidence/file repository;
- universal import normalization/preview;
- AI Client Intelligence;
- comprehensive Site Audit;
- Competitive Analysis;
- Project-aware SEO Plan;
- Proposal Builder;
- Delivery Plan;
- Task Management;
- hybrid Reporting workspace;
- full backlink planning/monitoring lifecycle.

---

# 7. Critical Compatibility Requirement

`docs/SEO_ARCHITECTURE.md` is the existing technical source of truth for backlink/SEO intelligence implementation.

This PRD expands product scope. Therefore:

- do not rewrite or ignore the current architecture;
- implement new modules additively;
- create architecture deltas when needed;
- preserve legacy data and working flows;
- validate parity before provider deprecation;
- preserve cache-first behavior;
- keep privileged provider calls server-side.

---

# 8. Functional Requirements — Project & Discovery

## FR-PROJ-001 — Fast Project creation

User can create a Project without completing all discovery fields.

Minimum start:

- Project/Client Name;
- Website/domain if known.

### Acceptance criteria

- Project can be saved with minimal data.
- Missing optional data does not block later evidence upload.
- Project status can represent a prospect/pre-deal state.

## FR-PROJ-002 — Progressive Project profile

User can add/edit discovery information over time.

Examples:

- Industry;
- objective(s);
- target market;
- current pain point;
- contact information;
- budget indication;
- known competitors;
- notes;
- access/connection availability.

### Acceptance criteria

- Fields can be incomplete.
- User can update them later.
- AI-generated suggestions do not silently overwrite confirmed values.

## FR-PROJ-003 — Convert prospect to Active without recreation

### Acceptance criteria

- User can change lifecycle state to Active/Deal.
- Existing audit/research/proposal/history remains on the same Project ID.

---

# 9. Functional Requirements — Evidence, Upload & Normalization

## FR-DATA-001 — Project Evidence Library

User can attach evidence to a Project.

Target formats include:

- PDF;
- DOC/DOCX;
- CSV;
- XLS/XLSX;
- TXT;
- JSON;
- image/screenshot;
- URL/link;
- other technically supported media/documents.

### Acceptance criteria

- Evidence is linked to one Project.
- User can identify source/type/date.
- Evidence can be used as context for AI workflows.

## FR-DATA-002 — Manual structured import

Modules that use structured lists/data support paste/upload/import.

### Acceptance criteria

- Detect likely columns.
- Suggest field mappings.
- Highlight invalid/missing/duplicate data.
- Allow mapping correction before save.

## FR-DATA-003 — Universal normalization

### Required behavior

Normalize according to field semantics.

For domains:

- lowercase;
- strip protocol;
- strip `www.`;
- strip path/query;
- strip trailing slash.

For page URLs:

- preserve the specific URL/path needed by the workflow.

Other normalization may include:

- dates;
- numeric values;
- price/currency representation;
- keyword whitespace/case rules;
- source/vendor labels.

### Acceptance criteria

- Equivalent Source Domains can be detected as duplicates.
- Raw/original value can be retained for traceability where useful.

## FR-DATA-004 — Data Preview before uncertain import save

Canonical flow:

```text
Upload/Paste → Detect → Normalize → Map → Validate → Preview → Confirm → Save
```

### Acceptance criteria

- User can cancel or remap before permanent insertion.
- No uncertain parsed import is silently committed.

## FR-DATA-005 — Provenance

Structured data should identify source where practical:

- Manual Entry;
- Manual Upload;
- Connected Source;
- API;
- Public Crawl;
- AI Extracted;
- Legacy Import.

---

# 10. Functional Requirements — Integrations

## FR-INT-001 — Project connection registry

Each Project can show available/connected data sources.

Target sources include, subject to connector/API implementation:

- Google Search Console;
- Google Analytics / GA4;
- Google Ads;
- Shopify;
- WooCommerce;
- WordPress/CMS systems;
- ecommerce/conversion sources;
- paid-media/tracking sources;
- SEO providers/crawlers.

Lovable workspace currently exposes integrations for several of these services, including Google Analytics, Google Search Console, Google Ads, WooCommerce, Shopify, WordPress, Apify, and other data tools.

Meta Ads and specialized TikTok Ads data are target integrations but must be validated technically before being claimed as connected functionality.

### Acceptance criteria

- Project works without a connector.
- Connection states are visible.
- Failure of one connection does not erase existing Project data.

---

# 11. Functional Requirements — AI Platform

## FR-AI-001 — AI provider abstraction

For new general intelligence workflows, prefer Lovable's managed AI/AI Gateway where appropriate to minimize extra external AI cost.

Existing OpenAI-based backlink reasoning must not be removed abruptly.

### Acceptance criteria

- Product workflow depends on a stable internal AI service interface, not provider-specific UI code.
- Existing OpenAI backlink flow remains functional until replacement/parity is explicitly validated.

## FR-AI-002 — No fabricated metrics

AI must never invent factual metrics such as:

- DR;
- organic traffic;
- Search Volume;
- KD;
- CPC;
- Traffic Potential;
- SERP Position;
- backlink/referring-domain counts;
- connected analytics/ads values.

### Acceptance criteria

- Missing factual data is marked unavailable/unverified.
- Generated narrative does not present inferred numbers as measured facts.

## FR-AI-003 — Human control

AI may recommend but not silently commit authoritative decisions.

### Acceptance criteria

- AI-extracted Project fields support Accept/Edit/Ignore.
- user-entered Keyword/Target URL is not overwritten automatically.
- AI cannot finalize budget, guarantees, or final backlink strategy without user action.

---

# 12. Functional Requirements — AI Client Intelligence

## FR-CLI-001 — Analyze Project context

AI can analyze Project fields, evidence, connected data, and user prompt/objective.

Expected output:

- Business Understanding;
- Client Objectives;
- Available Data & Access;
- Initial Findings;
- Missing Information;
- Suggested Questions;
- Recommended Next Actions.

### Acceptance criteria

- Output refreshes when user requests analysis after new evidence.
- Factual/extracted information is distinguishable from recommendation/inference.
- User can apply suggested structured Project fields individually or in bulk after review.

---

# 13. Functional Requirements — Comprehensive Site Audit

## FR-AUD-001 — Full audit by default

There is no normal pre-audit scope selector. The system runs all supported audit checks.

Data may come from:

- public crawl;
- sitemap/robots/page data;
- connected Search Console/Analytics/etc.;
- uploaded evidence;
- SEO provider/API data.

## FR-AUD-002 — Audit checklist coverage

Audit should support the maintained on-page/technical checklist, including categories such as:

- titles;
- meta descriptions;
- H1-H6;
- canonical;
- robots/sitemap;
- index/noindex;
- links;
- images/alt;
- duplicate signals;
- Open Graph;
- hreflang;
- structured data;
- performance/response indicators;
- information architecture;
- other supported on-page/technical checks.

## FR-AUD-003 — Explicit check result

Each check returns an explicit state:

- Passed;
- Issue;
- Warning;
- Not Found;
- Unable to Verify.

## FR-AUD-004 — AI Audit Analyst

AI can:

- group/deduplicate issues;
- prioritize severity;
- explain impact;
- propose remediation;
- generate suggested copy/fix examples where appropriate.

Example: missing meta description can include an AI-drafted meta description based on page content, keyword intent, and Project context.

## FR-AUD-005 — Audit issue to Task

### Acceptance criteria

- User can create a Task from an actionable issue.
- Task retains source audit run, URL(s), severity, evidence, and recommendation.

---

# 14. Functional Requirements — Competitive Analysis

## FR-COMP-001 — Automatic competitor discovery

System can identify relevant organic/paid competitors from available provider/search data.

## FR-COMP-002 — Manual competitor control

User can:

- add manually;
- ignore/remove;
- mark Primary Competitor.

## FR-COMP-003 — Organic comparison

May include:

- authority;
- organic traffic;
- shared keywords;
- keyword gaps;
- top pages;
- ranking overlap;
- content gaps;
- backlink/referring-domain gap.

## FR-COMP-004 — Paid comparison

Where supported:

- paid keywords;
- CPC;
- ad title/copy/description;
- landing URL;
- paid competitor context.

## FR-COMP-005 — AI competitive reasoning

AI explains:

- who is winning;
- where;
- why;
- which gaps matter to the client objective;
- what should become an SEO Plan opportunity.

---

# 15. Functional Requirements — Keyword & SERP Research

## FR-KW-001 — Project-aware research

Keyword Research can use:

- Project/business context;
- seed keywords;
- Search Console;
- competitor keywords;
- SERP data;
- keyword gaps;
- current ranking pages.

## FR-KW-002 — Factual keyword metrics

Where available:

- Search Volume;
- KD;
- CPC;
- Traffic Potential;
- Current Position;
- Ranking URL;
- SERP context.

Reuse existing cache architecture where applicable.

## FR-KW-003 — AI opportunity classification

AI may classify/prioritize:

- Quick Wins;
- High Business Value;
- Content Opportunities;
- Competitor Gaps;
- Brand/Awareness Opportunities.

## FR-KW-004 — Keyword → Target Page

AI recommends:

- Optimize Existing Page; or
- Create New Page Recommended.

### Acceptance criteria

- Recommendation is editable.
- Existing human mapping is not overwritten silently.
- User can add selected item to SEO Plan.

---

# 16. Functional Requirements — SEO Plan

## FR-PLAN-001 — Consolidate opportunities

SEO Plan can contain findings/recommendations from:

- Audit;
- Competitive Analysis;
- Keyword Research;
- Content opportunity;
- Backlink analysis;
- manual strategy.

Each Plan item should support:

- title/action;
- rationale;
- priority;
- source/evidence;
- related objective/KPI;
- URL/keyword when relevant;
- expected impact type.

## FR-PLAN-002 — Strategic, not merely Tasks

SEO Plan is a strategic layer. It should not be identical to the executable Task list.

---

# 17. Functional Requirements — Proposal Builder

## FR-PROP-001 — Generate proposal draft from Project evidence

AI can draft a Proposal based on available Project analysis.

## FR-PROP-002 — Modular proposal sections

Potential sections:

- Executive Summary;
- Client Needs & Pain Point;
- Current Performance;
- Competitor Gap;
- Audit Findings;
- Keyword Opportunity;
- Content Strategy;
- Technical SEO;
- On-Page SEO;
- Off-Page SEO;
- Tracking/Analytics;
- Scope of Work;
- Deliverables;
- Workflow;
- Timeline;
- KPI/Targets;
- Traffic/Impact Forecast;
- Budget;
- ROI / SEO-vs-SEM simulation;
- assumptions/disclaimer.

User can add/remove/reorder/edit sections.

## FR-PROP-003 — Manual budget

Budget values are entered/finalized manually.

AI may structure or calculate presentation from user values but may not independently set final pricing.

## FR-PROP-004 — Forecast vs commitment

AI/system must distinguish forecast/estimate from contractual commitment.

### Acceptance criteria

- Forecast sections can show assumptions/disclaimer.
- Final quantities, guarantees, duration, budget, and committed KPI remain user-controlled.

## FR-PROP-005 — Proposal history

Store proposal version/history within Project.

---

# 18. Functional Requirements — Deal & Delivery Plan

## FR-DEL-001 — Mark Project as Deal/Active

Changing lifecycle state must preserve all pre-sales history.

## FR-DEL-002 — Convert final scope into Delivery Plan

Use:

```text
Proposal → Final Scope → Delivery Plan → Tasks
```

Delivery Plan may organize work by:

- month;
- phase;
- category;
- planned quantity;
- target date.

### Acceptance criteria

- SEO Specialist can edit plan before activation.
- Proposal does not automatically generate hundreds of Tasks directly.

---

# 19. Functional Requirements — Task Management

## FR-TASK-001 — Simple task status

Required baseline:

```text
To Do → In Progress → Done
```

Optional:

- Blocked;
- Cancelled.

No mandatory Approval/Client Review state.

## FR-TASK-002 — Task context

Task may contain:

- Project;
- PIC/Owner;
- due date;
- priority;
- category;
- related URL;
- related Keyword;
- source type/reference;
- AI recommendation;
- notes;
- attachments;
- before evidence;
- after evidence;
- result/impact.

## FR-TASK-003 — Multiple task sources

Task may originate from:

- Audit;
- Competitive finding;
- Keyword opportunity;
- SEO Plan;
- Backlink issue;
- Reporting recommendation;
- Manual entry.

---

# 20. Functional Requirements — Backlink Planning

This section extends the existing backlink architecture rather than replacing it.

## FR-BLP-001 — Two input routes

Backlink baseline/strategy data can come from:

### Manual

- paste;
- manual form;
- CSV/XLSX/TXT/JSON/document upload.

### Automatic

- provider/API;
- existing Project data;
- connected sources;
- public research.

Manual data uses the universal normalization/preview flow.

## FR-BLP-002 — AI-assisted backlink strategy

AI may recommend:

- backlink gap;
- estimated quantity/range;
- quality criteria;
- DR/traffic criteria;
- target keyword/page;
- anchor strategy;
- monthly distribution;
- competitor gap;
- diversity considerations.

### Acceptance criteria

- User can bypass AI.
- User can edit AI output.
- final quantity and final strategy are explicitly saved by SEO Specialist.

---

# 21. Functional Requirements — Source Domain & Buying Workflow

## FR-BUY-001 — Source import

Source Domains can come from:

- seller/vendor list;
- marketplace;
- outreach;
- manual upload/paste;
- API.

## FR-BUY-002 — Duplicate/history check

For normalized Source Domain, show available history:

- used in current Project;
- used elsewhere;
- usage count;
- last used date;
- previous keyword/anchor;
- target URL;
- vendor/platform;
- historical price.

Duplicate use must be a warning, not an automatic block.

## FR-BUY-003 — Quality research

Reuse cache/API architecture to obtain supported quality data such as:

- DR;
- traffic;
- backlinks;
- referring domains;
- top keywords/pages;
- context relevant to topical/quality assessment.

## FR-BUY-004 — AI candidate recommendation

AI can label:

- Recommended;
- Consider;
- Avoid;

with explanation.

## FR-BUY-005 — Human buying decision

User chooses:

```text
Buy / Skip / Save for Later
```

If Buy, capture:

- source domain;
- vendor/seller/platform;
- price;
- keyword/anchor;
- target URL;
- date;
- notes;
- metric snapshots used for decision.

---

# 22. Functional Requirements — Placement & Backlink Monitoring

## FR-BL-001 — Placement lifecycle

Target lifecycle:

```text
Planned
→ Ordered/Purchased
→ Content/Processing
→ Live
→ Verified
```

Exceptions:

- Cancelled;
- Failed.

Existing placement statuses may be migrated/mapped additively rather than destructively replaced.

## FR-BL-002 — Live backlink record

Store relevant live state:

- source domain;
- live/source URL;
- target URL;
- keyword/anchor;
- vendor;
- price;
- date live;
- link type;
- decision-time metric snapshot;
- evidence;
- verification timestamps.

## FR-BL-003 — Monitoring

Where technically possible, periodically detect:

- still live;
- removed/lost;
- redirect;
- HTTP error;
- target URL change;
- dofollow/nofollow/link attribute change.

Monitoring issues may create warnings or Tasks.

---

# 23. Functional Requirements — Reporting

## FR-REP-001 — Hybrid input

Reports can use connected data and manually supplied evidence.

## FR-REP-002 — User prompt/objective

User can provide a reporting prompt/objective.

Example:

```text
Create a monthly SEO report for management focused on traffic, keyword movement, conversions, backlink progress, implementation, risks, and next actions.
```

## FR-REP-003 — AI Report Builder

Possible modules:

- Executive Summary;
- KPI Performance;
- Traffic/Conversion;
- Keyword Performance;
- Page/Content Performance;
- Technical SEO;
- Backlink Performance;
- Paid-media context;
- Delivery/Task progress;
- Key Findings;
- Risks;
- Recommendations/Next Actions.

## FR-REP-004 — Reporting integrity

### Acceptance criteria

- no invented numbers;
- missing data explicitly identified;
- source/provenance retained where possible;
- manual evidence can be used when a connector is unavailable.

## FR-REP-005 — Period/history

Support:

- Weekly;
- Monthly;
- Custom Range;
- saved report history;
- editing;
- versioning;
- prior-period comparison.

## FR-REP-006 — Export/share

Target output:

- PDF;
- DOCX;
- PPTX;
- XLSX where applicable;
- optional shareable link.

Shareable report does not imply Client Portal access.

---

# 24. Data Model Direction — Additive Only

This section describes product-level entities, not final SQL. Exact schema requires a dedicated architecture/migration design phase.

Existing tables must be preserved.

Potential additive entities/structures include:

- extended `projects` profile/lifecycle fields;
- `project_evidence` / file metadata;
- `project_connections`;
- `ai_analysis_runs` / analysis snapshots;
- `site_audit_runs`;
- `site_audit_findings`;
- `project_competitors`;
- Project keyword/opportunity records;
- `seo_plan_items`;
- `proposals` + proposal versions/sections;
- `delivery_plans` + plan items;
- `tasks`;
- `reports` + report versions;
- backlink plan/strategy records;
- vendor/source metadata where needed;
- backlink monitoring checks/events.

Do not introduce all tables at once solely because they appear here. Implement each expansion wave with the minimum schema needed and additive migrations.

---

# 25. Authorization & RLS Requirement

## Current state

Several current operational tables enforce row ownership with patterns equivalent to:

```text
user_id = auth.uid()
```

## Target product behavior

All authenticated internal SEO users should see all internal Projects/shared records in the first expanded version.

## Requirement

A dedicated security design must reconcile this difference.

Do not simply disable RLS or create public/permissive policies.

Target security should still:

- require authenticated internal access;
- keep public/anonymous access blocked;
- protect server-only caches/secrets;
- support future role expansion if needed.

This is a **P0 architecture/security dependency** before team-shared Project data is implemented.

---

# 26. Non-Functional Requirements

## NFR-001 — Production preservation

No destructive replacement of existing data/tables/routes.

## NFR-002 — Additive migrations

Schema changes must be additive with rollback path.

## NFR-003 — Cache-first paid SEO calls

Reuse current caching and cost-control principles.

## NFR-004 — Server-side secrets

Never expose privileged provider credentials in browser code.

## NFR-005 — Partial failure resilience

One failed data source/API should not destroy successful results from other sources.

## NFR-006 — Provenance

Users should be able to tell whether important information came from upload, connector, API, crawl, AI extraction, or manual entry.

## NFR-007 — Performance

Do not automatically trigger costly API/AI operations on page load unless the workflow explicitly requires automatic collection and cost is controlled.

## NFR-008 — Traceability

Recommendations should retain links to source data/findings wherever practical.

---

# 27. Current-to-Target Gap Summary

| Capability | Current State | Target |
|---|---|---|
| Domain Research | Exists | Reuse + Project context |
| Keyword Research | Exists standalone | Expand to Project-aware research |
| Backlink Recommendation | Exists | Expand into full planning/buying lifecycle |
| Projects | Basic table/UI exists | Become full Prospect→Active workspace |
| Placement Orders | Basic exists | Expand lifecycle/vendor/history |
| Backlinks | Table exists | Add full live verification/monitoring |
| SEO Cache | Exists | Reuse |
| Research Logs | Exists | Reuse/extend |
| Manual import normalization | Partial/backlink architecture concept | Universal capability |
| Evidence/files | Not productized | Required |
| AI Client Intelligence | Not present | Required |
| Comprehensive Site Audit | Not present | Required |
| Competitive Analysis | Not present | Required |
| SEO Plan | Not present | Required |
| Proposal Builder | Not present | Required |
| Delivery Plan | Not present | Required |
| Task Management | Not present | Required |
| Hybrid Reporting | Not present | Required |
| Shared internal visibility | Current RLS is per-user on many tables | Required with secure authenticated team model |

---

# 28. Product Expansion Waves

These are **product expansion waves**, not replacements for the implementation phases already defined in `SEO_ARCHITECTURE.md`.

## Wave 0 — Architecture & Security Delta

Before broad feature coding:

- map existing architecture to this PRD;
- define safe shared-internal RLS model;
- define Project lifecycle extension;
- define evidence/storage pattern;
- define universal normalization service;
- define AI provider abstraction using Lovable managed AI for new general reasoning while preserving existing OpenAI flow;
- define connector registry/state model.

**Stop after architecture/security design and migration plan.**

## Wave 1 — Project Discovery & Evidence

Build:

- Prospect lifecycle;
- progressive Project profile;
- Project evidence library;
- upload/link/manual input;
- normalization + Data Preview;
- AI Client Intelligence.

## Wave 2 — Comprehensive Site Audit

Build:

- crawl/data collection orchestration;
- audit checklist engine;
- findings/severity;
- AI Audit Analyst;
- suggested fixes;
- finding → Task action foundation.

## Wave 3 — Competitive + Keyword + SEO Plan

Build:

- competitor discovery/manage;
- organic/paid comparison where supported;
- Project-aware keyword/SERP workflow;
- target-page mapping;
- SEO Plan.

## Wave 4 — Proposal

Build:

- modular Proposal Builder;
- AI drafting;
- manual budget;
- forecast vs commitment semantics;
- proposal versions;
- export foundation.

## Wave 5 — Active Delivery & Tasks

Build:

- Deal/Active conversion;
- Delivery Plan;
- Task Management;
- source traceability;
- before/after evidence.

## Wave 6 — Backlink Workflow Expansion

Reuse and extend current architecture:

- backlink baseline/planning;
- manual/automatic source data;
- duplicate/history view;
- AI-assisted requirement/candidate analysis;
- vendor/buy decisions;
- placement lifecycle;
- live monitoring.

## Wave 7 — Reporting

Build:

- connected + manual evidence reporting;
- period comparison;
- AI report generation;
- report history/versioning;
- export/share formats.

---

# 29. Product-Level Acceptance Test

A full workflow is considered successful when an internal SEO Specialist can perform this scenario without moving core context to another system:

1. Create Project `ABC` as Prospect.
2. Enter only minimal Project data.
3. Upload company profile, spreadsheet, screenshot, and URL evidence.
4. Normalize a manually uploaded structured dataset and confirm Data Preview.
5. Connect any available Search Console/Analytics source or continue without it.
6. Run AI Client Intelligence and review suggested Project fields/missing questions.
7. Run comprehensive Site Audit.
8. Receive Passed/Issue/Warning/Not Found/Unable to Verify results.
9. Receive AI remediation suggestion for an issue.
10. Create a Task from an audit finding.
11. Discover and manage competitors.
12. Run Project-aware keyword/SERP research.
13. Select keyword opportunity and target page recommendation.
14. Add selected opportunities to SEO Plan.
15. Generate an editable Proposal draft.
16. Enter budget manually.
17. Finalize scope/quantities/forecast assumptions manually.
18. Mark Project as Deal/Active without losing history.
19. Generate/edit Delivery Plan.
20. Create and complete Tasks.
21. For off-page work, import/source candidate domains manually or automatically.
22. Normalize Source Domains and check usage history.
23. Run AI-assisted backlink strategy/candidate analysis or enter strategy manually.
24. Save final human-decided backlink quantity/strategy.
25. Record Buy/Skip/Save Later decisions.
26. Track Purchased → Processing → Live → Verified.
27. Monitor live backlink health.
28. Add automatic or manual performance evidence.
29. Generate a monthly report using a user prompt.
30. Compare with previous period and export/share the report.

---

# 30. Decisions Already Locked From Discovery

The following should not be reopened during implementation unless the product owner explicitly changes them:

1. **1 Project = 1 Client = 1 Website.**
2. Project begins while the client is still a Prospect.
3. Data collection is progressive, not a mandatory large discovery form.
4. Manual uploads/files/links/media are first-class inputs.
5. Imported data must be normalized and previewed before uncertain structured save.
6. AI analyzes/recommends; SEO Specialist retains final control.
7. Comprehensive Site Audit has no normal scope selector.
8. Audit should record both successful checks and missing/problem checks.
9. Audit issues can become Tasks.
10. Competitors can be discovered automatically and managed manually.
11. Keyword Research includes AI priority and Keyword→Target Page mapping.
12. Proposal is modular and AI-assisted.
13. **Budget is finalized manually.**
14. Proposal → Final Scope → Delivery Plan → Tasks.
15. Task flow does not require Approval stages.
16. Reporting can use connected data or manually uploaded evidence.
17. Backlink data can be manual or automatic.
18. AI may recommend backlink needs, but **final quantity and strategy are set by the SEO Specialist**.
19. Duplicate Source Domain is a warning, not an automatic block.
20. Live backlinks should be monitored after placement.
21. Platform is internal-only for this version.
22. All internal SEO Specialists should ultimately see all Client/Project data.

---

# 31. Implementation Guardrail

Do not use this PRD as permission to implement every module at once.

For each Wave:

1. inspect relevant current code/schema;
2. confirm architecture compatibility;
3. create only the additive migration/components required for that Wave;
4. preserve existing working behavior;
5. build/typecheck;
6. verify production behavior when implementation is requested;
7. stop before the next Wave.

Use the existing Lovable Project Knowledge stop-condition discipline.
