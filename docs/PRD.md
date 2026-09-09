# BRD / PRD — SEO Operating System MVP

> Product: SEO DA & Traffic Finder / Backlink Manager evolution
> Primary User: Internal SEO Specialist
> Version: MVP Product Definition v1.0
> Baseline: 10 September 2026

---

# 1. Product Overview

SEO Operating System adalah internal platform untuk membantu SEO Specialist menjalankan seluruh lifecycle pekerjaan SEO dalam satu workspace, mulai dari calon client hingga reporting dan continuous optimization.

Platform ini merupakan evolusi dari aplikasi production **SEO DA & Traffic Finder / Backlink Manager** yang saat ini sudah memiliki Domain Research, Keyword Research, Backlink Recommendation, Project/Placement foundation, SEO cache, dan historical backlink data.

Produk tidak dibangun ulang dari nol.

Existing production application, GitHub repository, Lovable Cloud hosting, Supabase database, authentication, working routes, custom domain, existing data, cache, dan integrasi yang masih aktif harus tetap dipertahankan selama pengembangan dilakukan secara additive.

Model utama produk:

```text
Calon Client / Project
        ↓
Discovery & Evidence Collection
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
Deal / Active Project
        ↓
Delivery Plan
        ↓
Task Execution
        ↓
Off-Page / Backlink Execution
        ↓
Monitoring
        ↓
Reporting & Analysis
        ↓
Continuous Optimization
```

Product rule utama:

```text
1 Project = 1 Client = 1 Primary Website
```

Project dibuat sejak masih calon client. Ketika deal, Project yang sama berubah status menjadi Active sehingga seluruh history discovery, file, audit, research, proposal, dan keputusan tetap berada di satu tempat.

---

# 2. Problem Statement

Saat ini pekerjaan SEO Specialist tersebar di banyak tempat dan tool.

Contoh kondisi kerja:

- discovery client disimpan di chat, notes, Docs, atau spreadsheet;
- website audit dilakukan di beberapa SEO tools berbeda;
- analytics berasal dari Search Console, GA4, ecommerce, ads platform, atau screenshot;
- competitor research dilakukan terpisah;
- keyword research berada di tool/spreadsheet lain;
- proposal dibuat manual di Slides/Docs;
- budget dihitung manual;
- implementation task tidak selalu memiliki context dari audit/research asalnya;
- backlink source, vendor, purchase history, keyword, target URL, dan performance tersebar di spreadsheet;
- reporting membutuhkan copy-paste data dari banyak source;
- screenshot, PDF, DOCX, XLSX, JSON, link, dan evidence lain mudah tercecer;
- insight yang sudah ditemukan pada fase pre-sales sering tidak terbawa secara utuh ke fase delivery.

Akibatnya:

- context client mudah hilang;
- data perlu dimasukkan ulang;
- research sering diulang;
- keputusan sulit ditelusuri kembali ke evidence;
- AI/tool hanya mengerjakan bagian kecil tanpa memahami keseluruhan Project;
- reporting membutuhkan banyak pekerjaan manual;
- SEO Specialist menggunakan terlalu banyak tools untuk satu workflow.

Produk harus mengubah proses tersebut menjadi satu workflow yang terhubung.

---

# 3. Product Objective

Membentuk satu internal SEO Operating System yang memungkinkan:

1. SEO Specialist membuat Project sejak calon client dengan input minimum.
2. Informasi discovery dapat diisi bertahap tanpa form awal yang berat.
3. User dapat menghubungkan data source apabila tersedia.
4. User tetap dapat bekerja tanpa connector melalui manual input, upload file, screenshot, link, dan media.
5. Sistem menormalisasi data sebelum data dipakai oleh workflow berikutnya.
6. AI memahami business context, objective, evidence, dan Project history.
7. Sistem menjalankan comprehensive Site Audit tanpa user harus memilih scope audit.
8. AI mendeteksi issue, severity, impact, dan suggested fix berdasarkan evidence yang tersedia.
9. Sistem menemukan dan membandingkan organic maupun paid competitors.
10. Sistem melakukan Keyword/SERP Research dan membantu menentukan keyword priority serta Target Page.
11. Hasil Audit, Competitor, Keyword, dan Backlink analysis dapat dimasukkan ke SEO Plan.
12. SEO Plan dapat digunakan untuk membuat proposal yang modular dan data-driven.
13. Budget proposal tetap diinput dan ditentukan manual oleh SEO Specialist.
14. Proposal yang deal dapat dikonversi menjadi Delivery Plan tanpa membuat ulang Project.
15. Delivery Plan dapat dipecah menjadi task operasional.
16. Off-Page / Backlink workflow mendukung planning, research, buying decision, placement, verification, dan monitoring.
17. Reporting dapat memakai connected data maupun manual evidence.
18. AI dapat membuat analysis/report berdasarkan Project context dan custom prompt.
19. Semua data, evidence, AI recommendation, human decision, implementation, dan result tetap traceable.

---

# 4. MVP Principle

## 4.1 Progressive, not form-heavy

User tidak perlu mengisi seluruh informasi client di awal.

Minimum Project creation:

- Project / Client Name;
- Website/domain apabila sudah diketahui.

Informasi lain dapat ditambahkan setelah discovery call atau dari evidence yang di-upload.

## 4.2 Manual data is a first-class input

Platform tidak boleh bergantung pada API/connector agar workflow dapat berjalan.

Data dapat berasal dari:

- manual form;
- paste text/list;
- CSV;
- XLS/XLSX;
- TXT;
- JSON;
- PDF;
- DOC/DOCX;
- image/screenshot;
- URL/link;
- media/format lain yang secara teknis didukung.

## 4.3 Normalize before operational use

Canonical import flow:

```text
Upload / Paste
      ↓
Detect
      ↓
Extract
      ↓
Normalize
      ↓
Field Mapping
      ↓
Validate
      ↓
Data Preview
      ↓
User Confirm
      ↓
Save
```

Data yang belum pasti hasil parsing/mapping-nya tidak boleh langsung dimasukkan sebagai structured operational data tanpa preview.

## 4.4 AI assists, human decides

Mental model:

```text
Collect factual data
      ↓
Normalize + Structure
      ↓
AI Analyze / Recommend
      ↓
SEO Specialist Review / Edit
      ↓
SEO Specialist Final Decision
```

AI dapat membantu:

- memahami dokumen;
- mengekstrak structured information;
- mendeteksi issue;
- memberi recommendation;
- membuat suggested fix/copy;
- mengklasifikasikan keyword opportunity;
- merekomendasikan target page;
- membantu backlink planning;
- drafting proposal;
- drafting report;
- menjawab custom prompt berdasarkan Project context.

AI tidak menentukan secara final:

- pricing;
- commercial commitment;
- guarantee;
- final backlink quantity;
- final backlink strategy;
- final budget;
- perubahan authoritative data tanpa user action.

## 4.5 AI must not invent factual SEO metrics

AI tidak boleh mengarang:

- DR / authority;
- organic traffic;
- Search Volume;
- Keyword Difficulty;
- CPC;
- Traffic Potential;
- SERP Position;
- backlink count;
- referring-domain count;
- connected analytics value;
- connected ad-platform value;
- ecommerce/conversion value.

Jika data tidak tersedia, status harus jelas seperti:

- Data Not Available;
- Not Connected;
- Unable to Verify;
- Unverified.

## 4.6 One Project keeps the full lifecycle

Project tidak dibuat ulang setelah deal.

```text
Prospect Project → Proposal → Deal → Active Project
```

Semua evidence dan history tetap terkait pada Project yang sama.

## 4.7 Internal-only MVP

Platform hanya digunakan oleh internal SEO Specialist/team.

Untuk MVP:

- tidak ada Client Portal;
- tidak ada client login;
- tidak ada mandatory client approval workflow;
- semua internal authenticated users dapat melihat semua Client/Project;
- PIC/Owner digunakan untuk tanggung jawab operasional, bukan pembatas akses.

## 4.8 Preserve current production system

MVP expansion bersifat additive.

Jangan:

- rebuild dari nol;
- migrate framework;
- pindah hosting;
- recreate GitHub repository;
- menghapus production data;
- menghapus legacy integration sebelum parity validation;
- mengekspos secret/API key di browser;
- melakukan destructive migration untuk menyesuaikan model baru.

---

# 5. Target Users

## A. Internal SEO Specialist

Hak dan kemampuan utama:

- melihat seluruh Project;
- membuat Project;
- mengedit Project context;
- upload evidence;
- connect data source;
- menjalankan Site Audit;
- menjalankan Competitive Analysis;
- menjalankan Keyword/SERP Research;
- membuat SEO Plan;
- membuat/edit Proposal;
- mengisi Budget;
- convert Project menjadi Active;
- membuat/edit Delivery Plan;
- membuat dan menyelesaikan Task;
- melakukan Backlink Planning & Execution;
- membuat dan menyimpan Report;
- menggunakan AI analysis/custom prompt.

## B. Internal Team Member / PIC

Untuk MVP, bukan role authorization terpisah.

PIC/Owner dapat digunakan pada Task/Delivery/Project untuk menunjukkan responsibility, tetapi user tetap dapat melihat seluruh Project.

---

# 6. Core MVP Features

## 6.1 Project Workspace

Project adalah root workspace untuk satu client dan satu website.

### Minimum Project fields

- Project / Client Name;
- Primary Website;
- Status;
- optional notes.

### Progressive fields

- Industry;
- Objective;
- Target Market;
- Current Problem / Pain Point;
- Contact Person;
- Budget Indication;
- Known Competitors;
- Access Availability;
- Additional Notes.

### Project lifecycle

Recommended status:

- Prospect;
- Assessment;
- Proposal;
- Active;
- Lost;
- Archived.

### Project workspace contains

- Overview;
- Client Intelligence;
- Data Sources;
- Files & Evidence;
- Site Audit;
- Competitors;
- Keywords & SERP;
- SEO Plan;
- Proposal;
- Delivery Plan;
- Tasks;
- Backlinks;
- Reports.

---

## 6.2 Data Sources & Connections

Sebelum audit/analysis, user dapat menghubungkan data source yang tersedia.

Target connection categories:

### Search & Analytics

- Google Search Console;
- Google Analytics / GA4.

### Advertising

- Google Ads;
- Meta Ads, apabila integrasi teknis tersedia;
- TikTok Ads, apabila integrasi teknis tersedia.

### Ecommerce / Conversion

- Shopify;
- WooCommerce;
- source ecommerce/conversion lain yang tersedia.

### Website / CMS

- WordPress / CMS;
- hosting/server access/reference bila secara teknis dapat diintegrasikan;
- sitemap;
- robots.txt;
- public website crawl.

### SEO Intelligence

- Apify / Ahrefs All-in-One;
- existing OpenSEO/legacy provider selama masih diperlukan;
- public web collection/crawl.

### Connection state

Minimal status:

- Connected;
- Available;
- Not Connected;
- Error;
- Unsupported / Needs Manual Data.

Project tetap dapat diproses walaupun connector tidak tersedia.

---

## 6.3 Files & Evidence

User dapat menyimpan evidence dalam Project.

### Input

- PDF;
- DOC/DOCX;
- XLS/XLSX;
- CSV;
- JSON;
- TXT;
- screenshot/image;
- URL/link;
- media lain yang didukung.

### Processing flow

```text
Add Evidence
      ↓
Store Source
      ↓
Extract usable content/metadata where supported
      ↓
Normalize
      ↓
AI Understanding / Enrichment on explicit workflow
      ↓
Available as Project Context
```

### Required principles

- original source/reference tetap dipertahankan bila memungkinkan;
- AI analysis tidak menggantikan source data;
- hasil AI dapat direview/edit;
- evidence memiliki provenance/source.

---

## 6.4 Manual Structured Import & Normalization

Digunakan pada Domain, Keyword, Backlink Source, Existing Backlink, competitor data, dan structured dataset lain.

### Example input

```text
Website | Authority | Visitor | Harga Vendor
```

Sistem dapat menyarankan:

```text
Website       → Source Domain
Authority     → DR
Visitor       → Organic Traffic
Harga Vendor  → Price
```

User dapat mengubah mapping sebelum save.

### Domain normalization

Contoh berikut harus dapat dikenali sebagai domain yang sama ketika context-nya adalah domain:

```text
https://www.example.com/article?id=1
www.example.com/
example.com
```

Normalized Domain:

```text
example.com
```

### Important distinction

Jangan mencampur:

- Source Domain;
- Target Domain;
- Target URL;
- Live Backlink URL.

Specific page URL harus mempertahankan path yang dibutuhkan workflow.

### Data Preview

Preview minimal menunjukkan:

- total rows;
- valid;
- duplicate;
- invalid;
- missing required data;
- field mapping;
- normalized output.

Actions:

```text
[Process Again]
[Edit Mapping]
[Save & Continue]
```

---

## 6.5 AI Client Intelligence

AI membaca Project context yang tersedia dari form, evidence, connection, public data, dan prompt user.

### Default intelligence output

- Business Understanding;
- Client Objectives;
- Target Market / Audience;
- Available Data & Access;
- Initial SEO Findings;
- Missing Information;
- Suggested Discovery Questions;
- Recommended Next Actions.

### Suggested structured information

AI dapat menyarankan perubahan seperti:

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

AI tidak boleh mengubah Project authoritative fields secara silent.

---

## 6.6 Comprehensive Site Audit

Tidak ada normal scope selector.

Ketika Site Audit dijalankan, sistem menjalankan seluruh check yang didukung menggunakan seluruh data yang tersedia.

### Potential inputs

- public website crawl;
- page HTML;
- sitemap;
- robots.txt;
- Search Console;
- GA4;
- CMS/website connection;
- uploaded evidence;
- SEO provider data;
- performance/technical data yang tersedia.

### Audit areas

Minimum categories mengikuti maintained SEO checklist dan supported engine, termasuk:

- title;
- meta description;
- H1-H6;
- internal/external links;
- image/alt;
- canonical;
- robots;
- sitemap;
- indexability/noindex;
- Open Graph;
- hreflang;
- duplicate signals;
- structured data/schema;
- page performance/response issue;
- information architecture;
- technical/on-page issue lain yang didukung.

### Check status

Setiap check harus memiliki hasil eksplisit:

- Passed;
- Urgent;
- Issue;
- Warning;
- Not Found;
- Unable to Verify.

### AI Audit Analyst

AI dapat:

- memahami issue dari seluruh audit evidence;
- mengelompokkan related issue;
- menentukan priority/severity recommendation;
- menjelaskan why it matters;
- memberi how to fix;
- membuat suggested fix apabila sesuai.

Example:

```text
Issue: Missing Meta Description
Affected URL: /product-a
AI Suggested Meta Description: ...
```

### Audit → Task

Setiap actionable issue dapat dikonversi menjadi Task.

Task membawa:

- audit run;
- issue;
- URL(s);
- severity;
- evidence;
- recommendation;
- AI suggested fix.

---

## 6.7 Competitive Analysis

Tujuan utama:

> Who is actually beating the client in organic and paid search, where, and why?

### Competitor discovery

Sistem dapat menemukan competitor secara otomatis dari available SEO/SERP/paid data.

User juga dapat:

- Add Competitor Manually;
- Ignore/Remove;
- Mark as Primary Competitor.

### Organic analysis

Target output dapat mencakup:

- authority;
- organic traffic;
- shared keywords;
- keyword gap;
- ranking overlap;
- top pages;
- content gap;
- backlink/referring-domain gap.

### Paid analysis

Jika source tersedia:

- paid keywords;
- CPC;
- ad title;
- ad description/copy;
- landing URL;
- paid competitor context.

### AI Competitive Intelligence

AI menjelaskan:

- competitor yang paling relevan;
- area yang outperform client;
- alasan/gap utama;
- opportunity yang layak diteruskan ke SEO Plan.

---

## 6.8 Keyword & SERP Research

Keyword Research harus Project-aware.

### Context

Sistem dapat menggunakan:

- business/objective Project;
- website client;
- Search Console apabila connected;
- seed keyword;
- existing keyword;
- competitor keyword;
- competitor gap;
- SERP;
- top pages;
- current position;
- target market.

### Factual metrics

Jika tersedia:

- Search Volume;
- Keyword Difficulty;
- CPC;
- Traffic Potential;
- Search Intent;
- Current Position;
- Ranking URL;
- SERP competitors/features.

### AI opportunity grouping

- Quick Wins;
- High Business Value;
- Content Opportunities;
- Competitor Gaps;
- Brand / Awareness Opportunities.

### Keyword → Target Page

AI dapat merekomendasikan:

```text
Optimize Existing Page
```

atau:

```text
Create New Page Recommended
```

User tetap dapat edit/override.

Action:

```text
[Add to SEO Plan]
```

---

## 6.9 SEO Plan

SEO Plan adalah kumpulan recommendation/opportunity yang dipilih oleh SEO Specialist.

Item dapat berasal dari:

- Site Audit;
- Competitive Analysis;
- Keyword/SERP Research;
- Backlink Analysis;
- manual input;
- AI recommendation.

### SEO Plan item

Minimal dapat menyimpan:

- category;
- title/action;
- source finding;
- priority;
- related keyword;
- related URL;
- expected impact;
- recommendation;
- notes;
- status/selected state.

SEO Plan menjadi source untuk Proposal dan Delivery Plan.

---

## 6.10 Proposal Builder

Proposal bukan fixed document template.

Proposal adalah modular business case yang dibangun dari Project data dan SEO Plan.

### Potential sections

- Executive Summary;
- Client Needs / Pain Point;
- Current Performance;
- Audit Findings;
- Competitor Gap;
- Keyword Opportunity;
- Recommended Strategy;
- Analysis & Strategy;
- Keyword Research;
- Content Strategy;
- Technical SEO;
- On-Page Optimization;
- Off-Page Optimization;
- Content Production Plan;
- Backlink Plan;
- Flow of Work;
- Timeline;
- Traffic Forecast;
- KPI / Target;
- Deliverables;
- Budget;
- SEO vs SEM / scenario simulation where relevant;
- Disclaimer / assumptions.

### AI Proposal Assistant

AI dapat:

- suggest relevant sections;
- generate draft based on Project evidence;
- summarize findings;
- explain business impact;
- draft strategy;
- draft forecast narrative from factual/scenario input;
- draft disclaimer.

### User control

User dapat:

- add/remove section;
- reorder;
- edit content;
- regenerate specific section;
- use manual content.

### Budget rule

Budget diinput manual oleh SEO Specialist.

AI tidak menentukan final price.

### Commercial data safety

AI tidak boleh membuat contractual guarantee, quantity commitment, budget, atau forecast assumption sebagai final tanpa user review.

---

## 6.11 Convert to Active Project & Delivery Plan

Ketika proposal disetujui:

```text
Project Status → Active
```

Project tidak dibuat ulang.

Approved Scope dan Deliverables dapat digunakan untuk membuat Draft Delivery Plan.

### Flow

```text
Approved Proposal
      ↓
Generate Draft Delivery Plan
      ↓
SEO Specialist Review/Edit
      ↓
Activate Delivery Plan
      ↓
Create Tasks as needed
```

Delivery Plan dapat disusun per:

- month;
- phase;
- workstream.

Contoh activity:

- Technical SEO;
- On-Page;
- Keyword Mapping;
- Content Planning;
- Content Production;
- Backlink;
- Monitoring;
- Reporting.

Jangan otomatis membuat ratusan Task sekaligus jika masih cukup direpresentasikan sebagai deliverable/quantity dalam Delivery Plan.

---

## 6.12 Task Management

Task digunakan untuk execution tracking, bukan approval workflow.

### Core status

```text
To Do → In Progress → Done
```

Optional operational states:

- Blocked;
- Cancelled.

### Task fields

- Project;
- Title;
- Category;
- Priority;
- PIC/Owner;
- Due Date;
- Status;
- Related URL;
- Related Keyword;
- Source Type;
- Source Record;
- Evidence;
- AI Recommendation;
- Notes;
- Attachment;
- Before Evidence;
- After Evidence;
- Result / Impact.

### Task sources

- Audit;
- Competitor;
- Keyword;
- SEO Plan;
- Backlink;
- Delivery Plan;
- Manual.

Tidak ada mandatory Internal Review / Client Review / Approval stage pada MVP.

---

## 6.13 Backlink Planning

Backlink Planning mendukung dua input path.

### Path A — Manual

User dapat:

- paste list domain;
- upload structured file;
- upload existing backlink data;
- upload competitor backlink data;
- input KPI/target manual.

### Path B — Automatic

Data dapat berasal dari:

- Project data;
- SEO API/provider;
- connected source;
- existing backlink database;
- competitor analysis;
- keyword/SERP analysis.

### AI-assisted backlink planning

Optional action:

```text
[Analyze with AI]
```

AI dapat merekomendasikan:

- backlink gap;
- estimated quantity;
- quality criteria;
- DR/traffic criteria;
- topical relevance;
- target keyword;
- target page;
- anchor mix;
- monthly distribution;
- competitor gap;
- SERP difficulty considerations.

### Final decision

SEO Specialist dapat:

- accept;
- edit;
- ignore AI;
- input strategy manual.

Final quantity dan strategy selalu ditentukan oleh SEO Specialist.

---

## 6.14 Backlink Source Research

User dapat memasukkan calon Source Domain secara manual atau dari data source/API.

### Step A — Historical Check

Untuk setiap Source Domain, sistem mengecek:

- pernah digunakan atau belum;
- same Project;
- other Project/history;
- purchase count;
- last used date;
- previous keyword/anchor;
- previous target URL;
- vendor/platform;
- previous price jika tersedia.

Duplicate/history tidak otomatis diblokir.

User tetap dapat membeli lagi.

### Step B — Quality Research

Potential factual/context data:

- DR;
- organic traffic;
- backlinks;
- referring domains;
- top keywords/pages;
- topical relevance;
- language/country context;
- risk/spam indicators apabila data tersedia.

### Step C — AI recommendation

AI dapat memberi classification seperti:

- Recommended;
- Consider;
- Avoid;

beserta reasoning.

### Step D — Human decision

```text
Buy
Skip
Save for Later
```

---

## 6.15 Placement Order & Backlink Lifecycle

Setelah user memilih Buy, placement masuk lifecycle.

Recommended status:

```text
Planned
→ Purchased / Ordered
→ Content / Processing
→ Live
→ Verified
```

Exception status:

- Cancelled;
- Failed.

### Placement / Live backlink data

- Source Domain;
- Live URL;
- Target URL;
- Keyword;
- Anchor;
- Vendor/Platform;
- Price;
- Purchase Date;
- Live Date;
- DR/Traffic snapshot saat keputusan;
- link type;
- evidence;
- notes.

---

## 6.16 Backlink Monitoring

Setelah Live, sistem dapat melakukan monitoring berkala jika secara teknis tersedia.

Potential monitoring states:

- Live;
- Missing;
- Redirected;
- Nofollow Changed;
- Target Changed;
- Error;
- Unable to Verify.

Problem dapat menjadi warning atau Task.

---

## 6.17 Reporting & Monitoring

Reporting memakai hybrid data model.

### Automatic data

Apabila connector tersedia, sistem dapat menggunakan:

- Search Console;
- GA4;
- keyword ranking;
- backlink monitoring;
- audit data;
- Google Ads;
- other supported paid media;
- ecommerce/conversion data.

### Manual evidence

User tetap dapat:

- upload screenshot;
- upload PDF/DOCX;
- upload spreadsheet/JSON;
- add link;
- add note/data manual.

### AI Reporting Assistant

User dapat memberikan prompt seperti:

> Buat monthly SEO report untuk management. Fokus ke traffic, keyword, conversion, backlink, dan rekomendasi bulan depan.

AI dapat membuat:

- Executive Summary;
- KPI Performance;
- Traffic Analysis;
- Conversion Analysis;
- Keyword Performance;
- Page Performance;
- Technical SEO Progress;
- Content Performance;
- Backlink Performance;
- Paid Media Context;
- Task / Implementation Progress;
- Findings;
- Risks;
- Recommended Next Actions.

### Reporting rule

Jika data tidak tersedia, AI tidak boleh mengarang angka.

### Report history

Report disimpan per period.

User dapat:

- edit;
- save version;
- compare with previous period;
- ask AI about changes;
- export/share using supported output mechanisms.

Target exports dapat meliputi:

- PDF;
- DOCX;
- PPTX;
- XLSX;
- shareable report link apabila diimplementasikan.

---

# 7. Data & AI Structure Principle

## 7.1 Original / Evidence Layer

Source yang dikumpulkan dari:

- uploaded file;
- connection;
- API;
- crawl;
- manual input.

Original/raw source tidak digantikan oleh AI summary.

## 7.2 Normalized / Structured Layer

Data yang sudah dipetakan ke internal product model.

Contoh:

- normalized domain;
- keyword;
- traffic;
- DR;
- price;
- competitor;
- audit issue;
- task;
- report metric.

## 7.3 Intelligence Layer

Output AI seperti:

- summary;
- recommendation;
- issue reasoning;
- opportunity classification;
- suggested copy;
- proposal narrative;
- report narrative.

AI layer tidak menggantikan factual source layer.

## 7.4 Decision Layer

Human-confirmed decision seperti:

- selected keyword;
- target page;
- final SEO Plan;
- final budget;
- backlink Buy/Skip;
- backlink quantity;
- delivery scope;
- task completion.

---

# 8. Current Production Compatibility

Existing technical architecture tetap harus dipertahankan dan dikembangkan secara additive.

Existing production stack:

- TanStack Start + React;
- Vite;
- Tailwind CSS / current components;
- Lovable Cloud;
- Lovable Cloud managed Supabase;
- existing GitHub repository;
- current authentication;
- current custom domain.

Existing SEO/backlink foundation includes:

- `projects`;
- `placement_orders`;
- `backlinks`;
- `global_domain_cache`;
- `keyword_metrics_cache`;
- `keyword_rank_cache`;
- `seo_research_runs`;
- historical `sudah_dibeli`;
- `domain_sudah_pernah`;
- `traffic_nol`;
- `check_logs`;
- `search_history`.

Existing provider architecture includes:

- Apify Actor `pro100chok/ahrefs-seo-tools`;
- OpenAI server-side semantic reasoning for existing backlink flow;
- legacy OpenSEO / older Apify paths retained until explicitly deprecated.

New product requirements do not authorize destructive removal of these components.

---

# 9. AI Provider Principle

Target for new general intelligent workflows:

- prefer Lovable managed AI / AI Gateway where it can satisfy document understanding, analysis, drafting, and reasoning needs while minimizing separate external AI integration cost;
- keep the application behind an internal AI abstraction;
- do not couple UI components directly to one model/provider;
- existing OpenAI backlink workflow remains functional until parity/migration is tested;
- actual Lovable AI usage limits, supported models, and commercial usage constraints must be validated during implementation and must not be assumed unlimited.

SEO factual metrics remain sourced from factual providers/cache, not from generative AI.

---

# 10. Security & Access Principle

Target MVP access behavior:

> All authorized internal SEO users can see all Projects.

Current production tables contain ownership-based RLS in parts of the existing application.

Therefore shared internal access must be implemented through an explicit safe team/workspace authorization design.

Do not solve shared visibility by:

- disabling RLS;
- adding public access;
- creating unrestricted authenticated policies without a team authorization model.

Sensitive credentials remain server-only.

Never expose:

- Supabase service-role key;
- secret Supabase keys;
- Apify secret/token;
- OpenAI key;
- other provider credentials.

---

# 11. UX Principle

The product should feel like:

> **A modern SEO command center that already understands the Project context.**

Not like:

> **A collection of disconnected SEO utilities and administrative forms.**

Primary UX rules:

1. Project context is always clear.
2. Complex analysis is summarized first, detail is expandable.
3. Tables are used for operational data; charts only when they improve understanding.
4. Manual upload is always easy to find where relevant.
5. AI appears contextually inside workflow, not as a generic chat-only experience.
6. Every AI recommendation is distinguishable from factual data.
7. User can override AI.
8. User should not have to repeatedly select the same Project/domain in every tool.
9. Existing data should be reused before requesting paid API calls.
10. Import should prefer AI/automatic detection over forcing the user to clean spreadsheets first.

Detailed visual/UI rules are defined in:

```text
docs/UI_UX_SPEC.md
```

---

# 12. MVP Success Criteria

MVP dianggap berhasil apabila:

1. **Project** — SEO Specialist dapat membuat Project dengan data minimum dan melengkapinya bertahap.
2. **Evidence** — user dapat menambahkan file/link/manual evidence ke Project.
3. **Normalization** — structured manual upload dapat dideteksi, dipetakan, dinormalisasi, dipreview, dan disimpan setelah confirmation.
4. **Client Intelligence** — AI dapat memahami Project context, menemukan missing information, dan memberikan recommended next actions.
5. **Audit** — system dapat menjalankan comprehensive Site Audit dengan explicit issue/status output.
6. **AI Audit** — AI dapat menjelaskan issue dan memberikan suggested remediation/fix tanpa mengarang factual metric.
7. **Audit to Task** — actionable audit finding dapat dibuat menjadi Task dengan source context.
8. **Competitor** — user dapat memperoleh competitor analysis dari automatic discovery maupun manual competitor list.
9. **Keyword** — system dapat membuat Project-aware Keyword/SERP analysis dan Target Page recommendation.
10. **SEO Plan** — user dapat memilih recommendation menjadi SEO Plan.
11. **Proposal** — system dapat membuat proposal modular berdasarkan Project/SEO Plan, sementara budget tetap manual.
12. **Deal Conversion** — Project dapat berubah Prospect → Active tanpa kehilangan data/history.
13. **Delivery Plan** — approved scope dapat dibuat menjadi Delivery Plan yang dapat diedit.
14. **Task** — user dapat menjalankan To Do → In Progress → Done tanpa mandatory approval workflow.
15. **Backlink Planning** — system mendukung manual dan automatic input serta optional AI recommendation.
16. **Backlink Decision** — final quantity, strategy, dan Buy/Skip tetap berada di tangan SEO Specialist.
17. **Placement Lifecycle** — backlink dapat ditrack dari planned/order sampai live/verified.
18. **Backlink Monitoring** — live backlink dapat memiliki current monitoring state apabila verification tersedia.
19. **Reporting** — report dapat dibuat dari connected data maupun manual evidence.
20. **AI Reporting** — AI dapat membuat analysis berdasarkan Project data dan custom prompt tanpa fabricated metric.
21. **History** — report dan important decisions dapat ditelusuri ke period/source/history.
22. **Internal Access** — seluruh authorized internal SEO team dapat mengakses Project sesuai secure team authorization design.
23. **Production Safety** — existing application, existing data, authentication, cache, backlink history, dan working workflows tetap berfungsi setelah expansion.
24. **Cost Control** — cache dan deduplication mencegah unnecessary paid SEO/API calls.
25. **Security** — privileged keys/provider calls tetap server-side dan RLS tidak dilemahkan untuk convenience.

---

# Final Product Mental Model

```text
PROJECT = CLIENT + WEBSITE + CONTEXT

DATA SOURCES + FILES + PUBLIC CRAWL
              ↓
        NORMALIZATION
              ↓
      FACTUAL SEO DATA
              ↓
     AI INTELLIGENCE
              ↓
      HUMAN DECISION
              ↓
PLAN → PROPOSAL → DELIVERY → TASKS
              ↓
   BACKLINK / IMPLEMENTATION
              ↓
 MONITORING → REPORTING → NEXT ACTION
```

The platform's job is not to replace the SEO Specialist.

The platform's job is to give the SEO Specialist **one connected system for facts, analysis, decisions, execution, and learning**.