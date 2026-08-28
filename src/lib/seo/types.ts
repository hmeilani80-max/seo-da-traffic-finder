/**
 * Tipe internal SEO (Phase 1).
 *
 * Semua konsumen aplikasi HANYA boleh bergantung pada tipe di file ini —
 * struktur mentah dari Apify Actor tidak boleh bocor ke service/UI lain.
 */

export const SEO_PROVIDER_AHREFS_ALL_IN_ONE = "ahrefs_all_in_one" as const;

export type SeoProviderId = typeof SEO_PROVIDER_AHREFS_ALL_IN_ONE;

/** searchType yang didukung Actor pro100chok/ahrefs-seo-tools. */
export type AhrefsSearchType =
  | "website_authority"
  | "backlinks_overview"
  | "backlinks_list"
  | "broken_links"
  | "traffic_overview"
  | "ai_visibility"
  | "ai_mode_tracker"
  | "ai_overviews_tracker"
  | "sitemap"
  | "website_details"
  | "keyword_ideas"
  | "keyword_difficulty"
  | "keyword_metrics"
  | "keyword_rank"
  | "serp_overview"
  | "top_websites";

export type SeoDataSource = "cache" | "fresh";

/** Hasil riset domain yang sudah dinormalisasi. */
export type DomainResearchResult = {
  domain: string;
  normalizedDomain: string;
  dr: number | null;
  traffic: number | null;
  backlinks: number | null;
  referringDomains: number | null;
  topKeywords: SeoTopKeyword[];
  topPages: SeoTopPage[];
  provider: SeoProviderId;
  source: SeoDataSource;
  authorityCheckedAt: string | null;
  trafficCheckedAt: string | null;
  error: string | null;
};

export type SeoTopKeyword = {
  keyword: string;
  position: number | null;
  volume: number | null;
  traffic: number | null;
};

export type SeoTopPage = {
  url: string;
  traffic: number | null;
  keywords: number | null;
};

/** Metrik keyword yang sudah dinormalisasi. */
export type KeywordMetricsResult = {
  keyword: string;
  normalizedKeyword: string;
  country: string;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  cpc: number | null;
  trafficPotential: number | null;
  provider: SeoProviderId;
  source: SeoDataSource;
  checkedAt: string | null;
  error: string | null;
};

/** Posisi ranking sebuah domain untuk satu keyword. */
export type KeywordRankResult = {
  targetDomain: string;
  keyword: string;
  normalizedKeyword: string;
  country: string;
  position: number | null;
  rankingUrl: string | null;
  rankingTitle: string | null;
  traffic: number | null;
  dr: number | null;
  ur: number | null;
  provider: SeoProviderId;
  source: SeoDataSource;
  checkedAt: string | null;
  error: string | null;
};

/** Satu baris log eksekusi riset SEO. */
export type SeoResearchRun = {
  id?: string;
  provider: SeoProviderId;
  searchType: AhrefsSearchType | string;
  query: string | null;
  cacheHit: boolean;
  status: "ok" | "gagal";
  resultCount: number | null;
  error: string | null;
  durationMs: number | null;
  createdAt?: string;
};

/** Default TTL cache (hari) sesuai docs/SEO_ARCHITECTURE.md. */
export const CACHE_TTL_DAYS = {
  domainAuthority: 30,
  domainTraffic: 14,
  keywordMetrics: 30,
  keywordRank: 7,
} as const;

export const DEFAULT_COUNTRY = "id";

/** Satu ide keyword hasil searchType `keyword_ideas` (belum di-enrich metrik). */
export type KeywordIdea = {
  keyword: string;
  normalizedKeyword: string;
  searchVolume: number | null;
  keywordDifficulty: number | null;
  cpc: number | null;
  trafficPotential: number | null;
};
