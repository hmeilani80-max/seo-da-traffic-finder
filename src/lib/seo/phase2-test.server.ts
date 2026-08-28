/**
 * Utility test internal Phase 2 (server-only, sementara).
 *
 * Menguji kemampuan Actor `pro100chok/ahrefs-seo-tools` melalui
 * provider generik `ahrefs.provider.ts` untuk SATU domain dan SATU keyword.
 *
 * Tidak menyentuh tabel operasional (sudah_dibeli, traffic_nol,
 * domain_sudah_pernah, check_logs). Hanya menulis ke tabel cache/log SEO.
 */

import {
  normalizeDomainResearch,
  normalizeKeywordMetrics,
  normalizeKeywordRank,
  runAhrefs,
} from "./ahrefs.provider";
import {
  logResearchRun,
  normalizeCountry,
  normalizeDomain,
  normalizeKeyword,
  upsertDomainCache,
  upsertKeywordMetricsCache,
  upsertKeywordRankCache,
} from "./cache.service";
import { SEO_PROVIDER_AHREFS_ALL_IN_ONE, type AhrefsSearchType } from "./types";

export type Phase2FieldReport = {
  field: string;
  value: string | number | null;
  searchType: AhrefsSearchType | null;
  status: "ok" | "kosong" | "gagal";
};

export type Phase2StepReport = {
  searchType: AhrefsSearchType;
  status: "ok" | "gagal";
  itemCount: number;
  durationMs: number;
  error: string | null;
};

export type Phase2TestResult = {
  domain: string;
  keyword: string;
  country: string;
  steps: Phase2StepReport[];
  fields: Phase2FieldReport[];
  normalized: {
    domainResearch: ReturnType<typeof normalizeDomainResearch>;
    keywordMetrics: ReturnType<typeof normalizeKeywordMetrics>;
    keywordRank: ReturnType<typeof normalizeKeywordRank>;
  };
  cacheWritten: string[];
  startedAt: string;
  finishedAt: string;
};

function fieldReport(
  field: string,
  value: string | number | null,
  searchType: AhrefsSearchType,
  failed: boolean,
): Phase2FieldReport {
  return {
    field,
    value,
    searchType,
    status: failed ? "gagal" : value === null || value === "" ? "kosong" : "ok",
  };
}

export async function runPhase2Test(input: {
  domain: string;
  keyword: string;
  country?: string;
}): Promise<Phase2TestResult> {
  const domain = normalizeDomain(input.domain);
  const keyword = normalizeKeyword(input.keyword);
  const country = normalizeCountry(input.country);
  const startedAt = new Date().toISOString();

  const steps: Phase2StepReport[] = [];
  const cacheWritten: string[] = [];

  async function step(
    searchType: AhrefsSearchType,
    payload: Parameters<typeof runAhrefs>[0],
    query: string,
  ) {
    const run = await runAhrefs(payload);
    steps.push({
      searchType,
      status: run.error ? "gagal" : "ok",
      itemCount: run.items.length,
      durationMs: run.durationMs,
      error: run.error,
    });
    await logResearchRun({
      provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
      searchType,
      query,
      cacheHit: false,
      status: run.error ? "gagal" : "ok",
      resultCount: run.items.length,
      error: run.error,
      durationMs: run.durationMs,
    });
    return run;
  }

  // 1. DR + backlinks -> website_authority
  const authority = await step(
    "website_authority",
    { searchType: "website_authority", urls: [domain], mode: "subdomains", country },
    domain,
  );

  // 2. Organic traffic -> traffic_overview
  const traffic = await step(
    "traffic_overview",
    { searchType: "traffic_overview", urls: [domain], mode: "subdomains", country },
    domain,
  );

  // 3. Search volume + KD -> keyword_metrics
  const metrics = await step(
    "keyword_metrics",
    { searchType: "keyword_metrics", keyword, country },
    keyword,
  );

  // 4. KD fallback -> keyword_difficulty
  const kd = await step(
    "keyword_difficulty",
    { searchType: "keyword_difficulty", keyword, country },
    keyword,
  );

  // 5. Rank + ranking URL -> keyword_rank
  const rank = await step(
    "keyword_rank",
    { searchType: "keyword_rank", urls: [domain], keyword, country },
    `${domain} | ${keyword}`,
  );

  const authorityNorm = normalizeDomainResearch(domain, authority.items, authority.error);
  const trafficNorm = normalizeDomainResearch(domain, traffic.items, traffic.error);
  const metricsNorm = normalizeKeywordMetrics(keyword, country, metrics.items, metrics.error);
  const kdNorm = normalizeKeywordMetrics(keyword, country, kd.items, kd.error);
  const rankNorm = normalizeKeywordRank(domain, keyword, country, rank.items, rank.error);

  const domainResearch = {
    ...authorityNorm,
    traffic: trafficNorm.traffic ?? authorityNorm.traffic,
    trafficCheckedAt: trafficNorm.trafficCheckedAt ?? authorityNorm.trafficCheckedAt,
    topKeywords: authorityNorm.topKeywords.length ? authorityNorm.topKeywords : trafficNorm.topKeywords,
    topPages: authorityNorm.topPages.length ? authorityNorm.topPages : trafficNorm.topPages,
    error: authorityNorm.error ?? trafficNorm.error,
  };

  const keywordMetrics = {
    ...metricsNorm,
    keywordDifficulty: metricsNorm.keywordDifficulty ?? kdNorm.keywordDifficulty,
    error: metricsNorm.error ?? kdNorm.error,
  };

  const fields: Phase2FieldReport[] = [
    fieldReport("DR", domainResearch.dr, "website_authority", Boolean(authority.error)),
    fieldReport("Organic Traffic", domainResearch.traffic, "traffic_overview", Boolean(traffic.error)),
    fieldReport("Search Volume", keywordMetrics.searchVolume, "keyword_metrics", Boolean(metrics.error)),
    fieldReport(
      "KD",
      keywordMetrics.keywordDifficulty,
      metricsNorm.keywordDifficulty !== null ? "keyword_metrics" : "keyword_difficulty",
      Boolean(metrics.error) && Boolean(kd.error),
    ),
    fieldReport("Current Rank", rankNorm.position, "keyword_rank", Boolean(rank.error)),
    fieldReport("Ranking URL", rankNorm.rankingUrl, "keyword_rank", Boolean(rank.error)),
  ];

  // Tulis hanya ke tabel cache SEO (bukan tabel operasional).
  if (domainResearch.dr !== null || domainResearch.traffic !== null) {
    await upsertDomainCache(domain, {
      dr: domainResearch.dr,
      traffic: domainResearch.traffic,
      backlinks: domainResearch.backlinks,
      referringDomains: domainResearch.referringDomains,
      topKeywords: domainResearch.topKeywords,
      topPages: domainResearch.topPages,
      authorityCheckedAt: domainResearch.authorityCheckedAt,
      trafficCheckedAt: domainResearch.trafficCheckedAt,
    });
    cacheWritten.push("global_domain_cache");
  }

  if (keywordMetrics.searchVolume !== null || keywordMetrics.keywordDifficulty !== null) {
    await upsertKeywordMetricsCache(keywordMetrics);
    cacheWritten.push("keyword_metrics_cache");
  }

  if (rankNorm.position !== null || rankNorm.rankingUrl !== null) {
    await upsertKeywordRankCache(rankNorm);
    cacheWritten.push("keyword_rank_cache");
  }

  return {
    domain,
    keyword,
    country,
    steps,
    fields,
    normalized: { domainResearch, keywordMetrics, keywordRank: rankNorm },
    cacheWritten,
    startedAt,
    finishedAt: new Date().toISOString(),
  };
}
