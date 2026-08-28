/**
 * Phase 4 — Keyword Research (server-only).
 *
 * Flow: seed keyword → keyword ideas → shortlist →
 * keyword_metrics HANYA untuk keyword yang di-shortlist.
 * keyword_metrics_cache selalu dicek sebelum memanggil Apify.
 *
 * Tidak menyentuh tabel operasional dan tidak mengubah integrasi legacy.
 */

import { normalizeKeywordIdeas, normalizeKeywordMetrics, runAhrefs } from "./ahrefs.provider";
import {
  logResearchRun,
  lookupKeywordMetricsCache,
  normalizeCountry,
  normalizeKeyword,
  upsertKeywordMetricsCache,
} from "./cache.service";
import {
  SEO_PROVIDER_AHREFS_ALL_IN_ONE,
  type KeywordIdea,
  type KeywordMetricsResult,
} from "./types";

export type KeywordIdeasResult = {
  seed: string;
  country: string;
  ideas: KeywordIdea[];
  error: string | null;
};

export const MAX_SHORTLIST = 25;

/** Langkah 1 — hanya menghasilkan daftar ide keyword (tanpa metrik berbayar per keyword). */
export async function generateKeywordIdeas(input: {
  seed: string;
  country?: string;
  limit?: number;
}): Promise<KeywordIdeasResult> {
  const seed = normalizeKeyword(input.seed);
  const country = normalizeCountry(input.country);
  const limit = Math.max(1, Math.min(input.limit ?? 50, 100));

  if (!seed) {
    return { seed: input.seed, country, ideas: [], error: "Seed keyword tidak boleh kosong" };
  }

  const run = await runAhrefs({
    searchType: "keyword_ideas",
    keyword: seed,
    country,
  });

  const ideas = run.error ? [] : normalizeKeywordIdeas(run.items).slice(0, limit);

  await logResearchRun({
    provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
    searchType: "keyword_ideas",
    query: seed,
    cacheHit: false,
    status: run.error ? "gagal" : "ok",
    resultCount: ideas.length,
    error: run.error,
    durationMs: run.durationMs,
  });

  return { seed, country, ideas, error: run.error };
}

/** Langkah 2 — metrik untuk SATU keyword, cache-first. */
export async function researchKeyword(input: {
  keyword: string;
  country?: string;
  forceRefresh?: boolean;
}): Promise<KeywordMetricsResult> {
  const keyword = String(input.keyword ?? "").trim();
  const normalizedKeyword = normalizeKeyword(keyword);
  const country = normalizeCountry(input.country);

  if (!normalizedKeyword) {
    return {
      keyword,
      normalizedKeyword,
      country,
      searchVolume: null,
      keywordDifficulty: null,
      cpc: null,
      trafficPotential: null,
      provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
      source: "fresh",
      checkedAt: null,
      error: "Keyword tidak valid",
    };
  }

  if (!input.forceRefresh) {
    const cached = await lookupKeywordMetricsCache(keyword, country);
    if (cached.hit && cached.fresh && cached.result) {
      await logResearchRun({
        provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
        searchType: "keyword_metrics",
        query: normalizedKeyword,
        cacheHit: true,
        status: "ok",
        resultCount: 1,
        error: null,
        durationMs: 0,
      });
      return cached.result;
    }
  }

  const run = await runAhrefs({
    searchType: "keyword_metrics",
    keyword,
    country,
  });

  await logResearchRun({
    provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
    searchType: "keyword_metrics",
    query: normalizedKeyword,
    cacheHit: false,
    status: run.error ? "gagal" : "ok",
    resultCount: run.items.length,
    error: run.error,
    durationMs: run.durationMs,
  });

  if (run.error) {
    // Jangan membuat data palsu — pakai cache stale bila ada.
    const stale = await lookupKeywordMetricsCache(keyword, country);
    if (stale.result) return { ...stale.result, error: run.error };

    return {
      keyword,
      normalizedKeyword,
      country,
      searchVolume: null,
      keywordDifficulty: null,
      cpc: null,
      trafficPotential: null,
      provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
      source: "fresh",
      checkedAt: null,
      error: run.error,
    };
  }

  const result = normalizeKeywordMetrics(keyword, country, run.items, null);

  const hasData =
    result.searchVolume !== null ||
    result.keywordDifficulty !== null ||
    result.cpc !== null ||
    result.trafficPotential !== null;

  if (hasData) await upsertKeywordMetricsCache(result);

  return result;
}

/** Langkah 2 versi batch untuk shortlist keyword. */
export async function researchKeywords(input: {
  keywords: string[];
  country?: string;
  forceRefresh?: boolean;
}): Promise<KeywordMetricsResult[]> {
  const country = normalizeCountry(input.country);
  const unique: string[] = [];
  const seen = new Set<string>();

  for (const raw of input.keywords ?? []) {
    const keyword = String(raw ?? "").trim();
    const normalized = normalizeKeyword(keyword);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(keyword);
  }

  const results: KeywordMetricsResult[] = [];
  for (const keyword of unique.slice(0, MAX_SHORTLIST)) {
    results.push(
      await researchKeyword({ keyword, country, forceRefresh: input.forceRefresh }),
    );
  }
  return results;
}
