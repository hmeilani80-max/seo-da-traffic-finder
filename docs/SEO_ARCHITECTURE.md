# Backlink & SEO Outreach Management — Final Architecture

## Primary Objective

Extend the existing **SEO DA & Traffic Finder** application into a project-based **Backlink & SEO Outreach Management** system.

**This is not a greenfield rebuild.**

The existing application, GitHub repository, Supabase data, routes, working domain-research flow, and existing integrations must remain functional while the new architecture is introduced incrementally.

Before making changes:

1. Inspect the existing GitHub repository.
2. Inspect the current Supabase schema and migrations.
3. Inspect existing routes, components, server functions, API integrations, authentication, RLS policies, and environment variables.
4. Identify existing functions/components that can be reused.
5. Provide a short implementation plan before modifying the architecture.

Do not:

- recreate the repository
- migrate the application to another framework
- delete existing production data
- destructively replace existing tables
- remove existing functionality before the replacement has been validated
- expose API credentials to frontend/browser code

---

# 1. Existing Tech Stack — Preserve

Preserve the current project stack:

- **Frontend / Full-stack:** TanStack Start + React
- **Build system:** Vite
- **UI:** Tailwind CSS + existing component system
- **Database / Authentication:** Supabase
- **Repository:** Existing connected GitHub repository
- **Builder:** Existing Lovable project
- **Local development:** Compatible with Git / Cursor workflow

Do not migrate the project to Next.js.

If a Vercel deployment already exists, preserve compatibility, but do not redesign the architecture around Vercel.

---

# 2. Final External Intelligence Architecture

The final system should have only **two external intelligence dependencies**:

## SEO Data Engine

Apify Actor:

```text
pro100chok/ahrefs-seo-tools
```

## AI Reasoning Engine

OpenAI API.

Supabase is responsible for:

- application database
- authentication
- caching SEO data
- placements
- projects
- backlinks
- API/research run logs

Frontend must never call Apify or OpenAI directly.

All external calls must run through server-side functions.

Final mental model:

```text
Supabase Cache
      │
      │ cache miss
      ▼
Apify / Ahrefs All-in-One
      │
      │ structured SEO facts
      ▼
OpenAI
      │
      │ semantic reasoning
      ▼
Keyword / Target Page / Backlink Decision
```

- **Ahrefs/Apify = factual SEO data**
- **OpenAI = reasoning**
- **Supabase = source of application state + cache**
- **Frontend = workflow + user control**

Do not add additional SEO providers unless a required capability is proven unavailable from the primary Ahrefs actor.

---

# 3. Legacy Provider Migration

The existing project may currently contain:

- OpenSEO
- `radeance/ahrefs-scraper`
- `burbn/ahrefs-keyword-explorer`

Do not delete these integrations immediately.

Treat them as **legacy providers** during migration.

Migration strategy:

```text
CURRENT
OpenSEO
radeance/ahrefs-scraper
burbn/ahrefs-keyword-explorer
        │
        ▼
PHASE 1
Add pro100chok/ahrefs-seo-tools
        │
        ▼
PHASE 2
Run parity tests
        │
        ▼
PHASE 3
SEO_PROVIDER=ahrefs_all_in_one
        │
        ▼
PHASE 4
Monitor production behaviour and cost
        │
        ▼
PHASE 5
Deprecate legacy providers after validation
```

Parity tests should cover:

- DR
- Organic Traffic
- Search Volume
- Keyword Difficulty
- SERP Position
- Ranking URL
- Keyword Research
- Backlinks

There must always be a safe rollback path during migration.

---

# 4. Terminology

Use these terms consistently.

## Source Domain

Website where the backlink will be purchased or placed.

Example:

```text
ruangberita.com
```

## Target Domain

Client website receiving the backlink.

Example:

```text
arsjadrasjid.com
```

## Target URL

Specific page on the Target Domain receiving the backlink.

Example:

```text
https://arsjadrasjid.com/ai-generatif-di-dunia/
```

## Keyword / Anchor

Keyword or anchor text recommended for the backlink.

Never mix:

- Source Domain
- Target Domain
- Target URL

---

# 5. SEO Provider Layer

Create one generic SEO provider wrapper.

Recommended structure:

```text
src/lib/seo/
├── ahrefs.provider.ts
├── domain-research.service.ts
├── keyword-research.service.ts
├── rank.service.ts
├── recommendation.service.ts
├── cache.service.ts
└── ai.provider.ts
```

Do not build separate provider integrations for domain API, keyword API, SERP API, or backlink API.

All Ahrefs/Apify functionality must flow through:

```text
ahrefs.provider.ts
```

Conceptual interface:

```ts
runAhrefs({
  searchType,
  urls,
  keyword,
  country,
  additionalOptions,
})
```

The rest of the application must not depend on the raw Apify response format.

Normalize all responses into internal application types.

---

# 6. Ahrefs Feature Mapping

Primary provider:

```text
pro100chok/ahrefs-seo-tools
```

## Domain Research

Use the appropriate Ahrefs search types for:

- Domain Rating / DR
- Organic Traffic
- Backlinks
- Referring Domains
- Top Keywords
- Top Pages
- Domain Overview

Expected search types include:

- `website_authority`
- `traffic_overview`

## Keyword Research

Use the appropriate search types for:

- Keyword Ideas
- Search Volume
- Keyword Difficulty / KD
- CPC
- Traffic Potential

Expected search types include:

- `keyword_ideas`
- `keyword_metrics`
- `keyword_difficulty`

## Rank Research

Use rank-check functionality for:

- Current SERP Position
- Ranking URL
- Ranking page
- Exact keyword/domain matching

Expected search type:

- `keyword_rank`

## SERP Research

Use SERP functionality for:

- top ranking pages
- competitors
- ranking context
- SERP analysis

Expected search type:

- `serp_overview`

## Backlink Research

Use backlink functionality for:

- backlink overview
- backlink list
- referring domains
- anchor distribution
- broken links

Expected search types include:

- `backlinks_overview`
- `backlinks_list`
- `broken_links`

## Advanced Features

The same provider should support future modules such as:

- competitor research
- AI visibility
- sitemap/page discovery
- broken link opportunities
- advanced backlink audit

Expected search types may include:

- `website_details`
- `ai_visibility`
- `sitemap`

Important: one Actor does not mean every SEO metric has to be requested every time.

Only call the search type required for the specific task.

---

# 7. AI Provider

Use OpenAI as the default AI reasoning provider.

Environment:

```text
OPENAI_API_KEY
```

Design the AI layer behind an abstraction so another provider can be added later without rewriting the recommendation workflow.

Example:

```text
AI_PROVIDER=openai
```

AI is responsible only for reasoning tasks such as:

- semantic relevance
- source-domain topical analysis
- content-gap reasoning
- keyword candidate generation
- anchor recommendation
- target-page matching
- recommendation ranking
- recommendation explanation
- backlink diversity reasoning

AI must never invent:

- DR
- Organic Traffic
- Search Volume
- Keyword Difficulty
- CPC
- Traffic Potential
- SERP Position
- Backlink count
- Referring Domains

All numerical SEO metrics must come from the Ahrefs actor or valid cached Ahrefs data.

---

# 8. Existing Data Must Be Preserved

Existing operational tables may include:

- `sudah_dibeli`
- `traffic_nol`
- `domain_sudah_pernah`
- `check_logs`

These are existing/legacy operational records.

Do not:

- drop them
- rename them
- overwrite historical values
- delete existing rows

New architecture must be additive.

Existing `sudah_dibeli` rows should eventually be mapped into the new project/placement architecture through migration utilities.

Do not overwrite existing Keyword or Target Page values during migration.

---

# 9. Projects Table

Create:

```text
projects
```

Fields:

- `id`
- `owner_id`
- `name`
- `main_domain`
- `created_at`
- `updated_at`

`main_domain` represents the client Target Domain.

Example:

```text
Project: Arsjad Rasjid
main_domain: arsjadrasjid.com
```

---

# 10. Placement Orders

Create:

```text
placement_orders
```

Fields:

- `id`
- `project_id`
- `owner_id`
- `source_domain`
- `keyword`
- `target_url`
- `platform`
- `price`
- `status`
- `dr`
- `traffic`
- `search_volume`
- `keyword_difficulty`
- `traffic_potential`
- `current_serp_position`
- `recommendation_score`
- `created_at`
- `updated_at`

`project_id` may be null.

Rows where:

```sql
project_id IS NULL
```

are treated as:

```text
Uncategorized / Drafts
```

Supported statuses:

- Awaiting Payment
- Order Processing
- Content Pending
- User Review
- Live & Verified
- Cancelled

SEO metric fields in `placement_orders` are snapshots.

They represent the metrics used when the placement decision was made.

Do not retroactively rewrite historical placement metrics whenever cache data changes.

---

# 11. Live Backlinks

Create:

```text
backlinks
```

Use this table only for actual/live backlinks.

Fields:

- `id`
- `project_id`
- `placement_order_id`
- `source_domain`
- `target_url`
- `anchor_text`
- `live_url`
- `verified_at`
- `created_at`
- `updated_at`

When placement status becomes:

```text
Live & Verified
```

allow creation/update of the corresponding backlink record.

---

# 12. Global Domain Cache

Create:

```text
global_domain_cache
```

Fields:

- `normalized_domain`
- `dr`
- `traffic`
- `backlinks`
- `referring_domains`
- `top_keywords` JSONB
- `top_pages` JSONB
- `provider`
- `authority_checked_at`
- `traffic_checked_at`
- `created_at`
- `updated_at`

`normalized_domain` must be unique.

Domain normalization:

- lowercase
- remove protocol
- remove `www.`
- remove trailing slash
- remove path
- remove query string

Use separate freshness rules.

Default:

```text
Authority / DR cache: 30 days
Traffic cache:        14 days
```

Before any paid domain research:

1. normalize domain
2. check `global_domain_cache`
3. use fresh cached values when available
4. call Apify only for missing/stale metrics

If cache is valid, do not call Apify.

---

# 13. Keyword Metrics Cache

Create:

```text
keyword_metrics_cache
```

Unique key:

```text
normalized_keyword + country
```

Fields:

- `keyword`
- `normalized_keyword`
- `country`
- `search_volume`
- `keyword_difficulty`
- `cpc`
- `traffic_potential`
- `provider`
- `checked_at`
- `raw_data` JSONB optional
- `created_at`
- `updated_at`

Default freshness:

```text
30 days
```

Country default:

```text
id
```

Reuse keyword metrics across Projects whenever possible.

---

# 14. Keyword Rank Cache

Create:

```text
keyword_rank_cache
```

Unique key:

```text
target_domain + normalized_keyword + country
```

Fields:

- `target_domain`
- `keyword`
- `normalized_keyword`
- `country`
- `position`
- `ranking_url`
- `ranking_title`
- `traffic`
- `dr`
- `ur`
- `provider`
- `checked_at`
- `created_at`
- `updated_at`

Default freshness:

```text
7 days
```

Rank information changes faster than keyword metrics and therefore uses a shorter cache period.

---

# 15. SEO Research Run Log

Create:

```text
seo_research_runs
```

Fields:

- `id`
- `provider`
- `search_type`
- `query`
- `cache_hit`
- `status`
- `result_count`
- `error`
- `duration_ms`
- `created_at`

Use this table to monitor:

- API cost behaviour
- cache effectiveness
- failed requests
- excessive research calls
- provider reliability

Do not store API secrets in this table.

---

# 16. Server-Side Functions

Frontend should interact with a small application-level service interface.

Preferred functions:

```ts
researchDomain()
generateKeywordIdeas()
researchKeyword()
checkKeywordRank()
generateBacklinkSuggestions()
refreshSeoData()
```

Internally these functions may call:

- `ahrefs.provider.ts`
- `cache.service.ts`
- `ai.provider.ts`

Frontend should never understand raw Apify API structures.

---

# 17. Step 1 — Source Domain Input

Purpose: build a Source Domain list.

Support:

- manual single-domain input
- manual bulk input

File import:

- CSV
- XLSX
- TXT
- JSON
- HTML

PDF:

- best-effort extraction only
- always require Data Preview before save

Google Sheet:

- support public accessible Google Sheets where technically possible
- if authentication is required and no connector is available, show a clear unsupported/authentication message

Normalize imported fields.

Detect likely columns:

- domain
- DR
- traffic
- price
- platform
- keyword
- target URL

Show:

```text
DATA PREVIEW
```

Actions:

```text
[Simpan & Lanjut]
[Proses Ulang]
```

Nothing should be permanently inserted before user confirmation.

---

# 18. Step 2 — Source Domain Research

For each Source Domain:

1. Normalize the domain.
2. Check whether it has previously been used in:
   - selected Project
   - another accessible Project
   - legacy existing backlink data
3. Do not automatically block duplicates.
4. Show a warning and allow the user to continue.

Then check `global_domain_cache`.

If cache is valid:

- return cached data

If cache is missing/stale:

- run only the required Ahrefs search types

Minimum output:

- DR
- Organic Traffic

Optional output:

- Backlinks
- Referring Domains
- Top Keywords
- Top Pages

Store refreshed data in `global_domain_cache`.

Display KPI cards:

- DR
- Organic Traffic
- Referring Domains
- Last Checked
- Data Source
- Cache / Fresh status

---

# 19. Step 3 — Keyword & Target Page Recommendation

This must only run when the user explicitly clicks:

```text
[Generate Suggestions]
```

Never automatically call paid APIs when the page loads.

## Phase A — Source Domain Profile

Use Source Domain cache, including:

- DR
- Traffic
- Top Keywords
- Top Pages

If source data does not exist, perform Domain Research first.

## Phase B — Target Domain Profile

Use the selected Project's `main_domain`.

Example:

```text
arsjadrasjid.com
```

Cache Target Domain analysis because the same client domain will be reused for many Source Domains.

Gather useful target context:

- Top Keywords
- Top Pages
- Traffic
- Existing Ranking Pages

## Phase C — AI Candidate Generation

Pass structured Source Domain + Target Domain data into OpenAI.

Ask OpenAI to generate approximately:

```text
8–12 keyword / target-page candidate combinations
```

AI should prioritize semantic relevance.

At this stage AI is not allowed to invent SEO metrics.

## Phase D — SEO Verification

For shortlisted candidates:

1. Check `keyword_metrics_cache`.
2. Fetch missing metrics only.
3. Check `keyword_rank_cache`.
4. Fetch missing rank information only.

Metrics:

- Search Volume
- KD
- CPC
- Traffic Potential
- Current Position
- Ranking URL

Do not research hundreds of candidate keywords unnecessarily.

## Phase E — Final AI Ranking

Send enriched structured candidates to OpenAI.

Include:

- Source Domain context
- Target Domain context
- Keyword
- Target URL
- Search Volume
- KD
- Traffic Potential
- Current Position
- Previous Placements
- Previous Anchor / Target combinations

AI should rank based on:

1. Source-domain topical relevance
2. Target-domain SEO opportunity
3. Existing ranking strength
4. Search Volume
5. Keyword Difficulty
6. Anchor diversity
7. Target-page diversity
8. Existing backlink history

Return:

```text
Top 5 recommendations
```

---

# 20. Recommendation Rules

Avoid repeatedly recommending the same:

```text
Keyword + Target URL
```

across many Source Domains unless there is strong justification.

Existing manual Keyword / Target URL must not be overwritten automatically.

Low-confidence AI recommendations must never overwrite human input.

If no relevant existing page exists, allow recommendation:

```text
Suggested New Page
```

Clearly mark it as a recommendation, not as an existing URL.

---

# 21. Suggestion UI

Display:

- Keyword Suggestion
- Target Page
- Search Volume
- KD
- Traffic Potential
- SERP Position
- Recommendation Score

If actual SERP position is greater than 30:

UI may display:

```text
0
```

but database must store the actual position.

Actions:

```text
[Use Recommendation]
[Regenerate]
[Input Manual]
[Next: Input Placement Data]
```

Regenerate requires explicit user action because it may consume API credits.

---

# 22. Step 4 — Placement Order

Auto-fill selected recommendation:

- Source Domain
- Keyword
- Target URL

Fields:

## Platform

Examples:

- Rajabacklink
- Manual Outreach
- Other

## Price

Numeric / currency formatted.

## Status

- Awaiting Payment
- Order Processing
- Content Pending
- User Review
- Live & Verified
- Cancelled

Store SEO metric snapshots together with the order.

---

# 23. Step 5 — Project Assignment

At the end of Placement Order, show Recent Projects.

Query latest 3–5 Projects.

Display pills such as:

```text
[Arsjad Rasjid]
[Client B]
[Client C]
```

Clicking one assigns `project_id`.

Also provide:

```text
[+ Buat Proyek Baru]
```

Required fields:

- Project Name
- Main / Target Domain

Also provide:

```text
[Simpan ke Draft]
```

Draft means:

```sql
project_id IS NULL
```

---

# 24. Dashboard

Main navigation:

- Projects
- Uncategorized / Drafts
- Legacy Data / Existing Domain History

## Projects

Each Project card shows:

- Project Name
- Main Domain
- Placement Count
- Active Orders
- Live Backlinks
- Total Spend

Opening a Project displays:

- Placement Orders
- Live Backlinks
- SEO history

## Drafts

Query:

```sql
project_id IS NULL
```

Search:

```text
Cari domain atau keyword...
```

Actions:

```text
[Continue]
[Pindahkan ke Proyek]
[Delete]
```

Moving a Draft to a Project must only update `project_id`.

Do not recreate the record.

---

# 25. Stepper UX

Persistent 5-step workflow:

1. Source Domain
2. Metrics
3. Suggestions
4. Placement
5. Project / Save

Allow backwards navigation.

Do not lose entered data.

Do not automatically repeat API calls when navigating backwards.

---

# 26. Keyword Research Module

Create a standalone Keyword Research feature.

Input:

```text
Seed Keyword
```

Example:

```text
electric vehicle indonesia
```

Flow:

```text
Seed Keyword
    ↓
Ahrefs Keyword Ideas
    ↓
Preliminary Candidates
    ↓
Filtering
    ↓
Shortlist
    ↓
keyword_metrics only for shortlisted keywords
```

Do not request full metrics for every raw keyword suggestion.

Display:

- Keyword
- Search Volume
- KD
- Traffic Potential
- CPC

Allow selected keyword to be passed into:

- Backlink Recommendation
- Placement workflow

---

# 27. Domain Research Module

Create a standalone Domain Research feature.

Input:

- one domain
- multiple domains

Flow:

```text
Normalize Domains
      ↓
Cache Check
      ↓
Research missing/stale only
```

Display:

- Domain
- DR
- Organic Traffic
- Backlinks
- Referring Domains
- Top Keywords
- Top Pages
- Last Checked

Support bulk input.

Use cache aggressively.

---

# 28. Cost Control

Before running bulk external operations display:

- Number of Source Domains
- Number already cached
- Number requiring fresh research
- Number of candidate keywords
- Number of cached keyword metrics
- Number requiring Ahrefs metrics
- Number requiring rank checks
- Estimated external SEO calls
- Estimated AI calls

Example:

```text
Source Domain:          ruangberita.com
Target:                 arsjadrasjid.com
Domain Cache:           Available
Target Cache:           Available
Candidate Keywords:     8
Cached Metrics:         5
New Keyword Metrics:    3
New Rank Checks:        4
Estimated:              7 SEO lookups / 1–2 AI calls
```

Do not hide paid API execution from the user.

---

# 29. API Cost Protection Rules

Always:

- use cache first
- deduplicate domains
- deduplicate keywords
- reuse Target Domain research
- batch requests where supported
- limit candidate count
- only enrich shortlisted candidates
- retry transient failures with a strict retry limit

Never indefinitely retry:

- authentication errors
- insufficient-credit errors
- invalid inputs

Partial failures must preserve successful results.

---

# 30. Security

All external provider calls must be server-side.

Secrets:

```text
APIFY_API_KEY
OPENAI_API_KEY
```

Legacy during migration only:

```text
OPENSEO_API_KEY
```

Never expose any of them to browser code.

Never expose Supabase service-role credentials.

Implement proper Supabase RLS.

Project-specific data must respect ownership/access.

Do not use permissive policies solely to fix frontend errors.

Inspect existing policies before changing them.

---

# 31. Implementation Phases

## Phase 1 — Foundation

- inspect current repo
- add final Ahrefs All-in-One provider
- add cache architecture
- add research run logging
- keep legacy provider untouched

## Phase 2 — Parity Test

Compare legacy providers with Ahrefs All-in-One for:

- DR
- Traffic
- Search Volume
- KD
- Rank
- Ranking URL
- Backlinks

## Phase 3 — Project Management

Add:

- `projects`
- `placement_orders`
- `backlinks`
- Draft / Uncategorized workflow

## Phase 4 — Domain & Keyword Research

Build:

- Domain Research
- Keyword Research
- cache orchestration

## Phase 5 — Backlink Recommendation

Build final pipeline:

```text
Source Profile
      ↓
Target Profile
      ↓
AI Candidate Generation
      ↓
SEO Verification
      ↓
Final AI Ranking
```

## Phase 6 — Migration

Map existing `sudah_dibeli` records into the new architecture where appropriate.

Preserve all original records.

## Phase 7 — Switch Provider

Only after successful validation:

```text
SEO_PROVIDER=ahrefs_all_in_one
```

## Phase 8 — Legacy Deprecation

Only when production behaviour is confirmed stable:

- remove unused OpenSEO logic
- remove old Actor logic
- remove obsolete provider configuration

---

# 32. Verification

Before declaring implementation complete, run build / TypeScript checks.

Verify:

- existing domain workflow still works
- existing data still exists
- authentication still works
- RLS is correct
- one Domain Research works
- one Keyword Research works
- one backlink recommendation works
- one Draft workflow works
- one Project assignment works
- one Placement Order works
- one Live & Verified backlink works
- cache prevents duplicate research
- no API keys appear client-side

---

# 33. Final Delivery Summary

After implementation provide:

- Files changed
- Migrations created
- New tables
- New routes/components
- New server functions
- Cache strategy
- Ahrefs search types integrated
- OpenAI usage
- Legacy integrations still active
- Legacy integrations deprecated
- Manual configuration required
- Known limitations

---

# 34. Lovable Execution Rules

This architecture file is the source of truth for implementation direction.

For future Lovable prompts, prefer:

```text
Follow docs/SEO_ARCHITECTURE.md and Project Knowledge.
Implement PHASE X ONLY.
```

Do not paste this entire architecture into every Lovable prompt.

Lovable should:

- inspect only files relevant to the current phase and their direct dependencies
- avoid scanning/refactoring unrelated parts of the repository
- reuse existing components/functions before creating replacements
- modify only files required for the current task
- stop after the requested phase

Recommended stop condition for every implementation prompt:

```text
STOP CONDITION:
Do not continue to the next phase.
Do not add features not explicitly requested.
Do not redesign unrelated pages.
After build verification, stop and report the result.
```

Do not repeatedly ask Lovable to re-plan architecture that is already defined here.

---

# Final Design Principle

The system should ultimately operate with this mental model:

```text
SUPABASE
Database + Cache
      │
      │ cache miss
      ▼
APIFY
pro100chok/ahrefs-seo-tools
      │
      │ structured SEO facts
      ▼
OPENAI
Semantic reasoning + recommendation
      │
      ▼
Backlink / Keyword / Target Page Decision
```

The goal is not to maximize integrations.

The goal is to minimize integrations while supporting:

- Domain Research
- Keyword Research
- SERP Research
- Backlink Research
- Backlink Recommendation
- Placement Management
- Project Management
- SEO Outreach Workflow
