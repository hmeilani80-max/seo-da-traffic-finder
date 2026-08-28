/**
 * Provider SEO generik (server-side only) — Phase 1.
 *
 * Satu-satunya pintu masuk ke Apify Actor `pro100chok/ahrefs-seo-tools`.
 * Tidak boleh diimport dari komponen UI; token Apify hanya dibaca di server.
 *
 * Provider ini BELUM dipakai produksi. Integrasi legacy
 * (OpenSEO, radeance/ahrefs-scraper, burbn/ahrefs-keyword-explorer)
 * tetap aktif sampai parity test selesai (Phase 2).
 */

import {
  DEFAULT_COUNTRY,
  SEO_PROVIDER_AHREFS_ALL_IN_ONE,
  type AhrefsSearchType,
  type DomainResearchResult,
  type KeywordMetricsResult,
  type KeywordRankResult,
  type SeoTopKeyword,
  type SeoTopPage,
} from "./types";
import { normalizeDomain, normalizeKeyword } from "./cache.service";

export const AHREFS_ACTOR_ID = "pro100chok~ahrefs-seo-tools";

const APIFY_BASE = "https://api.apify.com/v2";

export type RunAhrefsInput = {
  searchType: AhrefsSearchType;
  urls?: string[];
  keyword?: string;
  country?: string;
  /** exact | subdomains | prefix | domain */
  mode?: "exact" | "subdomains" | "prefix" | "domain";
  additionalOptions?: Record<string, unknown>;
  /** Timeout run-sync dalam detik. */
  timeoutSecs?: number;
};

export type RunAhrefsResult = {
  items: RawAhrefsItem[];
  durationMs: number;
  error: string | null;
};

/** Bentuk longgar item dataset Actor — TIDAK boleh keluar dari folder ini. */
type RawAhrefsItem = Record<string, unknown>;

function getApifyToken(): string | null {
  return process.env["APIFY_TOKEN"] ?? process.env["APIFY_API_KEY"] ?? null;
}

export function isAhrefsProviderConfigured(): boolean {
  return Boolean(getApifyToken());
}

/**
 * Panggilan generik ke Actor. Hanya searchType yang dibutuhkan task
 * yang boleh dipanggil — jangan meminta semua metrik sekaligus.
 */
export async function runAhrefs(input: RunAhrefsInput): Promise<RunAhrefsResult> {
  const started = Date.now();
  const token = getApifyToken();

  if (!token) {
    return {
      items: [],
      durationMs: 0,
      error:
        "APIFY_API_KEY belum tersedia di server. Set secret Apify terlebih dahulu sebelum memakai provider ini.",
    };
  }

  const body: Record<string, unknown> = {
    searchType: input.searchType,
    country: (input.country ?? DEFAULT_COUNTRY).toLowerCase(),
    ...(input.urls?.length ? { urls: input.urls } : {}),
    ...(input.keyword ? { keyword: input.keyword } : {}),
    ...(input.mode ? { mode: input.mode } : {}),
    ...(input.additionalOptions ?? {}),
  };

  const timeout = input.timeoutSecs ?? 180;

  try {
    const res = await fetch(
      `${APIFY_BASE}/acts/${AHREFS_ACTOR_ID}/run-sync-get-dataset-items?timeout=${timeout}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error(`[ahrefs.provider] ${input.searchType} gagal [${res.status}]: ${text.slice(0, 400)}`);
      return {
        items: [],
        durationMs: Date.now() - started,
        error: `Apify error ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const json = (await res.json()) as unknown;
    const items = Array.isArray(json) ? (json as RawAhrefsItem[]) : [];

    return { items, durationMs: Date.now() - started, error: null };
  } catch (e) {
    console.error("[ahrefs.provider] exception", e);
    return {
      items: [],
      durationMs: Date.now() - started,
      error: e instanceof Error ? e.message : "Gagal menghubungi Apify",
    };
  }
}

/* -------------------------------------------------------------------------- */
/* Normalisasi respons mentah -> tipe internal                                 */
/* -------------------------------------------------------------------------- */

function toNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = typeof value === "number" ? value : Number(String(value).replace(/[,\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Ambil nilai pertama yang bukan null dari beberapa kandidat path (dot-notation). */
function pick(item: RawAhrefsItem, paths: string[]): unknown {
  for (const path of paths) {
    let current: unknown = item;
    for (const segment of path.split(".")) {
      if (!isRecord(current)) {
        current = undefined;
        break;
      }
      current = current[segment];
    }
    if (current !== undefined && current !== null && current !== "") return current;
  }
  return null;
}

function pickNumber(items: RawAhrefsItem[], paths: string[]): number | null {
  for (const item of items) {
    const value = toNumber(pick(item, paths));
    if (value !== null) return value;
  }
  return null;
}

function pickText(items: RawAhrefsItem[], paths: string[]): string | null {
  for (const item of items) {
    const value = toText(pick(item, paths));
    if (value !== null) return value;
  }
  return null;
}

function pickArray(items: RawAhrefsItem[], paths: string[]): unknown[] {
  for (const item of items) {
    const value = pick(item, paths);
    if (Array.isArray(value) && value.length) return value;
  }
  return [];
}

export function normalizeDomainResearch(
  domain: string,
  items: RawAhrefsItem[],
  error: string | null = null,
): DomainResearchResult {
  const nowIso = new Date().toISOString();

  const dr = pickNumber(items, [
    "domain_rating",
    "domainRating",
    "dr",
    "website_authority.domainRating",
    "websiteAuthority.domainRating",
    "data.domainRating",
  ]);

  const traffic = pickNumber(items, [
    "trafficMonthlyAvg",
    "searchTraffic",
    "organic_traffic",
    "organicTraffic",
    "traffic",
    "website_traffic.trafficMonthlyAvg",
    "websiteTraffic.trafficMonthlyAvg",
    "traffic_overview.traffic",
    "data.traffic",
  ]);

  const backlinks = pickNumber(items, [
    "backlinks",
    "backlinks_count",
    "backlinksCount",
    "website_authority.backlinks",
    "data.backlinks",
  ]);

  const referringDomains = pickNumber(items, [
    "refdomains",
    "referring_domains",
    "referringDomains",
    "linkingWebsites",
    "website_authority.referringDomains",
    "data.referringDomains",
  ]);

  const topKeywords: SeoTopKeyword[] = pickArray(items, [
    "top_keywords",
    "topKeywords",
    "keywords",
  ])
    .filter(isRecord)
    .map((row) => ({
      keyword: toText(pick(row, ["keyword", "query", "name"])) ?? "",
      position: toNumber(pick(row, ["position", "rank"])),
      volume: toNumber(pick(row, ["volume", "searchVolume", "search_volume"])),
      traffic: toNumber(pick(row, ["traffic", "organicTraffic"])),
    }))
    .filter((row) => row.keyword.length > 0);

  const topPages: SeoTopPage[] = pickArray(items, ["top_pages", "topPages", "pages"])
    .filter(isRecord)
    .map((row) => ({
      url: toText(pick(row, ["url", "page", "link"])) ?? "",
      traffic: toNumber(pick(row, ["traffic", "organicTraffic"])),
      keywords: toNumber(pick(row, ["keywords", "keywordsCount", "keywords_count"])),
    }))
    .filter((row) => row.url.length > 0);

  return {
    domain,
    normalizedDomain: normalizeDomain(domain),
    dr,
    traffic,
    backlinks,
    referringDomains,
    topKeywords,
    topPages,
    provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
    source: "fresh",
    authorityCheckedAt: dr !== null ? nowIso : null,
    trafficCheckedAt: traffic !== null ? nowIso : null,
    error,
  };
}

export function normalizeKeywordMetrics(
  keyword: string,
  country: string,
  items: RawAhrefsItem[],
  error: string | null = null,
): KeywordMetricsResult {
  return {
    keyword,
    normalizedKeyword: normalizeKeyword(keyword),
    country: country.toLowerCase(),
    searchVolume: pickNumber(items, [
      "search_volume",
      "searchVolume",
      "volume",
      "metrics.searchVolume",
    ]),
    keywordDifficulty: pickNumber(items, [
      "keyword_difficulty",
      "keywordDifficulty",
      "difficulty",
      "kd",
      "metrics.difficulty",
    ]),
    cpc: pickNumber(items, ["cpc", "metrics.cpc"]),
    trafficPotential: pickNumber(items, [
      "traffic_potential",
      "trafficPotential",
      "metrics.trafficPotential",
    ]),
    provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
    source: "fresh",
    checkedAt: new Date().toISOString(),
    error,
  };
}

export function normalizeKeywordRank(
  targetDomain: string,
  keyword: string,
  country: string,
  items: RawAhrefsItem[],
  error: string | null = null,
): KeywordRankResult {
  return {
    targetDomain: normalizeDomain(targetDomain),
    keyword,
    normalizedKeyword: normalizeKeyword(keyword),
    country: country.toLowerCase(),
    position: pickNumber(items, ["position", "rank", "serp_position", "serpPosition"]),
    rankingUrl: pickText(items, ["ranking_url", "rankingUrl", "url", "page"]),
    rankingTitle: pickText(items, ["ranking_title", "rankingTitle", "title"]),
    traffic: pickNumber(items, ["traffic", "organicTraffic", "organic_traffic"]),
    dr: pickNumber(items, ["dr", "domain_rating", "domainRating"]),
    ur: pickNumber(items, ["ur", "url_rating", "urlRating"]),
    provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
    source: "fresh",
    checkedAt: new Date().toISOString(),
    error,
  };
}
