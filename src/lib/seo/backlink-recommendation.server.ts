/**
 * Phase 6 — Backlink Recommendation (server-only).
 *
 * Pipeline:
 *   Source Domain Profile → Target Domain Profile
 *   → OpenAI menghasilkan 8-12 kandidat semantik
 *   → deduplikasi kandidat
 *   → cek keyword cache → ambil metrik keyword yang hilang
 *   → cek rank cache → ambil rank yang hilang
 *   → OpenAI merangking kandidat yang sudah di-enrich
 *   → kembalikan Top 5
 *
 * Aturan:
 * - OpenAI hanya bernalar soal relevansi. Semua metrik SEO berasal dari Ahrefs/cache.
 * - Kombinasi Keyword + Target URL yang sudah pernah dipakai diberi penalti.
 * - Tidak ada penulisan otomatis ke tabel operasional; user harus memilih sendiri.
 */

import { normalizeKeywordRank, runAhrefs } from "./ahrefs.provider";
import {
  logResearchRun,
  lookupKeywordRankCache,
  normalizeCountry,
  normalizeDomain,
  normalizeKeyword,
  upsertKeywordRankCache,
} from "./cache.service";
import { researchDomain, type DomainResearchReport } from "./domain-research.server";
import { researchKeywords } from "./keyword-research.server";
import { openAiJson } from "./openai.server";
import {
  SEO_PROVIDER_AHREFS_ALL_IN_ONE,
  type KeywordMetricsResult,
  type KeywordRankResult,
} from "./types";

export type BacklinkCandidate = {
  keyword: string;
  normalizedKeyword: string;
  targetUrl: string;
  anchorText: string;
  reason: string;
  /** Metrik faktual (Ahrefs/cache) — tidak pernah dibuat oleh AI. */
  searchVolume: number | null;
  keywordDifficulty: number | null;
  cpc: number | null;
  trafficPotential: number | null;
  currentPosition: number | null;
  rankingUrl: string | null;
  /** true bila kombinasi keyword + target URL sudah pernah dipakai. */
  repeated: boolean;
  score: number | null;
};

export type BacklinkRecommendationResult = {
  sourceDomain: string;
  targetDomain: string;
  country: string;
  sourceProfile: DomainResearchReport | null;
  targetProfile: DomainResearchReport | null;
  candidates: BacklinkCandidate[];
  recommendations: BacklinkCandidate[];
  previousPlacementCount: number;
  error: string | null;
};

const MAX_CANDIDATES = 12;
const MIN_CANDIDATES = 8;
const TOP_N = 5;

function normalizeUrl(input: string): string {
  return String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/[?#].*$/, "")
    .replace(/\/$/, "");
}

async function db() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Riwayat placement milik user (untuk penalti pengulangan). */
async function loadPreviousPlacements(userId: string): Promise<Set<string>> {
  const supabase = await db();
  const keys = new Set<string>();

  const [orders, legacy] = await Promise.all([
    supabase
      .from("placement_orders")
      .select("keyword, target_url")
      .eq("user_id", userId),
    supabase.from("sudah_dibeli").select("keyword, target_page").eq("user_id", userId),
  ]);

  for (const row of orders.data ?? []) {
    if (!row.keyword) continue;
    keys.add(`${normalizeKeyword(row.keyword)}|${normalizeUrl(row.target_url ?? "")}`);
  }
  for (const row of (legacy.data ?? []) as { keyword: string | null; target_page: string | null }[]) {
    if (!row.keyword) continue;
    keys.add(`${normalizeKeyword(row.keyword)}|${normalizeUrl(row.target_page ?? "")}`);
  }

  return keys;
}

type AiCandidate = {
  keyword?: unknown;
  target_url?: unknown;
  anchor_text?: unknown;
  reason?: unknown;
};

async function generateCandidates(input: {
  sourceProfile: DomainResearchReport | null;
  targetProfile: DomainResearchReport | null;
  targetDomain: string;
  previousKeys: Set<string>;
}): Promise<{ candidates: BacklinkCandidate[]; error: string | null }> {
  const targetPages = (input.targetProfile?.topPages ?? []).slice(0, 15);
  const targetKeywords = (input.targetProfile?.topKeywords ?? []).slice(0, 20);
  const sourceKeywords = (input.sourceProfile?.topKeywords ?? []).slice(0, 20);

  const system = [
    "Kamu adalah ahli SEO yang menyusun kandidat penempatan backlink.",
    "Kamu HANYA boleh bernalar tentang relevansi semantik antara domain sumber dan halaman target.",
    "DILARANG KERAS mengarang metrik SEO apa pun (DR, traffic, search volume, KD, CPC, posisi SERP).",
    `Kembalikan JSON: {"candidates":[{"keyword":"...","target_url":"...","anchor_text":"...","reason":"..."}]} berisi ${MIN_CANDIDATES}-${MAX_CANDIDATES} kandidat.`,
    "target_url wajib memakai URL nyata dari daftar halaman target bila tersedia; jika kosong pakai https://<domain target>/.",
    "Gunakan bahasa Indonesia untuk keyword, anchor text, dan alasan.",
  ].join(" ");

  const user = JSON.stringify({
    domain_sumber: input.sourceProfile?.normalizedDomain,
    keyword_teratas_sumber: sourceKeywords,
    domain_target: input.targetDomain,
    halaman_target: targetPages,
    keyword_teratas_target: targetKeywords,
    kombinasi_yang_sudah_dipakai: Array.from(input.previousKeys).slice(0, 50),
  });

  const ai = await openAiJson<{ candidates?: AiCandidate[] }>({ system, user });
  if (ai.error || !ai.data) {
    return { candidates: [], error: ai.error ?? "OpenAI tidak mengembalikan kandidat" };
  }

  const seen = new Set<string>();
  const candidates: BacklinkCandidate[] = [];

  for (const raw of ai.data.candidates ?? []) {
    const keyword = String(raw.keyword ?? "").trim();
    if (!keyword) continue;
    const targetUrl =
      String(raw.target_url ?? "").trim() || `https://${input.targetDomain}/`;
    const key = `${normalizeKeyword(keyword)}|${normalizeUrl(targetUrl)}`;
    if (seen.has(key)) continue;
    seen.add(key);

    candidates.push({
      keyword,
      normalizedKeyword: normalizeKeyword(keyword),
      targetUrl,
      anchorText: String(raw.anchor_text ?? keyword).trim(),
      reason: String(raw.reason ?? "").trim(),
      searchVolume: null,
      keywordDifficulty: null,
      cpc: null,
      trafficPotential: null,
      currentPosition: null,
      rankingUrl: null,
      repeated: input.previousKeys.has(key),
      score: null,
    });

    if (candidates.length >= MAX_CANDIDATES) break;
  }

  return { candidates, error: null };
}

/** Rank untuk satu keyword — cache-first (TTL 7 hari). */
async function resolveRank(
  targetDomain: string,
  keyword: string,
  country: string,
): Promise<KeywordRankResult | null> {
  const cached = await lookupKeywordRankCache(targetDomain, keyword, country);
  if (cached.hit && cached.fresh && cached.result) return cached.result;

  const run = await runAhrefs({
    searchType: "keyword_rank",
    urls: [targetDomain],
    keyword,
    country,
  });

  await logResearchRun({
    provider: SEO_PROVIDER_AHREFS_ALL_IN_ONE,
    searchType: "keyword_rank",
    query: `${targetDomain} :: ${keyword}`,
    cacheHit: false,
    status: run.error ? "gagal" : "ok",
    resultCount: run.items.length,
    error: run.error,
    durationMs: run.durationMs,
  });

  if (run.error) return cached.result;

  const normalized = normalizeKeywordRank(targetDomain, keyword, country, run.items);
  await upsertKeywordRankCache(normalized);
  return normalized;
}

async function rankCandidatesWithAi(
  candidates: BacklinkCandidate[],
  context: { sourceDomain: string; targetDomain: string },
): Promise<{ ordered: BacklinkCandidate[]; error: string | null }> {
  const system = [
    "Kamu memilih penempatan backlink terbaik berdasarkan relevansi semantik.",
    "Metrik SEO yang diberikan adalah fakta dari Ahrefs — pakai apa adanya, jangan mengubah atau mengarang angka.",
    "Beri penalti besar pada kandidat dengan repeated=true (kombinasi keyword + URL target yang sudah pernah dipakai).",
    'Kembalikan JSON: {"ranking":[{"keyword":"...","target_url":"...","score":0-100,"reason":"..."}]} terurut dari terbaik.',
    "Gunakan bahasa Indonesia untuk alasan.",
  ].join(" ");

  const user = JSON.stringify({
    domain_sumber: context.sourceDomain,
    domain_target: context.targetDomain,
    kandidat: candidates.map((c) => ({
      keyword: c.keyword,
      target_url: c.targetUrl,
      search_volume: c.searchVolume,
      kd: c.keywordDifficulty,
      cpc: c.cpc,
      traffic_potential: c.trafficPotential,
      current_position: c.currentPosition,
      repeated: c.repeated,
    })),
  });

  const ai = await openAiJson<{
    ranking?: { keyword?: unknown; target_url?: unknown; score?: unknown; reason?: unknown }[];
  }>({ system, user });

  if (ai.error || !ai.data?.ranking) {
    return { ordered: candidates, error: ai.error };
  }

  const byKey = new Map(
    candidates.map((c) => [`${c.normalizedKeyword}|${normalizeUrl(c.targetUrl)}`, c]),
  );
  const ordered: BacklinkCandidate[] = [];

  for (const row of ai.data.ranking) {
    const key = `${normalizeKeyword(String(row.keyword ?? ""))}|${normalizeUrl(String(row.target_url ?? ""))}`;
    const match = byKey.get(key);
    if (!match || ordered.includes(match)) continue;
    const score = Number(row.score);
    ordered.push({
      ...match,
      score: Number.isFinite(score) ? score : null,
      reason: String(row.reason ?? match.reason),
    });
  }

  for (const c of candidates) if (!ordered.some((o) => o.keyword === c.keyword)) ordered.push(c);

  return { ordered, error: null };
}

export async function recommendBacklinkPlacements(input: {
  userId: string;
  sourceDomain: string;
  targetDomain: string;
  country?: string;
}): Promise<BacklinkRecommendationResult> {
  const sourceDomain = normalizeDomain(input.sourceDomain);
  const targetDomain = normalizeDomain(input.targetDomain);
  const country = normalizeCountry(input.country);

  const base: BacklinkRecommendationResult = {
    sourceDomain,
    targetDomain,
    country,
    sourceProfile: null,
    targetProfile: null,
    candidates: [],
    recommendations: [],
    previousPlacementCount: 0,
    error: null,
  };

  if (!sourceDomain || !targetDomain) {
    return { ...base, error: "Domain sumber dan domain target wajib diisi." };
  }

  // 1-2. Profil domain sumber & target (cache-first).
  const [sourceProfile, targetProfile] = await Promise.all([
    researchDomain({ domain: sourceDomain, country }),
    researchDomain({ domain: targetDomain, country }),
  ]);

  const previousKeys = await loadPreviousPlacements(input.userId);

  // 3-4. Kandidat semantik dari OpenAI + deduplikasi.
  const generated = await generateCandidates({
    sourceProfile,
    targetProfile,
    targetDomain,
    previousKeys,
  });

  if (generated.error || generated.candidates.length === 0) {
    return {
      ...base,
      sourceProfile,
      targetProfile,
      previousPlacementCount: previousKeys.size,
      error: generated.error ?? "Tidak ada kandidat yang dihasilkan.",
    };
  }

  // 5-6. Metrik keyword (cache-first, hanya yang hilang/stale yang dipanggil).
  const metrics = await researchKeywords({
    keywords: generated.candidates.map((c) => c.keyword),
    country,
  });
  const metricByKeyword = new Map<string, KeywordMetricsResult>(
    metrics.map((m) => [m.normalizedKeyword, m]),
  );

  // 7-8. Rank (cache-first).
  const enriched: BacklinkCandidate[] = [];
  for (const candidate of generated.candidates) {
    const metric = metricByKeyword.get(candidate.normalizedKeyword);
    const rank = await resolveRank(targetDomain, candidate.keyword, country);
    enriched.push({
      ...candidate,
      searchVolume: metric?.searchVolume ?? null,
      keywordDifficulty: metric?.keywordDifficulty ?? null,
      cpc: metric?.cpc ?? null,
      trafficPotential: metric?.trafficPotential ?? null,
      currentPosition: rank?.position ?? null,
      rankingUrl: rank?.rankingUrl ?? null,
    });
  }

  // 9. Ranking akhir oleh OpenAI.
  const ranked = await rankCandidatesWithAi(enriched, { sourceDomain, targetDomain });

  return {
    ...base,
    sourceProfile,
    targetProfile,
    candidates: ranked.ordered,
    recommendations: ranked.ordered.slice(0, TOP_N),
    previousPlacementCount: previousKeys.size,
    error: ranked.error,
  };
}
