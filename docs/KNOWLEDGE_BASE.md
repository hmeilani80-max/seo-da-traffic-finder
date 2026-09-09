# SEO Operating System — Product Knowledge Base

> Product: SEO DA & Traffic Finder / Backlink Manager evolution
> Audience: Lovable AI, developers, product owners, and internal SEO team
> Discovery baseline: 2026-09-10

---

# 1. Purpose of This Knowledge Base

This document explains **what the product means, how users think, what data represents, and what rules must remain consistent** across modules.

Use it together with:

- `docs/SEO_ARCHITECTURE.md` — existing technical architecture and implementation constraints;
- `docs/USER_STORY_PLAYBOOK.md` — end-to-end operational workflow;
- `docs/PRD.md` — product requirements and implementation scope.

## Source-of-truth rule

The current `SEO_ARCHITECTURE.md` is still the technical source of truth for the existing backlink/SEO provider architecture. This Knowledge Base expands the product context beyond backlink management.

If this document requires a new capability that is not yet supported by the architecture, do **not** silently override the architecture. Treat it as a product requirement that needs an additive architecture/implementation phase.

Do not rebuild the application from scratch.

---

# 2. Product Vision

The product is evolving from a focused **SEO DA & Traffic Finder / Backlink Manager** into an internal **SEO Operating System**.

Its purpose is to let an SEO Specialist manage the complete lifecycle in one place:

```text
Prospect
→ Discovery
→ Data Collection
→ AI Client Intelligence
→ Site Audit
→ Competitive Analysis
→ Keyword & SERP Research
→ SEO Strategy
→ Proposal
→ Deal
→ Delivery Plan
→ Tasks
→ Off-Page / Backlink Execution
→ Monitoring
→ Reporting
→ Continuous Optimization
```

The platform exists because the previous workflow was fragmented across spreadsheets, documents, slide decks, screenshots, and multiple SEO/marketing tools.

---

# 3. Primary User & Access Model

Primary user: **internal SEO Specialist / internal SEO team**.

Current product direction:

- no Client Portal;
- all authenticated internal users should ultimately be able to see all Projects and shared Project data;
- PIC/Owner is an operational assignment, not an access boundary;
- no mandatory approval stage in the Task workflow;
- one Project = one Client = one primary Website.

Important current-state note: the existing production tables use `user_id = auth.uid()` ownership RLS for several records. That behavior does not match the future shared-internal-team access requirement and must be intentionally redesigned before implementation. Do not weaken RLS ad hoc merely to make screens work.

---

# 4. Core Product Entity: Project

The product uses **Project** as the top-level workspace.

For this product version:

```text
1 Project = 1 Client = 1 Website
```

A Project is created even before the client has signed a deal.

Project lifecycle is conceptually:

- Prospect;
- Assessment / Research;
- Proposal;
- Active;
- Lost / Not Proceeding;
- Archived.

The same Project continues after the deal. Do not recreate a new Project when Prospect becomes Active.

All relevant historical context should remain linked to the same Project:

- discovery information;
- uploads;
- integrations;
- audit runs;
- competitors;
- keyword research;
- recommendations;
- SEO plan;
- proposal;
- delivery plan;
- tasks;
- backlink data;
- reports.

---

# 5. Business Objectives

SEO work is not performed only to increase rankings.

The Project may target one or more business outcomes such as:

- Revenue;
- Conversion;
- Leads;
- Traffic;
- Awareness;
- Impact;
- Visibility;
- other user-defined objectives.

AI recommendations should be interpreted in the context of the Project objective.

Example:

A high-volume informational keyword may not outrank a lower-volume commercial keyword when the main objective is conversion/revenue.

---

# 6. Progressive Data Collection

Do not require the user to complete a large discovery form before work can begin.

Project information is **progressive**.

The SEO Specialist may start with only:

- client/project name;
- website/domain when known.

Other information may be added later through:

- manual fields;
- notes;
- uploads;
- links;
- connected data;
- AI extraction suggestions.

Missing information should be visible as missing, not treated as an error unless technically required for a specific action.

---

# 7. Universal Input Model

The platform should be designed around two input channels:

## 7.1 Automatic / Connected Data

Examples:

- connected analytics/search/ads/ecommerce data;
- API provider results;
- public web crawling;
- existing Project data;
- existing caches;
- system-generated research.

## 7.2 Manual Data

Examples:

- form input;
- pasted text/domain lists;
- CSV;
- XLS/XLSX;
- TXT;
- JSON;
- PDF;
- DOC/DOCX;
- screenshot/image;
- URL/link;
- other supported media/documents.

Manual upload must not be treated as a fallback-only feature. It is a first-class input path throughout the system.

---

# 8. Normalization & Data Preview

Imported data may be messy, inconsistent, or use arbitrary column names.

The platform should normalize data before permanent save.

Canonical workflow:

```text
Import
→ Detect
→ Normalize
→ Map fields
→ Validate
→ Preview
→ User Confirm
→ Save
```

## Domain normalization

For a domain-level field:

- lowercase;
- remove protocol;
- remove `www.`;
- remove path;
- remove query string;
- remove trailing slash.

Example:

```text
https://www.Example.com/article?q=1
```

becomes:

```text
example.com
```

Do not apply domain-only normalization to a field that must preserve a specific page URL.

## Source Domain vs Target Domain vs Target URL

These terms must never be mixed.

### Source Domain

Website where a backlink is placed/purchased.

Example:

```text
media-example.com
```

### Target Domain

Client website receiving SEO/backlink benefit.

Example:

```text
client.com
```

### Target URL

Specific client page receiving the backlink/optimization.

Example:

```text
https://client.com/product-a/
```

## Suggested mapping

AI/system may suggest field mappings from arbitrary imported columns, but the user can correct them before save.

## Provenance

Where practical, retain:

- normalized value;
- raw/original value;
- source type;
- import/upload reference;
- timestamp.

Useful source types:

- Manual Entry;
- Manual Upload;
- API;
- Connected Source;
- Public Crawl;
- AI Extracted;
- Legacy Import.

---

# 9. AI Operating Rules

AI is used to make the system intelligent, but factual data and human control must remain explicit.

## 9.1 Preferred product behavior

For broad document understanding, Project intelligence, audit reasoning, proposal drafting, reporting, and general structured analysis, prefer the **Lovable AI Gateway / managed AI capability where appropriate** to reduce external AI cost and simplify integration.

The current codebase already contains a direct OpenAI server helper for backlink recommendation. Do not remove it abruptly. Keep the AI layer abstract enough that workflows can use the approved provider without rewriting product logic.

## 9.2 AI can

- read and summarize supplied evidence;
- extract structured fields;
- identify missing information;
- detect patterns/anomalies in factual data;
- classify/prioritize issues;
- explain why a finding matters;
- propose remediation;
- draft title/meta/content suggestions;
- prioritize keyword opportunities;
- map keywords to target pages;
- rank backlink candidates;
- estimate backlink strategy options;
- draft proposal sections;
- draft reports and executive summaries;
- suggest next actions.

## 9.3 AI cannot silently

- fabricate metrics;
- invent Search Volume, DR, Traffic, CPC, KD, rank, backlink count, referring-domain count, or other factual provider metrics;
- overwrite manual Keyword/Target URL/Project fields;
- finalize budget;
- finalize contractual guarantee;
- finalize backlink quantity/strategy;
- apply website/code changes automatically merely because it suggested them.

## 9.4 Human-in-the-loop behavior

For AI-extracted authoritative Project data use:

```text
Suggested value
→ Accept / Edit / Ignore
```

For recommendations use:

```text
AI Recommendation
→ User Review/Edit
→ User Saves Final Decision
```

---

# 10. AI Client Intelligence

AI Client Intelligence is the Project-level understanding layer.

It should use all available Project context and produce:

- Business Understanding;
- Client Objectives;
- Available Data & Access;
- Initial Findings;
- Missing Information;
- Suggested Questions;
- Recommended Next Actions.

AI analysis may be refreshed when new evidence is added.

The output should distinguish:

- factual extracted information;
- inference;
- recommendation;
- unavailable/unverified information.

---

# 11. Connected Data Philosophy

A connection enriches a Project but is not mandatory for the Project to exist.

Current Lovable workspace capabilities include connectors/integrations for services such as:

- Google Analytics;
- Google Search Console;
- Google Ads;
- Google Sheets/Docs/Drive;
- WooCommerce;
- Shopify;
- WordPress;
- Apify;
- Semrush;
- other integrations available in the workspace catalog.

Do not assume every connector is already authenticated for every Project.

Meta Ads and specialized TikTok Ads data should be treated as desired Project integrations subject to a validated connector/API implementation. Do not claim connected functionality until implemented and tested.

Connection state should be explicit:

- Connected;
- Available;
- Not Connected;
- Not Available;
- Error/Needs Attention.

---

# 12. SEO Audit Knowledge

The Site Audit is comprehensive by default. The normal user flow does not ask the user to choose an audit scope first.

The audit uses all supported checks and all available data.

Relevant categories include:

- title tags;
- meta descriptions;
- headings/H1-H6;
- canonical;
- robots directives;
- XML sitemap;
- indexability/noindex;
- internal/external links;
- broken links;
- images and alt attributes;
- duplicate SEO elements/content signals;
- Open Graph;
- hreflang when relevant;
- schema/structured data;
- response/performance indicators;
- information architecture;
- page-level on-page checks;
- other checks defined by the maintained audit checklist/provider capability.

## Check status

Recommended semantics:

- Passed — check completed and no issue detected;
- Issue — actionable problem;
- Warning — possible concern/review required;
- Not Found — expected object/signal is absent;
- Unable to Verify — insufficient access/data or technical limitation.

## Severity

AI/system severity should communicate prioritization, not certainty.

Useful levels:

- Urgent/Critical;
- High;
- Medium;
- Warning;
- Informational.

## Issue anatomy

An actionable audit issue should retain:

- issue type;
- severity;
- affected URL(s);
- evidence/details;
- why it matters;
- how to fix;
- AI suggested fix/example where relevant;
- source audit run;
- status/task linkage.

Examples of current audit knowledge include missing H1, long/short meta descriptions, noindex pages, slow response, and title-length issues.

---

# 13. Competitive Intelligence Knowledge

The business question is:

> Who is actually beating us in organic and paid, where are they winning, and why?

Organic and paid competitor sets can differ.

The system should allow both:

- automatic competitor discovery;
- manual competitor addition/removal/primary marking.

Possible organic comparison facts:

- organic traffic;
- authority;
- shared keywords;
- keyword gaps;
- ranking overlap;
- top pages;
- content gaps;
- backlinks/referring-domain gap.

Possible paid comparison facts:

- paid keywords;
- CPC;
- ad title/copy/description;
- landing URL;
- paid competitor visibility.

AI turns facts into explanation and opportunity, while factual metrics must come from real data sources.

---

# 14. Keyword & SERP Knowledge

Keyword Research is Project-aware.

It may use:

- seed keywords;
- business/objective context;
- website content;
- Search Console data;
- competitor keywords;
- SERP data;
- keyword gaps;
- existing rankings/pages.

Important factual fields may include:

- Search Volume;
- Keyword Difficulty;
- CPC;
- Traffic Potential;
- Current Position;
- Ranking URL;
- SERP context.

AI may derive/label:

- Search Intent;
- Opportunity Score;
- Quick Win;
- High Business Value;
- Competitor Gap;
- Content Opportunity;
- Brand/Awareness Opportunity.

## Keyword → Target Page

Recommendation types:

```text
Optimize Existing Page
```

or

```text
Create New Page Recommended
```

The final mapping remains editable by the SEO Specialist.

---

# 15. SEO Plan Knowledge

The SEO Plan is the bridge between research and proposal/implementation.

SEO Plan items may originate from:

- Audit;
- Competitive Analysis;
- Keyword Research;
- Content gaps;
- Backlink analysis;
- manual strategy.

A Plan item should explain:

- what should be done;
- why;
- priority;
- related objective/KPI;
- related URL/keyword where applicable;
- expected type of impact;
- evidence/source.

The SEO Plan is not identical to a Task list. It contains strategic actions that may later become scope/deliverables/tasks.

---

# 16. Proposal Knowledge

The Proposal should be data-driven and modular.

Reference proposal patterns supplied during discovery include:

- Client Needs & Pain Point;
- keyword opportunity/estimated traffic;
- Analysis & Strategy;
- Keyword Research;
- Content Strategy;
- Technical SEO;
- On-Page Optimization;
- Off-Page Optimization;
- Flow of Work;
- Timeline;
- deliverable quantities;
- traffic forecasts;
- budget;
- SEO-vs-SEM comparison;
- keyword/CPC traffic-potential scenarios;
- forecast disclaimers.

AI can draft and arrange modules, but the SEO Specialist controls commercial commitments.

## Budget

Budget is manual/user-finalized.

## Quantities/Guarantees

Final keyword targets, content counts, backlink counts, manpower, guarantees, contract duration, and contractual KPIs must be intentionally confirmed by the user.

## Forecast

Forecast is not a guarantee unless the user explicitly converts it into a commercial commitment.

Forecast output should preserve assumptions and disclaimer language.

---

# 17. Delivery Plan & Task Knowledge

After a deal:

```text
Final Proposal Scope
→ Delivery Plan
→ Tasks
```

Do not automatically explode a large proposal into hundreds of Tasks without an intermediate Delivery Plan.

Delivery Plan may organize work by month/phase and quantity.

## Task workflow

Default:

```text
To Do → In Progress → Done
```

Optional Blocked/Cancelled may be supported.

There is no required Approval state.

Tasks may link back to their source finding/plan so implementation retains context.

---

# 18. Reporting Knowledge

Reporting is hybrid.

## Automatic evidence

When connected, the system may use:

- Analytics/GA4;
- Search Console;
- ranking data;
- SEO provider data;
- audit history;
- backlinks;
- paid media;
- ecommerce/conversion;
- Delivery Plan/Task status.

## Manual evidence

The user may upload/paste/link screenshots, spreadsheets, documents, JSON, images, links, and notes.

## AI Reporting

AI generates a report according to a user objective/prompt and Project context.

Common modules:

- Executive Summary;
- KPI Performance;
- Traffic/Conversion;
- Keyword Performance;
- Page/Content Performance;
- Technical SEO;
- Backlinks;
- Paid context;
- Delivery Progress;
- Key Findings;
- Risks;
- Next Actions.

Rules:

- no invented numbers;
- missing data must be called out;
- preserve source/provenance;
- reports are editable;
- reports are versioned by period;
- prior periods can be compared;
- target exports include PDF/DOCX/PPTX/XLSX where technically appropriate.

---

# 19. Backlink Knowledge

Backlink is a full workstream, not just a domain-metric lookup.

## 19.1 Backlink Planning Input

Two input routes:

- manual upload/paste/input;
- automatic API/connected/project data.

## 19.2 AI Backlink Planning

AI may recommend:

- gap;
- quantity range;
- quality criteria;
- DR/traffic criteria;
- keyword/target-page priorities;
- anchor mix;
- monthly distribution;
- diversity strategy.

Final strategy and quantity remain user-controlled.

## 19.3 Duplicate/history semantics

A Source Domain used before is not automatically invalid.

System should warn and expose history:

- same Project vs other Project;
- usage count;
- last used date;
- keyword/anchor;
- target URL;
- vendor;
- price.

User may still buy/use it again.

## 19.4 Candidate decision

Useful decision states:

- Buy;
- Skip;
- Save for Later.

AI candidate labels such as Recommended / Consider / Avoid are recommendations only.

## 19.5 Placement lifecycle

Product target:

```text
Planned
→ Ordered/Purchased
→ Content/Processing
→ Live
→ Verified
```

Terminal exceptions:

- Cancelled;
- Failed.

## 19.6 Monitoring

Live backlink monitoring should detect material change where technically possible:

- live/lost;
- redirect;
- HTTP error;
- target change;
- dofollow/nofollow or link attribute change.

---

# 20. Current Production Implementation Snapshot

As of the discovery baseline, the existing application is still backlink-centric.

Current visible navigation includes:

- Dashboard;
- Domain Saya;
- Proyek & Placement;
- Rekomendasi Backlink;
- Riset Domain;
- Riset Keyword;
- Pengaturan.

Current production data model includes legacy tables and newer additive architecture such as:

- `domain_sudah_pernah`;
- `traffic_nol`;
- `sudah_dibeli`;
- `check_logs`;
- `search_history`;
- `projects`;
- `placement_orders`;
- `backlinks`;
- `global_domain_cache`;
- `keyword_metrics_cache`;
- `keyword_rank_cache`;
- `seo_research_runs`.

At the discovery baseline, production contains historical legacy records and populated SEO caches/logs, while the new `projects`, `placement_orders`, and `backlinks` tables are not yet carrying active production rows.

Existing Domain Research uses server-side Apify/Ahrefs All-in-One with cache behavior. Existing code also contains OpenAI-based semantic reasoning for backlink recommendations.

No current product routes were found for the broader required modules such as:

- Prospect/Discovery workspace;
- file/evidence repository with normalization;
- comprehensive Site Audit;
- Competitive Analysis;
- SEO Plan;
- Proposal Builder;
- Delivery Plan;
- Task Management;
- Reporting workspace.

These are future additive product capabilities.

---

# 21. Technical Preservation Rules

Future implementation must preserve the existing technical rules from `SEO_ARCHITECTURE.md` and Project Knowledge, including:

- existing GitHub repository/history;
- TanStack Start + React;
- Vite;
- Tailwind/existing component system;
- Lovable Cloud managed Supabase;
- production data;
- authentication flow;
- existing custom domain;
- working legacy/backlink flows during migration;
- additive migrations only;
- server-side secrets only;
- cache-first SEO research;
- no direct browser calls to privileged SEO/AI APIs;
- no destructive replacement of legacy tables.

---

# 22. Product Language Rules

Prefer consistent language in UI and documentation:

- Project — workspace for one Client + one Website;
- Prospect — Project lifecycle status before deal;
- Active Project — Project after deal;
- Source Domain — backlink placement website;
- Target Domain — client website;
- Target URL — client page;
- Keyword — SEO query/target term;
- Anchor Text — backlink anchor;
- Finding — research/audit observation;
- Recommendation — suggested action, not automatically committed;
- SEO Plan — strategic action plan;
- Delivery Plan — operational schedule after deal;
- Task — executable unit of work;
- Evidence — file/data/source supporting analysis;
- Report — period-specific performance analysis.

---

# 23. Final Product Principle

The platform should not maximize the number of integrations or AI calls.

It should maximize **continuity of context**:

```text
One Project
+ all relevant evidence
+ normalized structured data
+ factual SEO/marketing data
+ AI reasoning
+ human decisions
+ execution history
+ performance history
```

The SEO Specialist must always be able to understand **where a recommendation came from, what data supported it, what was finally decided, what was implemented, and what happened afterward**.
