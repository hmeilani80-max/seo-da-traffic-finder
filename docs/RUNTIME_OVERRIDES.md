# Runtime Overrides — Current Operating Policy

> Effective: 10 September 2026
> This file supersedes older provider/execution preferences when they conflict.

## 1. Zero Lovable Token / Agent Usage

Until the user explicitly changes this policy:

- do not use the Lovable coding agent for planning, coding, testing, iteration, or deployment work;
- do not call Lovable managed AI / AI Gateway from application workflows;
- do not depend on `LOVABLE_API_KEY`;
- implementation is performed through GitHub branches/PRs and repository code;
- verification uses GitHub Actions plus separate UAT;
- Lovable Cloud may remain the existing hosting/backend platform; this policy does not require a hosting migration.

## 2. Application AI Runtime

Generative AI runtime is:

```text
OpenAI (server-side)
```

The provider abstraction remains so code is not coupled directly to UI components, but the only enabled generative provider is OpenAI.

## 3. Factual Integrity

AI may reason over supplied facts but must not invent DR, traffic, search volume, KD, CPC, SERP position, backlink counts, analytics, ads, ecommerce, or conversion values.

Human review remains required for authoritative Project changes and strategic/commercial decisions.

## 4. Verification Path

```text
GitHub branch
  → code + additive migrations
  → GitHub Actions TypeScript check
  → GitHub Actions build
  → PR review/UAT
  → merge only after verification
```

CI success is not the same as production or visual UAT.

## 5. Database Safety

The direct Supabase connector must not be assumed to be the Lovable-managed production database unless project identity is explicitly verified.

When identity is uncertain:

- keep schema changes as additive migration SQL in the repository;
- do not run destructive migrations against an unverified project;
- preserve production data, auth, RLS, caches, and legacy backlink history.

## Precedence

If an older PRD, architecture note, or prompt says to prefer Lovable managed AI or use the Lovable agent, this runtime override takes precedence.
