# SEO Operating System — Final Architecture

> Evolution of: SEO DA & Traffic Finder / Backlink Manager
> Status: Architectural source of truth
> Product requirements: `docs/PRD.md`
> User workflow: `docs/USER_STORY_PLAYBOOK.md`
> Product knowledge: `docs/KNOWLEDGE_BASE.md`
> UI/UX: `docs/UI_UX_SPEC.md`

---

# Primary Objective

Extend the existing production application into an internal **SEO Operating System** that supports the full SEO Specialist lifecycle while preserving the existing backlink/domain/keyword foundation.

Target product flow:

```text
Project / Prospect
      ↓
Discovery + Evidence
      ↓
AI Client Intelligence
      ↓
Comprehensive Site Audit
      ↓
Competitive Analysis
      ↓
Keyword & SERP Research
      ↓
SEO Plan
      ↓
Proposal + Manual Budget
      ↓
Active Delivery Plan
      ↓
Tasks + Backlink Execution
      ↓
Monitoring
      ↓
Reporting + Continuous Optimization
```

This is **not a greenfield rebuild**.

Before every implementation phase:

1. inspect the relevant current GitHub code;
2. inspect the current Supabase schema, data, RLS, and migrations;
3. inspect current Lovable-managed configuration;
4. reuse current routes/components/services where appropriate;
5. make additive changes only;
6. preserve production data and rollback ability;
7. verify build + relevant production behavior before declaring completion.

Do not:

- recreate the repository;
- migrate to another framework;
- move hosting away from Lovable unless explicitly requested;
- delete existing production records;
- drop/rename production tables destructively;
- weaken security to make UI work;
- expose privileged credentials in browser code;
- remove a legacy provider before replacement parity is validated;
- redesign unrelated product areas while implementing one wave.

---

# 1. Existing Tech Stack — Preserve

Preserve:

- **Frontend / full-stack:** TanStack Start + React;
- **Build:** Vite;
- **UI:** Tailwind CSS + existing component system;
- **Database/Auth:** Lovable Cloud managed Supabase;
- **Hosting:** Lovable Cloud;
- **Repository:** existing connected GitHub repository;
- **Custom domain:** existing production custom domain;
- **Auth flow:** existing managed Supabase authentication;
- **Git history:** existing published history.

Do not migrate to Next.js or another framework as part of this expansion.

---

# 2. Product Architecture Mental Model

The system consists of six logical layers.

```text
┌──────────────────────────────────────────────────────┐
│ 1. PROJECT / WORKFLOW LAYER                          │
│ Client context, lifecycle, plan, tasks, reports      │
├──────────────────────────────────────────────────────┤
│ 2. SOURCE / EVIDENCE LAYER                           │
│ Connections, uploads, links, manual input, crawl     │
├──────────────────────────────────────────────────────┤
│ 3. NORMALIZATION LAYER                               │
│ Extraction, mapping, validation, normalized types    │
├──────────────────────────────────────────────────────┤
│ 4. FACTUAL INTELLIGENCE LAYER                        │
│ SEO metrics, SERP, audit facts, analytics, ads       │
├──────────────────────────────────────────────────────┤
│ 5. AI REASONING LAYER                                │
│ Analysis, recommendation, drafting, explanation      │
├──────────────────────────────────────────────────────┤
│ 6. HUMAN DECISION / EXECUTION LAYER                  │
│ Final plan, budget, Buy/Skip, tasks, report edits    │
└──────────────────────────────────────────────────────┘
```

Core rule:

```text
FACTS → AI REASONING → HUMAN DECISION
```

AI never becomes the source of factual SEO/analytics metrics.

---

# 3. Project Model

Product rule:

```text
1 Project = 1 Client = 1 primary Website
```

A Project exists from prospect stage and survives conversion to Active.

Do not create a separate Client object for MVP unless future requirements explicitly change this rule.

Recommended lifecycle:

- Prospect;
- Assessment;
- Proposal;
- Active;
- Lost;
- Archived.

Everything important must be linkable to `project_id`.

---

# 4. Existing Production Tables — Preserve

Current production includes legacy/operational data such as:

- `sudah_dibeli`;
- `traffic_nol`;
- `domain_sudah_pernah`;
- `check_logs`;
- `search_history`.

Current additive SEO/backlink foundation includes:

- `projects`;
- `placement_orders`;
- `backlinks`;
- `global_domain_cache`;
- `keyword_metrics_cache`;
- `keyword_rank_cache`;
- `seo_research_runs`.

These tables must not be destructively replaced.

At the current baseline, historical legacy records and SEO cache/research logs contain real production data. Preserve them.

Existing `projects`, `placement_orders`, and `backlinks` remain the base for broader Project/off-page architecture rather than being recreated under new names.

---

# 5. Shared Internal Access Architecture

Target product requirement:

> All authorized internal SEO users can see all Projects and shared operational data.

Current production uses ownership-oriented `user_id = auth.uid()` RLS for several operational tables.

Do not solve the new requirement by disabling RLS or creating unrestricted authenticated policies.

## Recommended safe model

Add workspace/team authorization:

```text
app_workspaces
app_workspace_members
```

Suggested fields:

### `app_workspaces`

- `id`;
- `name`;
- `created_at`;
- `updated_at`.

### `app_workspace_members`

- `workspace_id`;
- `user_id`;
- `role`;
- `status`;
- `created_at`.

For MVP, role can remain simple because all authorized internal members have broad visibility.

Add nullable/additive `workspace_id` to new Project-scoped tables and, where appropriate, existing shared operational tables.

Existing `user_id` should remain available as creator/owner/audit metadata rather than being removed.

RLS should authorize based on active workspace membership.

Any backfill of existing rows into a workspace requires explicit migration verification and must preserve original `user_id`.

---

# 6. External Data & Intelligence Architecture

The goal is not to maximize integrations. The goal is to use the minimum reliable source for each factual need while still supporting the broader SEO workflow.

## 6.1 Primary SEO metric engine

Primary provider remains:

```text
Apify Actor: pro100chok/ahrefs-seo-tools
```

Use for supported factual SEO metrics such as:

- DR / authority;
- Organic Traffic;
- backlinks;
- referring domains;
- keyword ideas;
- keyword metrics;
- keyword difficulty;
- CPC;
- Traffic Potential;
- keyword rank;
- SERP overview;
- top keywords/pages;
- backlink overview/list;
- broken links where supported.

The application must not depend on raw Actor response shapes outside the provider normalization layer.

## 6.2 Site Audit / crawl sources

Comprehensive on-page/technical audit needs page-level crawl/check data that may not be fully covered by the primary Ahrefs actor.

Allowed source strategy:

1. reuse existing OpenSEO capability where it provides required checks;
2. use public website crawl/data collection through supported server-side tooling;
3. use Apify actors/capabilities where suitable;
4. use connected Search Console/Analytics/CMS data for enrichment;
5. do not deprecate OpenSEO until required Site Audit parity exists elsewhere.

OpenSEO is therefore **legacy but still operationally permitted** for audit coverage during migration.

## 6.3 Connected sources

Connected systems are factual data sources, not generative reasoning providers.

Target sources may include:

- Google Search Console;
- Google Analytics / GA4;
- Google Ads;
- Shopify;
- WooCommerce;
- WordPress/CMS;
- supported ecommerce/conversion systems;
- supported paid-media sources.

Use Lovable-supported connectors when technically appropriate.

Do not claim a connector is implemented merely because it exists in the Lovable catalog. Each integration must have its own implementation/authorization/verification phase.

## 6.4 Manual sources

Manual data is always supported as fallback/primary input where relevant:

- form;
- paste;
- CSV/XLSX;
- JSON/TXT;
- PDF/DOCX;
- screenshot/image;
- URL/link;
- other supported media.

---

# 7. AI Architecture

## 7.1 Provider abstraction

All new AI workflows must go through an application-level AI abstraction.

Conceptual interface:

```ts
analyzeProjectContext();
analyzeAudit();
analyzeCompetitors();
prioritizeKeywords();
recommendTargetPages();
analyzeBacklinkPlan();
generateProposalSection();
generateReport();
runProjectPrompt();
```

UI must not import provider-specific SDKs or keys.

## 7.2 Target provider strategy

For new general reasoning/document-analysis workflows, prefer **Lovable managed AI / AI Gateway** where supported and economically appropriate.

Target motivation:

- reduce separate AI integration overhead;
- reuse Lovable-managed capability;
- support document/analysis/drafting workflows.

Do not assume unlimited free usage. Actual model support, quotas, and billing behavior must be validated during implementation.

## 7.3 Existing OpenAI compatibility

Current code includes server-side OpenAI reasoning for backlink recommendation.

Do not remove it immediately.

Treat it as an existing provider behind the abstraction until:

1. the managed AI path is implemented;
2. structured output parity is tested;
3. backlink recommendation quality is validated;
4. rollback is available.

## 7.4 AI factual integrity

Generative AI must never invent:

- DR;
- Organic Traffic;
- Search Volume;
- KD;
- CPC;
- Traffic Potential;
- SERP Position;
- backlinks/referring domains;
- analytics values;
- ads values;
- ecommerce/conversion values.

AI receives factual structured data and produces reasoning.

## 7.5 Human control

AI output is suggestion/draft unless explicitly committed by user action.

AI must not silently overwrite:

- Project confirmed fields;
- manual Keyword;
- manual Target URL;
- final budget;
- final backlink quantity;
- final backlink strategy;
- contractual guarantees;
- human-authored proposal/report content.

---

# 8. SEO Provider Layer — Preserve and Extend

Existing normalized provider architecture remains valid.

Recommended structure:

```text
src/lib/seo/
├── ahrefs.provider.ts
├── cache.service.ts
├── domain-research.*
├── keyword-research.*
├── rank.service.ts            # when introduced
├── recommendation.*
├── audit/                     # additive
│   ├── audit.types.ts
│   ├── audit.service.ts
│   ├── audit-normalizer.ts
│   └── providers/
├── competitor/                # additive
├── project-intelligence/      # additive
└── ai/
    ├── ai.provider.ts
    ├── lovable-ai.provider.ts
    └── openai.provider.ts     # existing/compatibility
```

Do not force exact filenames if the current repository structure already has equivalent modules; reuse before reorganizing.

---

# 9. Ahrefs Feature Mapping — Preserve

Primary Actor:

```text
pro100chok/ahrefs-seo-tools
```

Expected supported search types may include:

### Domain

- `website_authority`;
- `traffic_overview`;
- `website_details` where needed.

### Keyword

- `keyword_ideas`;
- `keyword_metrics`;
- `keyword_difficulty`.

### Rank

- `keyword_rank`.

### SERP

- `serp_overview`.

### Backlinks

- `backlinks_overview`;
- `backlinks_list`;
- `broken_links`.

### Other supported capability

- `sitemap`;
- `ai_visibility` if later relevant.

Do not request every search type on every workflow.

Only request the factual data needed for the current action.

---

# 10. Cache Architecture — Preserve

## `global_domain_cache`

Purpose:

- reuse normalized domain metrics across Projects;
- prevent unnecessary paid research.

Normalization:

- lowercase;
- remove protocol;
- remove `www.`;
- remove path/query for domain identity;
- remove trailing slash.

Default freshness:

```text
DR / Authority: 30 days
Organic Traffic: 14 days
```

## `keyword_metrics_cache`

Key should include:

```text
normalized_keyword + country + language
```

Default freshness:

```text
30 days
```

## `keyword_rank_cache`

Key should include:

```text
target_domain + normalized_keyword + country + language
```

Default freshness:

```text
7 days
```

## `seo_research_runs`

Use for:

- provider;
- search type;
- query;
- cache hit;
- status;
- result count;
- error;
- duration;
- cost/reliability analysis where possible.

Do not store secrets.

---

# 11. Universal Evidence & Import Architecture

Manual input must use shared/reusable infrastructure instead of custom parsing in every module.

## Recommended tables

### `project_evidence`

Suggested fields:

- `id`;
- `workspace_id`;
- `project_id`;
- `created_by`;
- `source_type`;
- `title`;
- `original_filename`;
- `mime_type`;
- `storage_path` / managed file reference;
- `source_url`;
- `raw_text` where extraction is available;
- `extracted_metadata` JSONB;
- `processing_status`;
- `created_at`;
- `updated_at`.

Do not store credentials in evidence records.

### `data_imports`

Suggested fields:

- `id`;
- `workspace_id`;
- `project_id` nullable where global import is valid;
- `module`;
- `source_type`;
- `original_filename`;
- `mapping` JSONB;
- `normalization_summary` JSONB;
- `status`;
- `created_by`;
- `created_at`.

Optional raw row staging can use:

- JSONB attached to import for small imports; or
- additive `data_import_rows` for larger/retryable imports.

## Canonical import pipeline

```text
Input
  ↓
Extract / Parse
  ↓
Detect Fields
  ↓
Normalize
  ↓
Validate
  ↓
Preview
  ↓
Confirm
  ↓
Commit to target tables
```

No uncertain field mapping should bypass Preview.

## Provenance

Normalized data should identify its source when practical:

- Manual Entry;
- Manual Upload;
- Connected Source;
- API;
- Public Crawl;
- AI Extracted;
- Legacy Import.

---

# 12. Project Data Model Expansion

Existing `projects` table must be extended additively.

Current production fields should remain.

Potential additive fields:

- `workspace_id`;
- `lifecycle_status` or controlled use of existing `status`;
- `industry`;
- `objectives` JSONB;
- `target_market`;
- `current_problem`;
- `contact_person`;
- `budget_indication`;
- `known_competitors` JSONB;
- `discovery_notes`;
- `activated_at`.

Do not require every field.

If schema flexibility is preferred, optional profile fields may be separated into a `project_profile` table, but do not create parallel sources of truth without reason.

---

# 13. Project Connections

Recommended table:

```text
project_connections
```

Suggested fields:

- `id`;
- `workspace_id`;
- `project_id`;
- `provider`;
- `connection_type`;
- `status`;
- `external_account_ref` / property reference;
- `last_synced_at`;
- `last_error`;
- `metadata` JSONB;
- `created_at`;
- `updated_at`.

Do not store OAuth secrets/access tokens directly unless required by the supported connector architecture and stored in an approved server-side secret mechanism.

The table is a registry/status layer, not a credential vault.

---

# 14. AI Client Intelligence

Recommended tables:

### `project_intelligence_runs`

- `id`;
- `workspace_id`;
- `project_id`;
- `prompt` nullable;
- `analysis_type`;
- `input_refs` JSONB;
- `output` JSONB;
- `provider`;
- `status`;
- `created_by`;
- `created_at`.

### Optional `project_field_suggestions`

Use if field-level Accept/Edit/Ignore requires persistent review state.

Suggested fields:

- `project_id`;
- `field_name`;
- `suggested_value` JSONB;
- `evidence_refs` JSONB;
- `confidence`;
- `review_status`;
- `created_at`.

Do not mutate Project fields until user accepts.

---

# 15. Site Audit Architecture

## 15.1 Audit run

Recommended table:

```text
site_audits
```

Suggested fields:

- `id`;
- `workspace_id`;
- `project_id`;
- `domain`;
- `status`;
- `started_at`;
- `completed_at`;
- `health_score` nullable;
- `source_coverage` JSONB;
- `summary` JSONB;
- `created_by`;
- `created_at`.

## 15.2 Audit findings

Recommended table:

```text
audit_findings
```

Suggested fields:

- `id`;
- `workspace_id`;
- `project_id`;
- `audit_id`;
- `issue_type`;
- `category`;
- `severity`;
- `status`;
- `url` nullable;
- `affected_urls` JSONB nullable;
- `details` JSONB;
- `evidence` JSONB;
- `how_to_fix`;
- `ai_analysis` JSONB nullable;
- `task_id` nullable;
- `created_at`;
- `updated_at`.

Supported user-facing states include:

- Passed;
- Urgent;
- Issue;
- Warning;
- Not Found;
- Unable to Verify.

Do not overwrite factual raw audit output with AI reasoning.

Keep provider/raw evidence available separately where useful.

## 15.3 Audit behavior

No normal scope selector.

A user-triggered comprehensive audit runs all supported checks.

Paid/expensive external calls still require cost-aware orchestration and should not repeat automatically when reopening pages.

---

# 16. Competitive Analysis Architecture

Recommended tables:

### `project_competitors`

- `id`;
- `workspace_id`;
- `project_id`;
- `domain`;
- `normalized_domain`;
- `source`;
- `competitor_type` (`organic`, `paid`, `both`);
- `is_primary`;
- `is_ignored`;
- `created_at`;
- `updated_at`.

### `competitor_snapshots`

Optional normalized snapshot table for time-based analysis.

Can store:

- authority;
- traffic;
- shared keywords;
- paid keywords;
- backlinks/referring domains;
- top pages;
- raw/normalized context;
- checked_at.

Reuse `global_domain_cache` for global reusable domain facts rather than duplicating common domain metrics unnecessarily.

---

# 17. Keyword & SERP Architecture

Existing keyword cache remains global/reusable.

Add Project-specific decision/opportunity layer rather than duplicating all provider metrics.

Recommended table:

```text
keyword_opportunities
```

Suggested fields:

- `id`;
- `workspace_id`;
- `project_id`;
- `keyword`;
- `normalized_keyword`;
- `country`;
- `language`;
- `intent`;
- `opportunity_type`;
- `target_url`;
- `target_page_action` (`optimize_existing`, `create_new`, `manual`);
- `opportunity_score`;
- `reasoning` JSONB;
- `status`;
- `created_at`;
- `updated_at`.

Factual metrics should primarily be read from cache/provider snapshots instead of being treated as AI-generated values.

When a historical decision requires immutable metrics, store a snapshot with the decision record.

---

# 18. SEO Plan Architecture

Recommended table:

```text
seo_plan_items
```

Suggested fields:

- `id`;
- `workspace_id`;
- `project_id`;
- `category`;
- `title`;
- `description`;
- `priority`;
- `source_type`;
- `source_id`;
- `keyword`;
- `target_url`;
- `expected_impact`;
- `recommendation`;
- `status`;
- `created_by`;
- `created_at`;
- `updated_at`.

Source can be:

- Audit;
- Competitor;
- Keyword;
- Backlink;
- Manual;
- AI Recommendation.

Preserve source traceability.

---

# 19. Proposal Architecture

Recommended tables:

### `proposals`

- `id`;
- `workspace_id`;
- `project_id`;
- `title`;
- `status`;
- `currency`;
- `budget_total` nullable;
- `version`;
- `created_by`;
- `created_at`;
- `updated_at`.

### `proposal_sections`

- `id`;
- `proposal_id`;
- `section_type`;
- `title`;
- `position`;
- `content` JSONB / structured rich content;
- `source_refs` JSONB;
- `ai_generated`;
- `created_at`;
- `updated_at`.

Budget values are user-controlled.

AI-generated sections must not become contractual truth without user review.

Proposal builder must allow modular add/remove/reorder/edit.

---

# 20. Delivery Plan Architecture

Recommended tables:

### `delivery_plans`

- `id`;
- `workspace_id`;
- `project_id`;
- `proposal_id` nullable;
- `status`;
- `start_date`;
- `end_date`;
- `created_at`;
- `updated_at`.

### `delivery_plan_items`

- `id`;
- `delivery_plan_id`;
- `workstream`;
- `title`;
- `period_label` / month/phase;
- `quantity` nullable;
- `unit` nullable;
- `priority`;
- `source_refs` JSONB;
- `status`;
- `created_at`;
- `updated_at`.

Do not force quantity-based deliverables into hundreds of individual tasks until necessary.

---

# 21. Task Architecture

Recommended table:

```text
tasks
```

Suggested fields:

- `id`;
- `workspace_id`;
- `project_id`;
- `delivery_plan_item_id` nullable;
- `title`;
- `description`;
- `category`;
- `priority`;
- `status`;
- `assigned_to` nullable;
- `due_date` nullable;
- `related_url` nullable;
- `related_keyword` nullable;
- `source_type`;
- `source_id` nullable;
- `ai_recommendation` JSONB nullable;
- `before_evidence` JSONB nullable;
- `after_evidence` JSONB nullable;
- `result` JSONB nullable;
- `created_by`;
- `created_at`;
- `updated_at`.

Core workflow:

```text
To Do → In Progress → Done
```

Optional:

- Blocked;
- Cancelled.

No mandatory approval states.

---

# 22. Backlink Architecture — Preserve and Expand

The existing backlink architecture remains core.

## 22.1 Terminology

### Source Domain

Website where backlink is purchased/placed.

### Target Domain

Project/client website receiving backlink.

### Target URL

Specific client page receiving backlink.

### Live URL

Actual published source page containing the backlink.

Never mix these concepts.

## 22.2 `placement_orders`

Continue using for planned/purchased placement workflow.

Existing fields remain.

Potential additive fields as needed:

- `workspace_id`;
- `vendor` / platform normalization;
- `purchase_date` / ordered timestamp alignment;
- `live_url` only if not represented through backlink record;
- metric snapshot fields required by final decision;
- recommendation metadata;
- lifecycle timestamps.

Do not retroactively rewrite metric snapshots when cache changes.

## 22.3 `backlinks`

Continue using for actual/live backlink records.

Potential additive fields:

- `workspace_id`;
- `vendor`;
- `price_snapshot` where appropriate;
- `verified_at`;
- `monitoring_status`;
- `last_checked_at`;
- `last_error`;
- `monitoring_details` JSONB.

## 22.4 Planning

Recommended table:

```text
backlink_plans
```

Suggested fields:

- `id`;
- `workspace_id`;
- `project_id`;
- `period`;
- `kpi_context` JSONB;
- `ai_recommendation` JSONB nullable;
- `final_strategy` JSONB;
- `final_quantity`;
- `created_by`;
- `created_at`;
- `updated_at`.

AI recommendation and human-final strategy must remain distinguishable.

---

# 23. Backlink Source Research Workflow — Preserve Core Rules

Canonical flow:

```text
Manual/API Source Input
      ↓
Normalize Source Domain
      ↓
Historical Check
      ↓
Cache Check
      ↓
Research Missing/Stale Facts
      ↓
Optional AI Recommendation
      ↓
Human Buy / Skip / Save Decision
      ↓
Placement Order
      ↓
Live Backlink
      ↓
Monitoring
```

Historical duplicate does **not** automatically block purchase.

Check same Project, accessible other Project/history, and legacy existing backlink data.

User always retains decision control.

---

# 24. Backlink Keyword / Target Recommendation — Preserve Cost-Aware Pipeline

Existing pipeline remains valid:

```text
Source Domain Profile
      ↓
Target Domain Profile
      ↓
AI Candidate Generation
      ↓
SEO Verification
      ↓
Final AI Ranking
      ↓
Human Selection / Manual Override
```

Rules:

- never run paid calls automatically on page load;
- reuse Target Domain data;
- shortlist before enriching all metrics;
- cache keyword metrics/rank;
- avoid repetitive Keyword + Target URL recommendations without justification;
- do not overwrite manual Keyword/Target URL;
- allow `Suggested New Page` when no appropriate existing page exists;
- preserve actual rank in database even if UI simplifies display.

Existing direct OpenAI implementation can continue until migrated behind AI abstraction.

---

# 25. Backlink Lifecycle

Target user-facing lifecycle:

```text
Planned
→ Purchased / Ordered
→ Content / Processing
→ Live
→ Verified
```

Exception states:

- Cancelled;
- Failed.

Existing statuses may be migrated/normalized additively. Do not destroy historical status values without a safe mapping plan.

Monitoring target states:

- Live;
- Missing;
- Redirected;
- Nofollow Changed;
- Target Changed;
- Error;
- Unable to Verify.

---

# 26. Reporting Architecture

Recommended tables:

### `reports`

- `id`;
- `workspace_id`;
- `project_id`;
- `report_type`;
- `period_start`;
- `period_end`;
- `status`;
- `prompt` nullable;
- `source_refs` JSONB;
- `version`;
- `created_by`;
- `created_at`;
- `updated_at`.

### `report_sections`

- `id`;
- `report_id`;
- `section_type`;
- `title`;
- `position`;
- `content` JSONB;
- `source_refs` JSONB;
- `ai_generated`;
- `created_at`;
- `updated_at`.

Optional normalized metric snapshots can be stored when comparison/history requires immutable values.

Reporting sources may be connected or manual evidence.

AI must state when evidence is unavailable rather than fabricate data.

---

# 27. Data Provenance & Traceability

Important decisions/findings should be traceable through:

```text
SOURCE / EVIDENCE
      ↓
NORMALIZED FACT
      ↓
AI ANALYSIS
      ↓
HUMAN DECISION
      ↓
TASK / PLAN / PROPOSAL / REPORT
```

Where practical, records should include:

- `source_type`;
- `source_id` / refs;
- `provider`;
- `checked_at` / source date;
- `created_by`;
- AI provider/model metadata for AI outputs;
- human review/commit status.

Do not overwrite raw source with AI-generated interpretation.

---

# 28. File Storage

Use Lovable Cloud managed Supabase Storage or the supported managed file mechanism for uploaded Project evidence.

Rules:

- use private storage for internal files by default;
- authorize access through authenticated internal workspace membership;
- store file metadata in database;
- do not store large binary file content directly in ordinary database text fields;
- retain original evidence where permitted;
- extracted text may be stored separately for AI/search processing;
- design extraction so failure does not delete the uploaded file record.

---

# 29. Public Crawl Architecture

Public website collection must be server-side.

Canonical approach:

```text
Project Website
      ↓
Discover sitemap / URLs
      ↓
Crawl with bounded limits
      ↓
Normalize page result
      ↓
Run deterministic checks
      ↓
Store audit findings
      ↓
AI analyzes findings
```

Use strict limits:

- page count;
- timeout;
- concurrency;
- retries;
- allowed host/domain;
- response size.

Respect technically appropriate crawl safety and avoid uncontrolled recursive crawling.

---

# 30. Deterministic Audit vs AI Audit

Audit must separate two steps.

## Deterministic factual checks

Examples:

- title exists/length;
- meta description exists/length;
- H1 count;
- canonical value;
- noindex;
- robots/sitemap availability;
- broken/response status where known;
- image alt presence;
- structured-data presence;
- response time facts.

## AI reasoning

Examples:

- how important is the issue in this Project context?;
- what business/SEO impact may it have?;
- what fix is recommended?;
- what meta description/title draft fits the page/keyword?;
- which findings should be grouped or prioritized?

AI must never change the factual check result itself.

---

# 31. Cost Control

Always:

- cache first;
- normalize before lookup;
- deduplicate domains;
- deduplicate keywords;
- reuse Project/Target Domain research;
- batch requests where supported;
- enrich shortlisted candidates only;
- avoid automatic API calls on navigation/back button;
- require explicit user action for expensive refresh/regenerate;
- use strict retry limits;
- preserve partial success.

Before bulk external research, show useful estimates where practical:

- total inputs;
- cached inputs;
- fresh calls required;
- candidate count;
- AI calls expected.

Never indefinitely retry:

- authentication failure;
- insufficient credit/quota;
- invalid input;
- permanent provider errors.

---

# 32. Security

All privileged external calls must be server-side.

Secrets may include:

```text
APIFY_API_KEY / APIFY_TOKEN
OPENAI_API_KEY        # existing/compatibility
OPENSEO_API_KEY       # legacy/audit during migration
other connector credentials handled by supported managed integration
```

Never expose:

- Supabase service-role key;
- provider secret keys;
- OAuth refresh/access tokens in browser source;
- privileged backend credentials.

Use RLS as primary database protection for browser-accessible data.

Do not use service role in browser code.

Do not create permissive policies solely to silence RLS errors.

---

# 33. Lovable-Generated Files

Do not manually modify Lovable/Supabase auto-generated integration files unless Lovable explicitly regenerates them as part of the managed integration.

This includes generated files under areas such as:

```text
src/integrations/supabase/
src/integrations/lovable/
```

Prefer supported Lovable managed runtime/build configuration.

Do not hardcode secrets or backend URLs into UI source.

---

# 34. UI Architecture

Follow:

```text
docs/UI_UX_SPEC.md
```

Product UI is Project-centered.

Target global navigation:

- Dashboard;
- Projects;
- Site Audit;
- Competitors;
- Keywords & SERP;
- SEO Plan;
- Tasks;
- Backlinks;
- Proposal;
- Reporting;
- Data Sources;
- Files & Evidence;
- Settings.

Do not implement the entire sidebar/navigation before the corresponding wave requires it if it would create dead/non-functional routes. Progressive navigation is acceptable.

Reuse existing components and routes when possible.

---

# 35. Implementation Waves

The new roadmap supersedes the old backlink-only implementation phase numbering for future SEO Operating System work.

Detailed scope:

```text
docs/IMPLEMENTATION_ROADMAP.md
```

High-level waves:

## Wave 0 — Architecture & Security Foundation

- team/workspace access model;
- shared RLS design;
- AI provider abstraction;
- evidence/import foundation decisions;
- no broad feature build.

## Wave 1 — Project Workspace Foundation

- Project lifecycle/profile;
- Project Overview;
- Data Sources registry;
- Files & Evidence;
- import/normalization foundation;
- AI Client Intelligence foundation.

## Wave 2 — Comprehensive Site Audit

- crawl/audit sources;
- deterministic checks;
- findings;
- AI Audit Analyst;
- Audit → Task.

## Wave 3 — Competitive + Keyword/SERP

- competitor discovery/manual management;
- gaps;
- Project-aware keyword opportunity;
- Target Page mapping.

## Wave 4 — SEO Plan + Proposal

- plan items;
- modular proposal builder;
- manual budget;
- Project activation.

## Wave 5 — Delivery + Tasks

- Delivery Plan;
- simple Tasks;
- source traceability.

## Wave 6 — Backlink Integration & Expansion

- integrate existing backlink workflows into Project UX;
- planning;
- source normalization/import;
- Buy/Skip;
- lifecycle;
- monitoring.

## Wave 7 — Monitoring & Reporting

- hybrid data sources;
- periodic report builder;
- AI reporting;
- historical comparison;
- export/share where supported.

Do not continue automatically to the next wave.

---

# 36. Existing Backlink Foundation Compatibility

Previously implemented backlink architecture remains valid inside Wave 6 and as existing production functionality before Wave 6.

Preserve:

- current Domain Research;
- current Keyword Research;
- current Ahrefs provider wrapper;
- current cache services;
- current backlink recommendation flow;
- current legacy tables/data;
- current placement/backlink tables;
- current Draft/Project behavior until superseded by verified Project workspace UX.

Do not break existing features while earlier waves are implemented.

---

# 37. Legacy Provider Migration

Existing providers may include:

- OpenSEO;
- `radeance/ahrefs-scraper`;
- `burbn/ahrefs-keyword-explorer`;
- direct OpenAI helper.

Migration principle:

```text
Keep existing provider
      ↓
Introduce normalized replacement
      ↓
Parity test
      ↓
Production test
      ↓
Switch via controlled config/service path
      ↓
Monitor
      ↓
Deprecate only after explicit approval
```

Parity tests should cover the exact capability being replaced.

For Ahrefs migration, relevant metrics include:

- DR;
- Traffic;
- Search Volume;
- KD;
- Rank;
- Ranking URL;
- keyword ideas;
- backlinks.

For OpenSEO/audit migration, parity must cover the maintained Site Audit checklist and actionable issue details, not merely DR/Traffic.

---

# 38. Verification Standard

Before declaring any implementation wave complete:

## Build

- TypeScript/build passes;
- relevant lint/type errors are addressed;
- no unrelated feature breakage introduced.

## Data

- existing production rows still exist;
- migrations are additive;
- new foreign keys/constraints do not orphan legacy data;
- no unintended mass update/delete.

## Auth / Security

- login remains functional;
- intended internal shared access works only for authorized workspace members;
- RLS remains enabled where required;
- no service-role/provider secret appears client-side.

## Functional

Test the exact user flow introduced by the wave.

## Existing SEO/backlink regression

Until explicitly migrated/deprecated, verify that relevant existing workflows still work, including:

- Domain Research;
- Keyword Research;
- backlink recommendation;
- existing domain history;
- cache behavior.

## Production

Do not declare production success based only on preview/build.

Verify the relevant production route after publication when publication is part of the requested task.

---

# 39. Final Implementation Report

After every implementation phase/wave report:

- files changed;
- routes/components changed;
- migrations created;
- tables/columns/policies changed;
- provider/config changes;
- AI usage/provider path;
- build/typecheck result;
- deployment result if deployed;
- production verification result if deployed;
- tests not executed;
- known limitations;
- rollback notes where relevant.

---

# 40. Lovable Execution Rules

Future Lovable prompts should normally say:

```text
Follow:
- docs/SEO_ARCHITECTURE.md
- docs/PRD.md
- docs/USER_STORY_PLAYBOOK.md
- docs/KNOWLEDGE_BASE.md
- docs/UI_UX_SPEC.md
- docs/IMPLEMENTATION_ROADMAP.md

Implement WAVE X ONLY.
```

Do not paste the entire architecture into each Lovable conversation.

Lovable must:

- inspect current implementation first;
- reuse before replacing;
- touch only relevant files/direct dependencies;
- use additive migrations;
- preserve existing production data;
- preserve existing working workflows;
- follow current Project Knowledge;
- stop at the requested wave.

Mandatory stop condition:

```text
STOP CONDITION:
Do not continue to another wave.
Do not add unrelated features.
Do not redesign unrelated pages.
Do not deprecate legacy functionality unless explicitly requested.
After build/verification/reporting, stop.
```

---

# Final Design Principle

The final product should operate as:

```text
PROJECT
Client + Website + Objective + History
      │
      ├───────────────┐
      ▼               ▼
DATA SOURCES       MANUAL EVIDENCE
Connectors/API     Upload/Paste/Link
      │               │
      └───────┬───────┘
              ▼
       NORMALIZATION
              ▼
        FACTUAL DATA
   SEO / Analytics / Audit
              ▼
        AI REASONING
     Lovable AI + compatible
      provider abstraction
              ▼
       HUMAN DECISION
              ▼
PLAN → PROPOSAL → DELIVERY → TASKS
              ▼
BACKLINK / IMPLEMENTATION / MONITORING
              ▼
REPORTING → NEXT ACTION
```

The system should reduce tool fragmentation without sacrificing factual integrity, security, traceability, or human control.