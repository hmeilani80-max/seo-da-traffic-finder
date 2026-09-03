/**
 * Helper cache SEO (server-side only) — Phase 1.
 *
 * Menyediakan normalisasi, cek kesegaran (freshness), lookup, dan update
 * untuk tabel: global_domain_cache, keyword_metrics_cache, keyword_rank_cache,
 * serta logging ke seo_research_runs.
 *
 * Klien admin Supabase di-import dinamis di dalam fungsi agar tidak pernah
 * masuk ke bundle browser.
 */

import {
  CACHE_TTL_DAYS,
  DEFAULT_COUNTRY,
  DEFAULT_LANGUAGE,
  SEO_PROVIDER_AHREFS_ALL_IN_ONE,
  type DomainResearchResult,
  type KeywordMetricsResult,
  type KeywordRankResult,
  type SeoResearchRun,
  type SeoTopKeyword,
  type SeoTopPage,
} from "./types";

/* -------------------------------------------------------------------------- */
/* Normalisasi                                                                 */
/* -------------------------------------------------------------------------- */

/** lowercase, hapus protocol, www., path, query, trailing slash. */
export function normalizeDomain(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "")
    .replace(/\.$/, "");
}

/** lowercase, trim, rapikan whitespace ganda. */
export function normalizeKeyword(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

export function normalizeCountry(input?: string | null): string {
  const value = String(input ?? "").trim().toLowerCase();
  return value || DEFAULT_COUNTRY;
}

export function normalizeLanguage(input?: string | null): string {
  const value = String(input ?? "").trim().toLowerCase();
  return value || DEFAULT_LANGUAGE;
}

/* -------------------------------------------------------------------------- */
/* Freshness                                                                   */
/* -------------------------------------------------------------------------- */

const DAY_MS = 24 * 60 * 60 * 1000;

export function isFresh(checkedAt: string | null | undefined, ttlDays: number): boolean {
  if (!checkedAt) return false;
  const ts = Date.parse(checkedAt);
  if (!Number.isFinite(ts)) return false;
  return Date.now() - ts < ttlDays * DAY_MS;
}

export const freshness = {
  domainAuthority: (checkedAt?: string | null) => isFresh(checkedAt, CACHE_TTL_DAYS.domainAuthority),
  domainTraffic: (checkedAt?: string | null) => isFresh(checkedAt, CACHE_TTL_DAYS.domainTraffic),
  keywordMetrics: (checkedAt?: string | null) => isFresh(checkedAt, CACHE_TTL_DAYS.keywordMetrics),
  keywordRank: (checkedAt?: string | null) => isFresh(checkedAt, CACHE_TTL_DAYS.keywordRank),
};

/* -------------------------------------------------------------------------- */
/* Supabase admin (dynamic import, server only)                                */
/* -------------------------------------------------------------------------- */

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

function toNumberOrNull(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function toJsonArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/* -------------------------------------------------------------------------- */
/* global_domain_cache                                                         */
/* -------------------------------------------------------------------------- */

export type DomainCacheLookup = {
  hit: boolean;
  authorityFresh: boolean;
  trafficFresh: boolean;
  result: DomainResearchResult | null;
};

export async function lookupDomainCache(domain: string): Promise<DomainCacheLookup> {
  const normalizedDomain = normalizeDomain(domain);
  const supabase = await db();

  const { data, error } = await supabase
    .from("global_domain_cache")
    .select("*")
    .eq("normalized_domain", normalizedDomain)
    .maybeSingle();

  if (error) {
    console.error("[cache.service] lookupDomainCache", error.message);
  }

  if (!data) {
    return { hit: false, authorityFresh: false, trafficFresh: false, result: null };
  }

  const authorityFresh = freshness.domainAuthority(data.authority_checked_at);
  const trafficFresh = freshness.domainTraffic(data.traffic_checked_at);

  return {
    hit: true,
    authorityFresh,
    trafficFresh,
    result: {
      domain: normalizedDomain,
      normalizedDomain,
      dr: toNumberOrNull(data.dr),
      traffic: toNumberOrNull(data.traffic),
      backlinks: toNumberOrNull(data.backlinks),
      referringDomains: toNumberOrNull(data.referring_domains),
      topKeywords: toJsonArray<SeoTopKeyword>(data.top_keywords),
      topPages: toJsonArray<SeoTopPage>(data.top_pages),
      provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
      source: "cache",
      authorityCheckedAt: data.authority_checked_at,
      trafficCheckedAt: data.traffic_checked_at,
      error: null,
    },
  };
}

export type DomainCachePatch = {
  dr?: number | null;
  traffic?: number | null;
  backlinks?: number | null;
  referringDomains?: number | null;
  topKeywords?: SeoTopKeyword[] | null;
  topPages?: SeoTopPage[] | null;
  authorityCheckedAt?: string | null;
  trafficCheckedAt?: string | null;
  rawData?: unknown;
};

/** Upsert parsial — hanya field yang dikirim yang diperbarui. */
export async function upsertDomainCache(domain: string, patch: DomainCachePatch): Promise<void> {
  const normalized_domain = normalizeDomain(domain);
  const supabase = await db();

  const row: Record<string, unknown> = {
    normalized_domain,
    provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
    updated_at: new Date().toISOString(),
  };

  if (patch.dr !== undefined) row["dr"] = patch.dr;
  if (patch.traffic !== undefined) row["traffic"] = patch.traffic;
  if (patch.backlinks !== undefined) row["backlinks"] = patch.backlinks;
  if (patch.referringDomains !== undefined) row["referring_domains"] = patch.referringDomains;
  if (patch.topKeywords !== undefined) row["top_keywords"] = patch.topKeywords;
  if (patch.topPages !== undefined) row["top_pages"] = patch.topPages;
  if (patch.authorityCheckedAt !== undefined) row["authority_checked_at"] = patch.authorityCheckedAt;
  if (patch.trafficCheckedAt !== undefined) row["traffic_checked_at"] = patch.trafficCheckedAt;
  if (patch.rawData !== undefined) row["raw_data"] = patch.rawData;

  const { error } = await supabase
    .from("global_domain_cache")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(row as any, { onConflict: "normalized_domain" });

  if (error) console.error("[cache.service] upsertDomainCache", error.message);
}

/* -------------------------------------------------------------------------- */
/* keyword_metrics_cache                                                       */
/* -------------------------------------------------------------------------- */

export async function lookupKeywordMetricsCache(
  keyword: string,
  country?: string,
  language?: string,
): Promise<{ hit: boolean; fresh: boolean; result: KeywordMetricsResult | null }> {
  const normalized_keyword = normalizeKeyword(keyword);
  const countryCode = normalizeCountry(country);
  const languageCode = normalizeLanguage(language);
  const supabase = await db();

  const { data, error } = await supabase
    .from("keyword_metrics_cache")
    .select("*")
    .eq("normalized_keyword", normalized_keyword)
    .eq("country", countryCode)
    .eq("language", languageCode)
    .maybeSingle();

  if (error) console.error("[cache.service] lookupKeywordMetricsCache", error.message);
  if (!data) return { hit: false, fresh: false, result: null };

  return {
    hit: true,
    fresh: freshness.keywordMetrics(data.checked_at),
    result: {
      keyword: data.keyword,
      normalizedKeyword: data.normalized_keyword,
      country: data.country,
      language: (data as { language?: string }).language ?? languageCode,
      searchVolume: toNumberOrNull(data.search_volume),
      keywordDifficulty: toNumberOrNull(data.keyword_difficulty),
      cpc: toNumberOrNull(data.cpc),
      trafficPotential: toNumberOrNull(data.traffic_potential),
      provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
      source: "cache",
      checkedAt: data.checked_at,
      error: null,
    },
  };
}

export async function upsertKeywordMetricsCache(result: KeywordMetricsResult): Promise<void> {
  const supabase = await db();
  const row = {
    keyword: result.keyword,
    normalized_keyword: normalizeKeyword(result.keyword),
    country: normalizeCountry(result.country),
    language: normalizeLanguage(result.language),
    search_volume: result.searchVolume,
    keyword_difficulty: result.keywordDifficulty,
    cpc: result.cpc,
    traffic_potential: result.trafficPotential,
    provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
    checked_at: result.checkedAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("keyword_metrics_cache")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(row as any, { onConflict: "normalized_keyword,country,language" });

  if (error) console.error("[cache.service] upsertKeywordMetricsCache", error.message);
}

/* -------------------------------------------------------------------------- */
/* keyword_rank_cache                                                          */
/* -------------------------------------------------------------------------- */

export async function lookupKeywordRankCache(
  targetDomain: string,
  keyword: string,
  country?: string,
  language?: string,
): Promise<{ hit: boolean; fresh: boolean; result: KeywordRankResult | null }> {
  const target_domain = normalizeDomain(targetDomain);
  const normalized_keyword = normalizeKeyword(keyword);
  const countryCode = normalizeCountry(country);
  const languageCode = normalizeLanguage(language);
  const supabase = await db();

  const { data, error } = await supabase
    .from("keyword_rank_cache")
    .select("*")
    .eq("target_domain", target_domain)
    .eq("normalized_keyword", normalized_keyword)
    .eq("country", countryCode)
    .eq("language", languageCode)
    .maybeSingle();

  if (error) console.error("[cache.service] lookupKeywordRankCache", error.message);
  if (!data) return { hit: false, fresh: false, result: null };

  return {
    hit: true,
    fresh: freshness.keywordRank(data.checked_at),
    result: {
      targetDomain: data.target_domain,
      keyword: data.keyword,
      normalizedKeyword: data.normalized_keyword,
      country: data.country,
      language: (data as { language?: string }).language ?? languageCode,
      position: toNumberOrNull(data.position),
      rankingUrl: data.ranking_url,
      rankingTitle: data.ranking_title,
      traffic: toNumberOrNull(data.traffic),
      dr: toNumberOrNull(data.dr),
      ur: toNumberOrNull(data.ur),
      provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
      source: "cache",
      checkedAt: data.checked_at,
      error: null,
    },
  };
}

export async function upsertKeywordRankCache(result: KeywordRankResult): Promise<void> {
  const supabase = await db();
  const row = {
    target_domain: normalizeDomain(result.targetDomain),
    keyword: result.keyword,
    normalized_keyword: normalizeKeyword(result.keyword),
    country: normalizeCountry(result.country),
    language: normalizeLanguage(result.language),
    position: result.position,
    ranking_url: result.rankingUrl,
    ranking_title: result.rankingTitle,
    traffic: result.traffic,
    dr: result.dr,
    ur: result.ur,
    provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
    checked_at: result.checkedAt ?? new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("keyword_rank_cache")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .upsert(row as any, { onConflict: "target_domain,normalized_keyword,country,language" });

  if (error) console.error("[cache.service] upsertKeywordRankCache", error.message);
}

/* -------------------------------------------------------------------------- */
/* seo_research_runs                                                           */
/* -------------------------------------------------------------------------- */

export async function logResearchRun(run: SeoResearchRun): Promise<void> {
  const supabase = await db();
  const { error } = await supabase.from("seo_research_runs").insert({
    provider: run.provider,
    search_type: run.searchType,
    query: run.query,
    cache_hit: run.cacheHit,
    status: run.status,
    result_count: run.resultCount,
    error: run.error,
    duration_ms: run.durationMs,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any);

  if (error) console.error("[cache.service] logResearchRun", error.message);
}
