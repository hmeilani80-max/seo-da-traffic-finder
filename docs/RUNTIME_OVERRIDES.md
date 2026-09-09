# Runtime Overrides — Current Operating Policy

> Effective: 10 September 2026
> This file records explicit operating constraints that supersede older provider preferences when they conflict.

## 1. No Lovable Agent / Token Usage

Until explicitly changed by the user:

- do not use the Lovable coding agent for implementation;
- do not depend on Lovable agent credits for planning, coding, testing, or iteration;
- implement through GitHub branches/PRs and direct code changes;
- use GitHub Actions for TypeScript/build verification;
- keep Lovable Cloud as the existing hosting/backend platform unless the user explicitly changes hosting.

This restriction is about Lovable agent/token consumption. It does not require rebuilding or migrating the existing Lovable-hosted application.

## 2. AI Runtime Default

Application AI provider default is now:

```text
OpenAI
```

The application-level provider abstraction must remain.

Lovable managed AI / AI Gateway is optional only and must never be selected automatically merely because a Lovable key is available.

Lovable AI may only be used again after an explicit configuration/user decision, for example:

```text
AI_PROVIDER=lovable
```

Existing and new AI workflows should otherwise resolve to the OpenAI server-side provider.

## 3. Factual Integrity

Provider choice does not change the existing AI integrity rule:

- AI reasons over supplied facts;
- AI does not invent DR, traffic, search volume, KD, CPC, SERP position, backlinks, analytics, ads, ecommerce, or conversion figures;
- human review remains required for authoritative Project changes and strategic/commercial decisions.

## 4. Verification Path

Preferred implementation verification:

```text
GitHub change
  → Pull Request
  → GitHub Actions TypeScript check
  → GitHub Actions build
  → Merge after green CI
  → UAT / production verification separately
```

Do not declare visual or production UAT complete based on CI alone.

## 5. Database Safety

The available direct Supabase connector must not be assumed to be the Lovable-managed production database unless its project identity is explicitly verified.

When production database identity is uncertain:

- commit additive migration SQL to the repository;
- do not run the migration against an unverified Supabase project;
- preserve existing production data and RLS.

## Precedence

If an older document says to prefer Lovable managed AI or use Lovable agent execution, this runtime override takes precedence until the user explicitly changes it.
