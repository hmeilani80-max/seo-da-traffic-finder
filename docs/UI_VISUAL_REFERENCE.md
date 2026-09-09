# SEO Operating System — Approved Visual Reference

> Status: LOCKED visual direction
> Reference: user-approved SEM Boost-style SEO dashboard screenshot supplied on 2026-09-10
> Use together with: `docs/UI_UX_SPEC.md`

---

# 1. Visual Direction

The SEO Operating System should visually follow the supplied SEO dashboard reference closely in **layout language, information density, hierarchy, card treatment, navigation pattern, and overall feel**, while remaining an original implementation.

Do not copy the source branding, logo, text, illustrations, or proprietary graphic assets pixel-for-pixel.

The intended result should feel like:

> **A polished, friendly, high-information SEO SaaS dashboard with a white sidebar, strong Project context, a visual hero header, pastel KPI cards, clean tables, and orange/teal accents.**

This visual reference takes priority over generic admin-dashboard styling.

---

# 2. Application Shell

## Left Sidebar

Desktop sidebar should visually resemble the reference:

- white / very light surface;
- approximately 230–260px wide;
- logo/product identity at the top;
- small muted section label such as `MENU` where useful;
- navigation rows with icon + label;
- active primary section shown using a strong rounded orange/red accent treatment;
- nested submenu items appear indented below the active section;
- selected nested page may use a small orange/red dot indicator;
- Settings and Logout remain near the lower part of the navigation hierarchy where practical.

Avoid a dark full-height sidebar for the main approved desktop design.

## Main Canvas

- soft warm-grey/off-white page background;
- wide content canvas;
- white cards placed on the light background;
- comfortable but not excessive spacing;
- data density should be comparable to the screenshot.

---

# 3. Project Hero / Header

A Project Overview page should have a strong visual header inspired by the reference.

Recommended composition:

```text
┌───────────────────────────────┬──────────────────────────────┐
│ Breadcrumb / Project Context  │                              │
│                               │ Original SEO-themed visual   │
│ Good morning,                 │ / illustration / data motif  │
│ Project / Client Name         │                              │
│                               │                              │
│ domain.com ↗   [Project Tag]  │                              │
└───────────────────────────────┴──────────────────────────────┘
```

Visual behavior:

- teal / blue-green dominant hero background;
- large white heading;
- Project/client/domain context highly visible;
- right side may contain an original SEO/data themed illustration, geometric graphic, or visual composition;
- illustration must be original and not copied from the supplied reference;
- hero may contain small floating data motifs/cards if implemented without visual clutter.

The hero should make the Project feel like the central operating context.

---

# 4. Primary Accent System

The screenshot uses a stronger warm accent than the previous generic blue-first direction.

For the approved UI direction:

- **Primary CTA / active navigation:** orange to orange-red family;
- **Secondary brand / hero:** teal / blue-green family;
- **Positive:** green / lime;
- **Warning:** amber / orange;
- **Critical:** red;
- **AI-specific accent:** may use purple/blue sparingly;
- **Neutral canvas:** off-white / warm light grey;
- **Main cards:** white.

Use semantic design tokens instead of scattering literal colors throughout components.

Do not make every screen rainbow-colored. Pastel accent cards are mainly for high-level KPI and overview modules.

---

# 5. KPI Cards

Use compact, visually distinctive KPI cards similar in proportion and density to the reference.

Examples for Project Overview:

- SEO Health / Site Health;
- Organic Traffic;
- Organic Keywords;
- Backlinks / Referring Domains;
- Paid Search context where connected;
- Open Tasks / SEO Opportunities.

Card behavior:

- rounded corners;
- pastel surfaces may vary by KPI category;
- prominent large metric;
- small delta badge where comparison data exists;
- concise secondary context;
- optional small original icon/mini-visual;
- metric cards should remain easy to scan in one glance.

Suggested visual families:

- peach / light orange;
- aqua / light teal;
- light lime / green;
- warm cream / soft neutral.

Do not fabricate deltas or metrics for visual completeness. Missing metrics must display unavailable/not connected states.

---

# 6. Content Cards and Tables

The lower dashboard area should follow the screenshot's white-card modular layout.

Preferred modules include:

- Top Organic Keywords;
- Traffic trend/comparison;
- Site Audit / On-Page Issues;
- AI Opportunities;
- Backlink health;
- Competitor comparison;
- Recent implementation activity.

Tables should be:

- clean;
- compact;
- visually light;
- row-focused rather than heavily boxed;
- use small badges for Intent, Severity, Status, or Source;
- right-aligned numeric columns where useful;
- designed for fast scanning.

Use `View Report`, `View Details`, `Open Audit`, or similar compact actions in card headers.

---

# 7. Charts

Charts should resemble the visual simplicity of the reference:

- clear axes and labels;
- rounded/clean bars or lines;
- limited series count;
- no unnecessary chart chrome;
- legend close to the title/content;
- chart should explain a real SEO question.

Examples:

- Organic Traffic over time;
- Client vs competitors;
- keyword distribution;
- SEO issue category distribution;
- backlink status distribution.

Do not add charts merely to make the dashboard look analytical.

---

# 8. Recommended Project Overview Composition

```text
LEFT SIDEBAR

PROJECT HERO

Overview                                      [Create/Action] [Export] [Share]

┌────────────────┐ ┌────────────────┐ ┌──────────────────────────────┐
│ SEO Health     │ │ Organic Traffic│ │ Top Organic Keywords         │
│ KPI card       │ │ KPI card       │ │ compact table                │
├────────────────┤ ├────────────────┤ │                              │
│ Opportunities  │ │ Backlinks      │ │                              │
│ KPI card       │ │ KPI card       │ │                              │
└────────────────┘ └────────────────┘ └──────────────────────────────┘

┌─────────────────────────────────┐ ┌────────────────────────────────┐
│ Traffic / Competitor Analytics  │ │ Site Audit / AI Opportunities  │
│ chart                           │ │ summary / donut / issue list   │
└─────────────────────────────────┘ └────────────────────────────────┘
```

Exact content is Project-state dependent. Prospect Projects without connected SEO data should show Discovery/Access/AI Intelligence cards rather than fake empty SEO metrics.

---

# 9. Navigation Adaptation for SEO Operating System

Use the reference's nested-navigation style but adapt labels to our actual product.

Recommended desktop navigation:

## Projects

- All Projects
- Prospects
- Active

## SEO Dashboard

- Overview
- Site Audit
- Competitors
- Keywords & SERP
- SEO Plan

## Execution

- Tasks
- Backlinks

## Business

- Proposal
- Reporting

## Data

- Data Sources
- Files & Evidence

## Settings

Avoid presenting every legacy tool as an unrelated top-level menu.

Existing Domain Research / Keyword Research / Backlink Recommendation capabilities should be surfaced within the Project-centered architecture while legacy routes remain functional during migration.

---

# 10. Page-Level Visual Rules

## Site Audit

- top summary KPI/severity cards;
- clear health score;
- issue category cards/tabs;
- compact affected-URL table;
- AI recommendation shown in a clean detail panel;
- Create Task as a visible action.

## Competitors

- comparison KPI cards;
- Client vs competitor chart;
- competitor table;
- Keyword Gap / Content Gap panels;
- contextual AI insight card.

## Keyword & SERP

- strong search/input region;
- filter tabs/chips;
- dense keyword table;
- colored intent badges;
- opportunity score/status;
- target page column;
- Add to SEO Plan action.

## Proposal

- white document-like central canvas inside the same application shell;
- modular section navigation;
- orange primary actions;
- AI Generate/Rewrite actions visually secondary to human editing.

## Backlinks

- Source Research / Orders / Live / Monitoring tabs;
- compact domain tables;
- historical-use badges;
- metric columns;
- Buy / Skip / Save actions;
- current legacy functionality preserved underneath the new visual system.

## Reporting

- executive KPI cards first;
- period comparison;
- charts/tables beneath;
- AI narrative sections in readable white cards;
- Export/Share actions in the page header.

---

# 11. Responsive Behavior

Desktop is the primary working environment because SEO workflows use wide tables and dense research data.

On tablet/mobile:

- sidebar becomes drawer;
- hero stacks vertically;
- KPI cards become 1–2 columns;
- large tables use horizontal scroll or mobile summaries;
- primary actions remain reachable;
- do not hide critical SEO values just to fit the viewport.

---

# 12. Design Guardrails

Do:

- match the screenshot's visual hierarchy and dashboard density;
- use a white sidebar and light content canvas;
- use a strong teal Project hero;
- use orange/orange-red as the primary action accent;
- use pastel KPI cards selectively;
- keep cards rounded, clean, and friendly;
- make tables highly scannable;
- retain obvious Project context;
- create original graphics/icons/illustrations if visual artwork is used.

Do not:

- copy the SEM Boost logo or branding;
- reproduce the supplied illustration asset;
- copy exact text or branded UI;
- make the product look like a generic dark developer dashboard;
- use excessive gradients/shadows;
- show fabricated metrics;
- sacrifice usability to mimic a screenshot;
- redesign unrelated production modules in a single implementation wave.

---

# 13. Lovable Instruction

When implementing UI waves, Lovable must read both:

- `docs/UI_UX_SPEC.md`
- `docs/UI_VISUAL_REFERENCE.md`

If there is ambiguity about visual direction, `UI_VISUAL_REFERENCE.md` represents the most recently approved visual treatment.

Implementation should preserve existing behavior and progressively migrate screens into this visual system rather than replacing the entire application at once.
