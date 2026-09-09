# SEO Specialist User Story & Operational Playbook

> Product: SEO DA & Traffic Finder / Backlink Manager evolution
> Scope: Internal SEO Specialist workflow
> Discovery baseline: 2026-09-10
> Relationship to architecture: `docs/SEO_ARCHITECTURE.md` remains the technical implementation source of truth for the existing backlink/SEO intelligence architecture. This playbook defines the broader end-to-end user workflow that future implementation must support without breaking existing production behavior.

---

## 1. Primary User

The primary user is an **internal SEO Specialist**.

For the first product version:

- all internal users can see all Clients/Projects;
- PIC/Owner may be stored for operational responsibility, but is not an access restriction;
- there is no Client Portal;
- there is no mandatory client/internal approval workflow inside Tasks;
- one Project represents exactly **one Client + one primary Website**.

---

## 2. Product Job To Be Done

As an SEO Specialist, I need one workspace where I can move from a new client opportunity to audit, research, strategy, proposal, implementation, backlink management, monitoring, and reporting without scattering context across spreadsheets, documents, slides, screenshots, and many disconnected tools.

The platform should reduce repeated data entry and repeated research by keeping the Project context, evidence, structured data, AI analysis, tasks, and reports connected throughout the lifecycle.

---

## 3. Core Human-in-the-Loop Principle

The system follows this pattern:

```text
Collect facts/data
      ↓
Normalize + structure
      ↓
AI analyzes / recommends
      ↓
SEO Specialist reviews / edits
      ↓
SEO Specialist commits the final decision
```

AI is a decision-support system, not the final decision maker.

AI may:

- summarize;
- detect issues;
- extract structured information;
- recommend priorities;
- suggest fixes and copy;
- generate keyword/target-page recommendations;
- generate proposal/report drafts;
- estimate backlink requirements and strategic options.

AI must not silently:

- overwrite user-entered data;
- invent factual SEO metrics;
- set the final budget;
- set contractual guarantees;
- set the final backlink quantity/strategy;
- implement a proposed fix without explicit user action.

---

# 4. End-to-End Lifecycle

```text
New Prospect
    ↓
Discovery & Data Collection
    ↓
Client Intelligence
    ↓
Comprehensive Site Audit
    ↓
Competitive Analysis
    ↓
Keyword & SERP Research
    ↓
SEO Strategy / SEO Plan
    ↓
Proposal + Manual Budget
    ↓
Deal
    ↓
Active Project + Delivery Plan
    ↓
Task Execution
    ↓
Monitoring & Reporting
    ↓
Continuous Analysis / Optimization
```

Off-page/backlink work is a workstream inside this lifecycle and can also be run as a dedicated project requirement.

---

# 5. Playbook Step 1 — Create a Prospect Project

## User Story

As an SEO Specialist, when a potential client approaches me, I want to create a Project quickly with only the information I currently have so that I can start collecting context immediately without completing a long form first.

## Minimum Start

The system should allow a lightweight Project creation flow. At minimum the Project can begin with:

- Client/Project name;
- primary website/domain when known.

Other information is progressive and may be completed later.

## Progressive Discovery Fields

Examples:

- Industry;
- Business model;
- Primary objective: Revenue / Leads / Conversion / Traffic / Awareness / Impact / other;
- Target market;
- Current problem/pain point;
- Contact person;
- Budget indication;
- Known competitors;
- Current marketing activity;
- Existing SEO activity;
- Notes from meetings/discovery;
- Website access status;
- Search Console status;
- Analytics status;
- CMS status;
- Hosting/server status;
- Ecommerce status;
- Paid media/tracking status.

These fields are not all mandatory before research starts.

## Project Status

Product-level lifecycle should support at least:

- Prospect;
- Assessment / Research;
- Proposal;
- Active;
- Lost / Not Proceeding;
- Archived.

Exact database values can be finalized during implementation.

---

# 6. Playbook Step 2 — Collect Files, Links, Media, and Connected Data

## User Story

As an SEO Specialist, I want to add whatever evidence the client gives me, regardless of whether it is structured, so that the platform can build one Project knowledge context.

## Manual Sources

Support manual entry, paste, links, and file/media upload. Relevant formats include:

- CSV;
- XLS/XLSX;
- TXT;
- JSON;
- PDF;
- DOC/DOCX;
- image/screenshot;
- URL/link;
- other supported text/media documents.

## Connected Sources

Where integrations are available, the Project may connect to sources such as:

- Google Search Console;
- Google Analytics / GA4;
- Google Ads;
- ecommerce platforms such as Shopify/WooCommerce;
- CMS/site systems;
- paid-media/tracking platforms;
- other relevant connected sources.

A Project must remain usable even when no connector is available.

## Connection State

Each source should expose a clear state, e.g.:

- Connected;
- Available but not connected;
- Not available;
- Unable to verify;
- Needs attention.

Missing access is information, not a blocker.

---

# 7. Universal Manual Import & Normalization Flow

Manual upload is a core capability across the product, not a backlink-only feature.

Every module that accepts imported data should follow:

```text
Upload / Paste / Import
        ↓
Detect file/data structure
        ↓
Normalize
        ↓
Suggest field mapping
        ↓
Validate + detect duplicates/errors
        ↓
DATA PREVIEW
        ↓
User confirms or remaps
        ↓
Save
```

Nothing should be permanently inserted before user confirmation when import structure is uncertain.

## Normalization Examples

### Domain normalization

These should be recognized as the same domain when the context is a domain:

```text
HTTPS://WWW.Example.com/article?id=1
www.example.com/
example.com
```

Normalized value:

```text
example.com
```

### Column mapping

Imported columns such as:

```text
Nama Web | Authority | Visitor | Harga Vendor
```

may be suggested as:

```text
Nama Web     → Source Domain
Authority    → DR
Visitor      → Organic Traffic
Harga Vendor → Price
```

The user may override the mapping before save.

## Provenance

Structured records should preserve data provenance where practical:

- Manual Entry;
- Manual Upload;
- Connected Source;
- API;
- Public Crawl;
- AI Extracted;
- Imported Legacy Data.

Raw/original values should be retained when useful for traceability.

---

# 8. Playbook Step 3 — AI Client Intelligence

## User Story

As an SEO Specialist, I want AI to read the Project information, uploads, links, and connected data so that I can quickly understand the business and identify what is still missing.

## Expected AI Output

AI Client Intelligence may produce:

### Business Understanding

- what the company does;
- product/service context;
- target audience;
- market/geography;
- likely digital funnel;
- positioning found in the supplied evidence.

### Client Objectives

- stated business objectives;
- SEO/digital objectives;
- KPI expectations;
- constraints;
- concerns.

### Available Data & Access

- what sources exist;
- what is connected;
- what evidence has been uploaded;
- what cannot yet be verified.

### Initial Findings

- early SEO/digital observations;
- possible opportunities;
- possible risks.

### Missing Information

AI should identify useful questions for the next discovery interaction, e.g. missing Search Console access, conversion tracking, target geography, or known competitors.

### Recommended Next Actions

Examples:

1. Connect Search Console;
2. Run comprehensive Site Audit;
3. analyze organic/paid competitors;
4. research high-business-value keywords.

## Suggested Structured Fields

AI may extract Project fields from unstructured data, but the behavior must be:

```text
AI Suggestion → Review → Accept / Edit / Ignore
```

AI must not silently modify the authoritative Project fields.

---

# 9. Playbook Step 4 — Comprehensive Site Audit

## User Story

As an SEO Specialist, I want one comprehensive audit rather than manually choosing many audit scopes so that I get a complete view of the site based on all available public and connected data.

## Before Audit

The platform should use all relevant data that is currently available:

- website/public crawl;
- sitemap;
- robots directives;
- public technical signals;
- connected Search Console/Analytics/ecommerce/ads data;
- uploaded evidence;
- SEO provider/API data.

No scope selector is required for the normal audit workflow. The audit checks all supported categories.

## Audit Categories

The comprehensive checklist should cover the uploaded audit/checklist knowledge and supported engine capabilities, including areas such as:

- titles and meta descriptions;
- H1-H6/headings;
- canonicalization;
- index/noindex behavior;
- robots/sitemap;
- internal/external links;
- broken links;
- images and alt text;
- duplicate content/signals;
- Open Graph/social metadata;
- hreflang where relevant;
- schema/structured data;
- performance/server-response indicators;
- information architecture;
- page-level SEO elements;
- other supported technical/on-page checks.

## Audit Result State

Each check should have an explicit outcome such as:

- Passed;
- Issue;
- Warning;
- Not Found;
- Unable to Verify.

The platform should record positive checks as well as failures, so the user understands what was tested.

## AI Audit Analyst

AI uses the deterministic/factual audit output plus Project context to:

- detect and group issues;
- identify anomalies;
- assign/recommend severity;
- explain why each issue matters;
- suggest a fix;
- generate an actionable example where appropriate.

Example:

```text
Issue: Meta Description Missing
Severity: High
Affected URL: /product-a
Why it matters: ...
Suggested fix: ...
Recommended Meta Description: <AI-generated draft based on page and target intent>
```

Severity may include:

- Urgent/Critical;
- High;
- Medium;
- Warning;
- Informational.

## Audit to Task

Every actionable issue should support:

```text
[Create Task]
```

The Task retains source context:

- audit run;
- issue;
- affected URL(s);
- severity;
- evidence;
- AI recommendation;
- suggested fix.

---

# 10. Playbook Step 5 — Competitive Analysis

## User Story

As an SEO Specialist, I want to know who is actually beating the client in organic and paid search, why they are winning, and what opportunities can be copied or countered.

## Competitor Discovery

The system should discover competitors automatically from SEO/search data where possible and also allow manual management.

User actions:

- Add Competitor Manually;
- Ignore/Remove;
- Mark as Primary Competitor.

Organic and paid competitors may be different.

## Organic Analysis

Relevant comparison may include:

- shared keywords;
- organic traffic;
- authority;
- ranking overlap;
- top pages;
- content gaps;
- keyword gaps;
- backlink profile/gap;
- SERP positioning.

## Paid Analysis

Where data/provider support exists, relevant output may include:

- paid competitors;
- paid keywords;
- ad title/copy/description;
- landing URL;
- CPC;
- other available paid-search context.

## AI Competitive Analyst

AI should answer questions such as:

- Who is outperforming us?
- In which areas?
- Why are they beating us?
- Which gaps matter for the client's business objective?
- Which opportunities should become SEO Plan items?

---

# 11. Playbook Step 6 — Keyword Research & SERP Analysis

## User Story

As an SEO Specialist, I want keyword research to use all Project context rather than starting from an isolated seed keyword every time.

## Inputs

Possible inputs include:

- client website/business context;
- Project objective;
- target market;
- current rankings;
- Search Console data;
- competitor keywords;
- keyword gaps;
- SERP data;
- current top pages;
- manually supplied seed keywords.

## Candidate Keyword Data

Where factual data is available, candidate records may include:

- Keyword;
- Search Volume;
- Keyword Difficulty;
- CPC;
- Traffic Potential;
- Search Intent;
- Current Position;
- Current Ranking URL;
- Competitors Ranking;
- SERP context/features;
- Opportunity Score.

## AI Prioritization

AI should prioritize by more than volume. Relevant factors include:

- business value;
- client objective;
- likelihood to rank;
- existing position;
- competition/difficulty;
- semantic fit;
- SERP context.

Suggested groups:

- Quick Wins;
- High Business Value;
- Content Opportunities;
- Competitor Gaps;
- Brand/Awareness Opportunities.

## Keyword → Target Page Mapping

For shortlisted keywords AI should recommend either:

```text
Optimize Existing Page → <URL>
```

or:

```text
Create New Page Recommended
```

The user may accept, edit, or manually select another target page.

Selected opportunities can be added to the SEO Plan.

---

# 12. Playbook Step 7 — SEO Plan & Proposal Builder

## User Story

As an SEO Specialist, I want the platform to convert audit/research evidence into a proposal draft while keeping commercial decisions under my control.

## Proposal Sources

Proposal content can use:

- Client Intelligence;
- current performance;
- audit findings;
- competitor gaps;
- keyword/SERP opportunity;
- content strategy;
- technical/on-page recommendations;
- off-page/backlink analysis;
- traffic/impact scenarios;
- user-entered strategy notes.

## Modular Proposal Sections

A Proposal may include/reorder/remove modules such as:

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
- ROI / SEO-vs-SEM scenario;
- Disclaimer/assumptions.

## Budget Rule

**Budget is entered and finalized manually by the SEO Specialist.**

AI may help:

- structure budget lines;
- explain budget rationale;
- calculate arithmetic from user-entered values;
- present scenarios.

AI must not decide final commercial pricing.

## Commitment Rule

Quantities, guarantees, contractual KPI, and final scope are user-controlled. Forecasts must be labeled as estimates and preserve assumptions/disclaimers.

---

# 13. Playbook Step 8 — Convert Deal to Active Project

The Project is not recreated after a deal.

The lifecycle changes from pre-sales to active delivery while preserving all historical context:

```text
Prospect / Proposal
        ↓
Mark as Deal
        ↓
Active Project
```

Audit, files, research, recommendations, proposal, and evidence remain linked to the same Project.

## Approved Scope to Delivery Plan

Do not create hundreds of Tasks immediately from a Proposal.

Use:

```text
Proposal
   ↓
Final/Approved Scope
   ↓
Delivery Plan
   ↓
Tasks
```

A Delivery Plan may organize commitments by month or phase, e.g.:

```text
M1
- Technical & On-Page Optimization
- Keyword Mapping
- Content Plan
- X Content
- Y Backlinks
- Tracking Setup
- Monitoring
- Report

M2
- Content Production
- Backlink Production
- Ongoing Optimization
- Monitoring
- Report
```

The SEO Specialist can edit activities, timing, and quantities before activating the plan.

---

# 14. Playbook Step 9 — Task Execution

## Task Status

Keep execution simple:

```text
To Do → In Progress → Done
```

Optional operational statuses may include Blocked/Cancelled if required, but there is **no mandatory Approval/Client Review stage**.

## Task Data

Tasks may include:

- Project;
- PIC/Owner;
- due date;
- priority;
- category;
- related URL;
- related Keyword;
- source type;
- source record/reference;
- AI recommendation;
- attachment/evidence;
- notes/comments;
- before evidence;
- after evidence;
- result/impact.

## Task Sources

Tasks may originate from:

- Audit issue;
- Competitor finding;
- Keyword opportunity;
- SEO Plan;
- Backlink finding;
- Report recommendation;
- Manual task.

---

# 15. Playbook Step 10 — Reporting & Continuous Analysis

## User Story

As an SEO Specialist, I want to generate reporting from automatic connected data when available, but I also need reporting to work from screenshots/documents/manual evidence when a connection does not exist.

## Reporting Inputs

### Automatic

Where connected:

- GA4/Analytics;
- Search Console;
- ranking data;
- backlink data;
- audit results;
- Google Ads/other paid media;
- ecommerce/conversion data;
- Project Tasks/Delivery Plan.

### Manual

- screenshots/images;
- spreadsheets;
- PDF/DOCX;
- JSON;
- links;
- notes;
- other supported media.

## AI Reporting Assistant

User provides an objective/prompt, for example:

```text
Create the monthly SEO report for management. Focus on traffic, keyword movement, conversions, backlinks, delivery progress, risks, and next actions.
```

AI may generate:

- Executive Summary;
- KPI Performance;
- Traffic & Conversion Analysis;
- Keyword Performance;
- Page/Content Performance;
- Technical SEO Progress;
- Backlink Performance;
- Paid-media context where relevant;
- Implementation Progress;
- Key Findings;
- Issues/Risks;
- Recommendations / Next Actions.

## Reporting Rules

- Never invent missing metrics.
- Clearly state when data is unavailable/unverified.
- Preserve source/provenance where possible.
- Store report by period.
- Allow editing.
- Preserve version/history.
- Support comparison with prior periods.
- Support Weekly / Monthly / Custom Range.
- Target export formats: PDF, DOCX, PPTX, XLSX where applicable.
- A shareable report link may be supported, but this does not create a Client Portal.

---

# 16. Off-Page / Backlink Playbook

Off-page may be used as part of a full SEO Project or as a dedicated deliverable.

## 16.1 Backlink Baseline

Input may come from two routes:

### Manual

- paste domains/data;
- upload CSV/XLSX/JSON/TXT/document;
- manual existing backlink data;
- manual competitor data.

### Automatic

- SEO provider/API;
- connected data;
- existing Project data;
- public research/crawl.

All manual input follows the universal Normalization + Data Preview workflow.

## 16.2 Backlink Analysis

Relevant factual inputs may include:

- DR/authority;
- organic traffic;
- keyword positions;
- backlink count;
- referring domains;
- dofollow/nofollow;
- anchor distribution;
- lost/new backlinks;
- domain quality/relevance;
- competitor backlink profile/gap.

## 16.3 AI Backlink Planning

AI may calculate/recommend:

- backlink gap;
- estimated quantity;
- source-quality criteria;
- DR/traffic criteria;
- target keywords;
- target pages;
- anchor mix;
- monthly distribution;
- competitor gap;
- diversity considerations.

The user can also bypass AI and enter/edit strategy manually.

**Final quantity and final strategy are always determined by the SEO Specialist.**

## 16.4 Source Domain Research

Candidate sources may come from vendors, marketplaces, outreach lists, manual upload, or API.

For every normalized source domain, check historical usage:

- used in this Project?
- used elsewhere in accessible history?
- how many times?
- last purchase/use date?
- keyword/anchor?
- target URL?
- vendor/platform?
- historical price?

Duplicates are warnings, not automatic blocks.

Then evaluate factual quality data such as:

- DR;
- organic traffic;
- referring domains;
- backlinks;
- topical relevance inputs;
- top keywords/pages;
- country/language context;
- spam/risk signals where supported.

AI may label a candidate:

- Recommended;
- Consider;
- Avoid;

with explanation, while preserving human decision control.

## 16.5 Buying Decision

User selects:

```text
Buy / Skip / Save for Later
```

If Buy, capture relevant data such as:

- Source Domain;
- vendor/seller/platform;
- price;
- keyword/anchor;
- target URL;
- purchase/order date;
- notes;
- SEO metric snapshot used for the decision.

## 16.6 Placement Lifecycle

Target operational lifecycle:

```text
Planned
  ↓
Ordered / Purchased
  ↓
Content / Processing
  ↓
Live
  ↓
Verified
```

Alternate terminal states:

```text
Cancelled / Failed
```

## 16.7 Live Backlink Record

When live, store relevant information including:

- source domain;
- live/source URL;
- target URL;
- keyword/anchor;
- vendor;
- price;
- date live;
- link type;
- decision-time DR/traffic snapshot;
- evidence/notes;
- verification timestamps.

## 16.8 Backlink Monitoring

The platform should be able to recheck live placements and detect, where technically possible:

- still live;
- removed/lost;
- redirect;
- HTTP error;
- changed target;
- changed link attribute/dofollow/nofollow;
- other material changes.

A monitoring issue may create a warning or Task.

---

# 17. Internal Team Access Model

Product requirement for the first version:

- authenticated internal users can see all Projects and shared operational data;
- Task owner/PIC is informational/operational, not an authorization boundary;
- no per-client user partitioning is required yet;
- no Client Portal is required.

This requirement must be reconciled with the current production RLS implementation before implementation because existing tables currently use per-user ownership rules.

---

# 18. Product Definition of Success

The workflow is successful when an SEO Specialist can:

1. create a new prospect quickly;
2. progressively add discovery information;
3. upload/import heterogeneous evidence;
4. normalize imported data safely;
5. connect available sources;
6. use AI to understand the client and identify missing information;
7. run a comprehensive audit;
8. turn findings into actionable Tasks;
9. discover/analyze competitors;
10. research/prioritize keywords and target pages;
11. create an SEO Plan;
12. generate a proposal draft while controlling budget and commitments;
13. convert the same Project to Active after a deal;
14. create a Delivery Plan and Tasks;
15. run backlink planning, sourcing, placement, and monitoring when needed;
16. collect performance data automatically or manually;
17. generate editable periodic reports with AI;
18. retain Project history in one system.

---

# 19. Explicitly Out of Scope for This Playbook Version

- Client Portal;
- mandatory approval workflow;
- per-Project access restrictions between internal SEO Specialists;
- AI-controlled final commercial pricing;
- AI-controlled final backlink quantity/strategy;
- destructive replacement of existing backlink data or working production flows;
- forcing every integration to be connected before a Project can proceed.
