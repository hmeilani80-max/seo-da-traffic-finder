# SEO Operating System — UI / UX Specification

> Status: Approved design direction
> Primary user: Internal SEO Specialist
> Visual reference: user-approved SEO dashboard screenshot supplied during discovery (SEM Boost-style dashboard direction)
> Product requirements: `docs/PRD.md`
> Workflow reference: `docs/USER_STORY_PLAYBOOK.md`
> Technical constraints: `docs/SEO_ARCHITECTURE.md`

---

# 1. Design Objective

The UI should make a complex SEO operating system feel simple, visual, and operational.

The product must not feel like a collection of disconnected tools.

It should feel like:

> **A modern SEO command center organized around one Project.**

The approved visual direction uses the supplied dashboard screenshot as inspiration for:

- left sidebar navigation;
- clear project context;
- large project header/hero area;
- modular KPI cards;
- clean white content cards;
- compact operational tables;
- limited but useful charts;
- friendly modern SaaS visual language;
- strong visual hierarchy;
- contextual action buttons;
- dense information that remains easy to scan.

Do not copy the reference pixel-for-pixel or reproduce its branding/illustrations. Reuse the design principles, information hierarchy, spacing, dashboard density, and interaction patterns.

---

# 2. Core UX Mental Model

User navigation should follow:

```text
GLOBAL WORKSPACE
      ↓
PROJECT
      ↓
CONTEXT / DATA
      ↓
RESEARCH / INTELLIGENCE
      ↓
PLAN / PROPOSAL
      ↓
EXECUTION
      ↓
MONITORING / REPORTING
```

The user should always know:

1. Which Project am I working on?
2. What is the current state of this Project?
3. What data is available?
4. What needs attention?
5. What is the recommended next action?

---

# 3. Application Shell

## 3.1 Desktop layout

Recommended structure:

```text
┌──────────────┬───────────────────────────────────────────────┐
│ Sidebar      │ Top Bar                                       │
│              ├───────────────────────────────────────────────┤
│              │                                               │
│              │ Main Content                                  │
│              │                                               │
└──────────────┴───────────────────────────────────────────────┘
```

### Sidebar

Recommended width:

```text
240–260px
```

Behavior:

- fixed/sticky on desktop;
- scrollable if content exceeds height;
- collapsible may be added later, but is not required for initial implementation;
- active navigation must be obvious;
- parent sections can expand/collapse where helpful.

### Top Bar

Contains global actions such as:

- current Project selector/context;
- global search;
- Ask AI;
- notification indicator if implemented;
- current user/profile;
- optional quick-create action.

Top bar should remain visually lightweight and should not compete with page content.

---

# 4. Navigation Architecture

Recommended global sidebar:

## Main

- Dashboard
- Projects

## Research & Intelligence

- Site Audit
- Competitors
- Keywords & SERP
- SEO Plan

## Execution

- Tasks
- Content / Content Workstream if implemented
- Backlinks

## Business

- Proposal
- Reporting

## Workspace

- Data Sources
- Files & Evidence
- Settings

### Navigation rule

Project-aware modules should open in the selected Project context.

If no Project is selected, the system should either:

- show global overview/list; or
- ask user to select/create a Project before entering a Project-only module.

Do not repeatedly ask the user to enter the same domain in every module once Project context exists.

---

# 5. Visual Design System

## 5.1 Overall style

- modern SaaS/admin dashboard;
- light main canvas;
- clear card surfaces;
- clean typography;
- restrained decoration;
- strong hierarchy;
- friendly but professional;
- optimized for long work sessions.

## 5.2 Color direction

Use the existing app/design system tokens wherever possible.

Target semantic usage:

- Primary action: blue / blue-teal family;
- Positive / Connected / Passed: green/teal;
- Warning: amber/orange;
- Urgent / Error: red;
- Informational / AI: blue/purple accent can be used sparingly;
- Neutral backgrounds: soft grey/off-white;
- Main cards: white/light surface.

Do not hardcode an unrelated new palette if current Tailwind/component tokens can be extended safely.

## 5.3 Card style

Recommended:

- 10–12px radius;
- subtle border;
- minimal shadow;
- clear card title;
- optional icon/badge;
- compact supporting text;
- actions aligned consistently.

Cards should group meaningful information, not decorate every field.

## 5.4 Typography

Prefer the current application typography or a clean SaaS sans-serif equivalent.

Visual hierarchy:

- Page title: strong and clear;
- Section title: medium emphasis;
- KPI number: prominent;
- supporting label: compact;
- metadata/helper copy: muted;
- tables: optimized for readability, not oversized.

## 5.5 Spacing

Use a consistent 4/8px-based spacing rhythm.

Recommended content width:

- dashboard/project pages may use wide layouts;
- text-heavy editors/reports may use a constrained readable canvas inside the wider shell.

---

# 6. Dashboard

The global dashboard provides an overview across internal SEO Projects.

Recommended layout:

## Header

```text
Good morning, [User]
Here’s what’s happening across your SEO projects.
```

Primary actions:

- Create Project;
- Open Recent Project;
- optional Ask AI.

## Summary cards

Examples:

- Active Projects;
- Prospects;
- Open Tasks;
- Urgent SEO Issues;
- Backlinks Requiring Attention;
- Reports Due / Recent Reports.

Do not overload the dashboard with every metric from every Project.

## Recent Projects

Each Project card/list item may show:

- Project name;
- domain;
- lifecycle status;
- SEO Health if available;
- key KPI snapshot;
- urgent issue count;
- next action.

## AI / Attention card

Example:

```text
3 opportunities need attention
• 12 keywords are ranking #8–20
• 7 priority pages have missing meta descriptions
• 4 live backlinks require verification

[Review Opportunities]
```

AI/insight cards should always link to underlying data when possible.

---

# 7. Project Header & Project Workspace

Opening a Project should establish a persistent Project identity.

## Project header

Display:

- Project / Client Name;
- primary domain;
- lifecycle status;
- objectives as chips/tags;
- optional health/traffic summary;
- key actions.

Example:

```text
ABC Company
abc.com
[Prospect]

Revenue   Leads   Traffic
```

Primary actions may include:

- Ask AI;
- Add Evidence;
- Connect Data;
- Run Audit;
- Generate Proposal depending on lifecycle.

## Project sub-navigation

Recommended tabs or contextual nav:

- Overview;
- Intelligence;
- Audit;
- Competitors;
- Keywords;
- Plan;
- Proposal;
- Tasks;
- Backlinks;
- Reports;
- Files.

Do not make the user return to global sidebar for every Project sub-workflow if local navigation is clearer.

---

# 8. Project Overview

Project Overview should summarize context, not repeat every detail.

Recommended card groups:

## Business Context

- Industry;
- Primary Objective;
- Target Market;
- Current Problem;
- Project status.

## Connections

Show source cards/badges:

```text
Search Console  Connected
GA4             Connected
Google Ads      Connected
Meta Ads        Not Connected
CMS             Not Connected
```

## SEO Snapshot

When data exists:

- SEO Health;
- Organic Traffic;
- Ranking Keywords;
- Backlinks/Referring Domains;
- Open Issues;
- Open Tasks.

## AI Client Intelligence

Display concise blocks:

- What I Understand;
- Missing Information;
- Recommended Next Actions.

Actions:

- Analyze Again;
- Ask AI;
- Review Suggested Project Fields.

---

# 9. Data Sources UX

Use a connection-card pattern.

Each connection card shows:

- icon/service name;
- state;
- account/property if known;
- last sync;
- error if any;
- Connect / Reconnect / Disconnect / View Data action according to implementation.

Connection states must be visually distinct:

- Connected;
- Available;
- Not Connected;
- Error;
- Unsupported / Manual Needed.

A missing connection must not block the user from adding manual evidence.

---

# 10. Files & Evidence UX

A prominent upload/add-evidence area should support:

- drag & drop;
- file picker;
- Paste Data;
- Add Link;
- Add Note/manual evidence.

Evidence list should show:

- filename/title;
- type;
- source;
- date;
- processing state;
- whether AI extraction/analysis is available;
- associated module if relevant.

Suggested processing states:

- Uploaded;
- Processing;
- Ready;
- Failed.

Failure should preserve the source record and allow retry where appropriate.

---

# 11. Manual Import / Data Normalization UX

This is a reusable system pattern and must not be rebuilt differently in each module.

## Step 1 — Input

User:

- uploads file;
- pastes rows;
- imports source data.

## Step 2 — Detection

Show detected source and row count.

Example:

```text
rajabacklink-september.xlsx
127 rows detected
```

## Step 3 — Field Mapping

Use a table:

| Source Column | Detected Field  | Confidence | Action   |
| ------------- | --------------- | ---------- | -------- |
| Website       | Source Domain   | High       | dropdown |
| Authority     | DR              | High       | dropdown |
| Visitor       | Organic Traffic | Medium     | dropdown |
| Harga         | Price           | High       | dropdown |

AI/automatic mapping may be used, but user can override.

## Step 4 — Validation Summary

Cards/counts:

- Valid;
- Duplicate;
- Invalid;
- Missing Required.

## Step 5 — Data Preview

Show normalized preview before permanent save.

Actions:

```text
[Process Again]
[Edit Mapping]
[Save & Continue]
```

Never hide normalization errors.

---

# 12. Site Audit UX

## Header

Show:

- domain;
- audit date;
- audit status;
- source/data coverage;
- Run Audit / Re-run Audit action.

No normal scope selector is required.

## KPI cards

Recommended:

- Health Score;
- Urgent;
- Issues;
- Warnings;
- Passed;
- Unable to Verify.

## Filters

```text
All | Urgent | Issues | Warning | Passed | Unable to Verify
```

Additional filters may include:

- category;
- URL;
- status;
- task created/not created.

## Issue row/card

Example:

```text
Missing Meta Description                     [High]
12 affected pages

Why it matters
Pages without meta descriptions reduce control over search snippets.

AI Suggested Fix
"ABC helps Indonesian businesses ..."

[View Pages] [Create Task] [Edit Recommendation]
```

Factual evidence and AI recommendation must be visually separated.

## Detail drawer/page

Show:

- check name;
- severity;
- evidence;
- affected URLs;
- source;
- how to fix;
- AI recommendation;
- linked Task if any.

---

# 13. Competitive Analysis UX

Header question:

> **Who is actually beating us in organic and paid search?**

## Competitor table

Possible columns:

- Competitor;
- Organic Traffic;
- Authority;
- Shared Keywords;
- Keyword Gap;
- Paid Keywords;
- Referring Domains;
- Priority/Primary flag.

## Controls

- Discover Competitors;
- Add Competitor;
- Ignore;
- Mark Primary.

## AI Analysis panel

Summarize:

- strongest competitor;
- key advantage;
- biggest gap;
- recommended opportunity.

Actions link to underlying keyword/content/backlink gap.

---

# 14. Keyword & SERP UX

## Search / discovery header

Example:

```text
Find the best opportunities for ABC
[ Enter keyword or topic... ] [Research]
```

## Opportunity tabs

- Recommended;
- Quick Wins;
- Competitor Gap;
- High Value;
- Content Opportunity;
- All Keywords.

## Keyword table

Suggested fields:

- Keyword;
- Intent;
- Volume;
- KD;
- Position;
- CPC;
- Traffic Potential;
- Target Page;
- Opportunity Score;
- Status.

Target Page display:

```text
/product-a                  Existing Page
Create New Page             Recommendation
```

Actions:

- Add to SEO Plan;
- Edit Target Page;
- View SERP;
- Refresh Metrics only with explicit user action when paid calls may occur.

---

# 15. SEO Plan UX

SEO Plan should support grouped prioritization.

Recommended views:

- Priority List;
- Workstream;
- optional Kanban later.

Categories may include:

- Technical;
- On-Page;
- Content;
- Keyword;
- Off-Page;
- Tracking/Analytics.

Each item should show:

- action;
- priority;
- expected impact;
- source finding;
- related URL/keyword;
- status.

Actions:

- Add to Proposal;
- Create Task;
- Edit;
- Remove from Plan.

---

# 16. Proposal Builder UX

Proposal is a modular page builder, not a blank Word clone.

## Layout

Recommended desktop layout:

```text
┌────────────────┬────────────────────────────────────┐
│ Section List   │ Proposal Canvas                    │
│                │                                    │
│ Executive      │ Selected section content           │
│ Pain Point     │                                    │
│ Audit          │                                    │
│ Competitor     │                                    │
│ Keyword        │                                    │
│ Strategy       │                                    │
│ Timeline       │                                    │
│ Budget         │                                    │
└────────────────┴────────────────────────────────────┘
```

## Section behavior

User can:

- add;
- remove;
- reorder;
- edit;
- duplicate if useful;
- Generate with AI;
- Regenerate specific section.

AI generation should display source/context indicators when possible.

## Budget

Budget is manual input.

AI can help organize categories or narrative but must not silently fill authoritative pricing.

## Proposal status

Suggested:

- Draft;
- Ready;
- Sent/Shared if implemented;
- Accepted/Deal;
- Not Proceeding.

---

# 17. Delivery Plan UX

After Deal, show Draft Delivery Plan before Task creation.

Recommended timeline/grouping:

- Month;
- Phase;
- Workstream.

Example:

```text
M1
Technical & On-Page
Keyword Mapping
60 Content
20 Backlinks
Monitoring
Report
```

Allow:

- edit quantity;
- edit timing;
- reorder;
- split activity;
- create Task when needed.

Avoid automatically rendering hundreds of tasks for quantity-based deliverables.

---

# 18. Task UX

Keep Task Management simple.

Core statuses:

```text
To Do | In Progress | Done
```

Optional filters:

- Project;
- PIC;
- Priority;
- Category;
- Due Date;
- Source.

Task detail should preserve source context.

Example source badge:

```text
Source: Site Audit
Issue: Missing Meta Description
Audit: 10 Sep 2026
```

AI Suggested Fix can be displayed in its own card.

No mandatory client/internal approval step.

---

# 19. Backlink UX

Backlink module should evolve existing workflows rather than rebuild them.

Recommended tabs:

```text
Plan | Source Research | Orders | Live Backlinks | Monitoring
```

## Plan

Display:

- KPI/goal context;
- AI recommendation if generated;
- final human-defined quantity/strategy;
- monthly distribution.

## Source Research

Top area:

- manual paste/upload;
- import;
- API/source action if available.

Table fields may include:

- Source Domain;
- History;
- DR;
- Traffic;
- Referring Domains;
- Relevance;
- AI Recommendation;
- Decision.

History badge examples:

- Never Used;
- Used 1×;
- Used 3×.

History does not block Buy.

Decision:

```text
Buy | Skip | Save for Later
```

## Orders

Track placement lifecycle.

## Live Backlinks

Show live records and factual snapshot.

## Monitoring

Highlight:

- Missing;
- Redirected;
- Nofollow Changed;
- Target Changed;
- Error;
- Needs Verification.

---

# 20. Reporting UX

## Report header

```text
Monthly SEO Report — August 2026
Project ABC
```

Show source coverage:

```text
GA4 ✓
Search Console ✓
Backlinks ✓
Manual Evidence 3
```

## Report builder

Suggested sections:

- Executive Summary;
- KPI;
- Traffic;
- Conversion;
- Keywords;
- Pages;
- Technical SEO;
- Content;
- Backlinks;
- Implementation Progress;
- Findings;
- Next Actions.

AI action:

```text
[Generate Report]
```

Custom prompt field should be available.

## Period comparison

Show concise comparison cards:

- Traffic change;
- Conversion change;
- ranking movement;
- backlink change;
- issue/task change.

User can ask:

> What changed the most compared with the previous report?

## Output

Provide supported export/share actions without making them primary to the editing workflow.

---

# 21. AI UX Pattern

AI should be contextual, not a generic floating chatbot as the only experience.

Preferred patterns:

## Contextual AI card

Used for:

- Client Intelligence;
- Audit reasoning;
- competitor analysis;
- keyword opportunity;
- backlink recommendation;
- reporting.

## Generate action

Examples:

- Generate Suggestions;
- Analyze with AI;
- Generate Proposal Section;
- Generate Report.

## Ask AI

Project-level Ask AI may answer using Project context.

## AI visual distinction

Every AI-generated item should be clearly marked as:

- AI Suggested;
- AI Analysis;
- Draft;
- Recommendation.

Do not visually present AI output as measured factual data.

---

# 22. Table UX Rules

Tables are primary for operational SEO datasets.

Every major table should support relevant combinations of:

- search;
- sort;
- filter;
- pagination or efficient virtualized rendering where needed;
- row selection for bulk action where useful;
- export where appropriate;
- sticky headers for long datasets where practical.

Avoid excessive horizontal columns.

Less-used fields can move into:

- row detail drawer;
- expandable section;
- column chooser later.

---

# 23. Chart UX Rules

Charts should answer a question.

Use charts for:

- trend over time;
- competitor comparison;
- category distribution;
- forecast;
- KPI progress.

Do not create charts only to fill dashboard space.

Every chart should have:

- clear title;
- axis/legend when needed;
- readable tooltip;
- period/source context.

---

# 24. Status & Severity System

Use consistent semantic badges across modules.

## Audit severity

- Urgent;
- High / Issue;
- Warning;
- Info;
- Passed;
- Unable to Verify.

## Connection status

- Connected;
- Available;
- Not Connected;
- Error;
- Unsupported.

## Task status

- To Do;
- In Progress;
- Done;
- Blocked;
- Cancelled.

## Project lifecycle

- Prospect;
- Assessment;
- Proposal;
- Active;
- Lost;
- Archived.

## Backlink lifecycle

- Planned;
- Purchased/Ordered;
- Processing;
- Live;
- Verified;
- Cancelled;
- Failed.

Do not use different labels for the same state in different modules without reason.

---

# 25. Loading, Empty & Error States

## Loading

Use skeletons for cards/tables when appropriate.

For long external research:

- show progress/status;
- show what is being processed;
- preserve partial success.

## Empty states

Empty state should tell the user what to do next.

Example:

```text
No audit has been run yet.
Run a comprehensive audit to identify technical and on-page issues.
[Run Site Audit]
```

## Error

Error state should include:

- what failed;
- what data was preserved;
- retry action when safe;
- manual alternative if available.

---

# 26. Cost-Aware UX

For external paid calls or potentially expensive bulk research:

- do not run automatically on page load;
- reuse cache;
- show cached/fresh state;
- show expected workload/calls when practical;
- require explicit action for refresh/regenerate.

Example:

```text
20 domains detected
14 cached
6 require fresh research
[Run Research]
```

---

# 27. Responsive Behavior

Primary target is desktop/laptop internal work.

Mobile/tablet should remain usable for:

- checking Project status;
- viewing dashboard;
- reading reports;
- updating simple Task status;
- viewing alerts.

Complex workflows such as:

- large imports;
- field mapping;
- proposal builder;
- large backlink tables;
- deep audit analysis

may prioritize desktop while remaining non-broken on smaller screens.

On mobile:

- sidebar becomes drawer;
- card grids stack;
- tables can horizontally scroll or switch to condensed cards when necessary;
- primary actions remain reachable.

---

# 28. Accessibility & Interaction

Minimum expectations:

- keyboard-accessible forms and controls;
- visible focus state;
- status not communicated by color alone;
- labels for icons/buttons;
- readable contrast;
- confirmation for destructive actions;
- no critical information only in hover state.

---

# 29. Reusable Component Direction

Prefer extending the current component system.

Candidate reusable product components:

- `ProjectHeader`;
- `ProjectStatusBadge`;
- `KpiCard`;
- `AiInsightCard`;
- `ConnectionCard`;
- `EvidenceUploader`;
- `ImportWizard`;
- `FieldMappingTable`;
- `DataPreviewTable`;
- `SeverityBadge`;
- `SourceBadge`;
- `ResearchStatusBadge`;
- `EmptyState`;
- `PageSection`;
- `MetricSnapshot`;
- `ProjectTabs`;
- `DataSourceIndicator`.

Reuse before duplicating visual patterns per page.

---

# 30. MVP UI Success Criteria

The UI/UX direction is successful when:

1. A new user can tell that the product is Project-centered, not tool-centered.
2. A user can create/open a Project in a few clicks.
3. Project name/domain remains visible through major workflows.
4. Connected and manual data paths are both obvious.
5. Data upload includes normalization/preview rather than silent ingestion.
6. AI output is clearly differentiated from factual data.
7. Audit issues are easy to scan by severity.
8. Keyword and competitor data remain table-friendly despite high density.
9. Proposal is modular and easier than assembling Slides manually.
10. Backlink workflow preserves the strengths of the existing tool while fitting the new design system.
11. Reports are readable by management without exposing unnecessary raw complexity.
12. The design remains visually consistent across all future implementation waves.

---

# Final UI Principle

```text
PROJECT CONTEXT FIRST
DATA SECOND
INSIGHT THIRD
ACTION ALWAYS CLEAR
```

The interface should hide unnecessary technical complexity while keeping SEO evidence, provenance, and human control visible when the user needs them.
