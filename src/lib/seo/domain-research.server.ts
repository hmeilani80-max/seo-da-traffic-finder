/**
 * Phase 3 — Domain Research (server-only).
 *
 * Flow: normalisasi domain → cek cache → pakai cache yang masih fresh →
 * ambil HANYA metrik yang hilang/stale → update cache → kembalikan hasil
 * ternormalisasi.
 *
 * Tidak menyentuh tabel operasional (sudah_dibeli, traffic_nol,
 * domain_sudah_pernah, check_logs) dan tidak mengubah workflow legacy.
 */

import { normalizeDomainResearch, runAhrefs } from "./ahrefs.provider";
import {
  logResearchRun,
  lookupDomainCache,
  normalizeCountry,
  normalizeDomain,
  upsertDomainCache,
} from "./cache.service";
import {
  SEO_PROVIDER_AHREFS_ALL_IN_ONE,
  type DomainResearchResult,
  type SeoDataSource,
} from "./types";

export type DomainResearchReport = DomainResearchResult & {
  /** Asal tiap metrik agar UI bisa menampilkan status cache/fresh per field. */
  authoritySource: SeoDataSource;
  trafficSource: SeoDataSource;
  /** true bila tidak ada pemanggilan Actor sama sekali. */
  fullyCached: boolean;
  lastCheckedAt: string | null;
};

function latest(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return Date.parse(a) >= Date.parse(b) ? a : b;
}

export async function researchDomain(input: {
  domain: string;
  country?: string;
  forceRefresh?: boolean;
}): Promise<DomainResearchReport> {
  const domain = normalizeDomain(input.domain);
  const country = normalizeCountry(input.country);
  const force = Boolean(input.forceRefresh);

  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return {
      domain: input.domain,
      normalizedDomain: domain,
      dr: null,
      traffic: null,
      backlinks: null,
      referringDomains: null,
      topKeywords: [],
      topPages: [],
      provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
      source: "fresh",
      authorityCheckedAt: null,
      trafficCheckedAt: null,
      error: "Domain tidak valid",
      authoritySource: "fresh",
      trafficSource: "fresh",
      fullyCached: false,
      lastCheckedAt: null,
    };
  }

  const cached = await lookupDomainCache(domain);
  const useCachedAuthority = !force && cached.hit && cached.authorityFresh;
  const useCachedTraffic = !force && cached.hit && cached.trafficFresh;

  let dr = useCachedAuthority ? (cached.result?.dr ?? null) : null;
  let backlinks = useCachedAuthority ? (cached.result?.backlinks ?? null) : null;
  let referringDomains = useCachedAuthority ? (cached.result?.referringDomains ?? null) : null;
  let traffic = useCachedTraffic ? (cached.result?.traffic ?? null) : null;
  let authorityCheckedAt = useCachedAuthority ? (cached.result?.authorityCheckedAt ?? null) : null;
  let trafficCheckedAt = useCachedTraffic ? (cached.result?.trafficCheckedAt ?? null) : null;
  let topKeywords = cached.result?.topKeywords ?? [];
  let topPages = cached.result?.topPages ?? [];
  let error: string | null = null;

  const patch: Parameters<typeof upsertDomainCache>[1] = {};

  if (!useCachedAuthority) {
    const run = await runAhrefs({
      searchType: "website_authority",
      urls: [domain],
      mode: "subdomains",
      country,
    });
    const norm = normalizeDomainResearch(domain, run.items, run.error);
    await logResearchRun({
      provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
      searchType: "website_authority",
      query: domain,
      cacheHit: false,
      status: run.error ? "gagal" : "ok",
      resultCount: run.items.length,
      error: run.error,
      durationMs: run.durationMs,
    });

    if (run.error) {
      error = error ?? run.error;
      // Jatuhkan ke cache stale bila ada, jangan buat data palsu.
      dr = cached.result?.dr ?? null;
      backlinks = cached.result?.backlinks ?? null;
      referringDomains = cached.result?.referringDomains ?? null;
      authorityCheckedAt = cached.result?.authorityCheckedAt ?? null;
    } else {
      dr = norm.dr;
      backlinks = norm.backlinks;
      referringDomains = norm.referringDomains;
      authorityCheckedAt = norm.authorityCheckedAt ?? new Date().toISOString();
      if (norm.topKeywords.length) topKeywords = norm.topKeywords;
      if (norm.topPages.length) topPages = norm.topPages;
      patch.dr = dr;
      patch.backlinks = backlinks;
      patch.referringDomains = referringDomains;
      patch.authorityCheckedAt = authorityCheckedAt;
      if (norm.topKeywords.length) patch.topKeywords = norm.topKeywords;
      if (norm.topPages.length) patch.topPages = norm.topPages;
    }
  }

  if (!useCachedTraffic) {
    const run = await runAhrefs({
      searchType: "traffic_overview",
      urls: [domain],
      mode: "subdomains",
      country,
    });
    const norm = normalizeDomainResearch(domain, run.items, run.error);
    await logResearchRun({
      provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
      searchType: "traffic_overview",
      query: domain,
      cacheHit: false,
      status: run.error ? "gagal" : "ok",
      resultCount: run.items.length,
      error: run.error,
      durationMs: run.durationMs,
    });

    if (run.error) {
      error = error ?? run.error;
      traffic = cached.result?.traffic ?? null;
      trafficCheckedAt = cached.result?.trafficCheckedAt ?? null;
    } else {
      traffic = norm.traffic;
      trafficCheckedAt = norm.trafficCheckedAt ?? new Date().toISOString();
      patch.traffic = traffic;
      patch.trafficCheckedAt = trafficCheckedAt;
      if (!patch.topKeywords && norm.topKeywords.length) patch.topKeywords = norm.topKeywords;
      if (!patch.topPages && norm.topPages.length) patch.topPages = norm.topPages;
    }
  }

  if (Object.keys(patch).length > 0) {
    await upsertDomainCache(domain, patch);
  }

  const fullyCached = useCachedAuthority && useCachedTraffic;

  return {
    domain,
    normalizedDomain: domain,
    dr,
    traffic,
    backlinks,
    referringDomains,
    topKeywords,
    topPages,
    provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
    source: fullyCached ? "cache" : "fresh",
    authorityCheckedAt,
    trafficCheckedAt,
    error,
    authoritySource: useCachedAuthority ? "cache" : "fresh",
    trafficSource: useCachedTraffic ? "cache" : "fresh",
    fullyCached,
    lastCheckedAt: latest(authorityCheckedAt, trafficCheckedAt),
  };
}

export async function researchDomains(input: {
  domains: string[];
  country?: string;
  forceRefresh?: boolean;
}): Promise<DomainResearchReport[]> {
  const unique = Array.from(
    new Set(input.domains.map((d) => normalizeDomain(d)).filter(Boolean)),
  );

  const results: DomainResearchReport[] = [];
  // Sekuensial: menghindari beban paralel ke Actor berbayar.
  for (const domain of unique) {
    results.push(
      await researchDomain({
        domain,
        ...(input.country !== undefined ? { country: input.country } : {}),
        ...(input.forceRefresh !== undefined ? { forceRefresh: input.forceRefresh } : {}),
      }),
    );
  }
  return results;
}
