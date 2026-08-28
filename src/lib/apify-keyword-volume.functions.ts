import { createServerFn } from "@tanstack/react-start";

const ACTOR_ID = "radeance~ahrefs-scraper";
const APIFY_URL = `https://api.apify.com/v2/actors/${ACTOR_ID}/run-sync-get-dataset-items?timeout=180`;

export type ApifyKeywordVolumeResult = {
  keyword: string;
  country: string;
  searchVolume: number | null;
  error: string | null;
};

type KeywordIdea = {
  keyword?: string | null;
  country?: string | null;
  volume?: number | null;
};

type ApifyKeywordItem = {
  type?: string | null;
  keyword?: string | null;
  country?: string | null;
  keyword_ideas?: KeywordIdea[] | null;
};

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function toFiniteNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

function findExactVolume(items: ApifyKeywordItem[], keyword: string) {
  const wanted = normalizeKeyword(keyword);

  for (const item of items ?? []) {
    for (const idea of item.keyword_ideas ?? []) {
      if (normalizeKeyword(String(idea.keyword ?? "")) !== wanted) continue;

      const volume = toFiniteNumber(idea.volume);
      if (volume != null) return volume;
    }
  }

  return null;
}

/**
 * Ambil Search Volume keyword langsung dari Apify Actor radeance/ahrefs-scraper.
 *
 * Penting:
 * - Tidak lewat connector-gateway.lovable.dev.
 * - Tidak memakai LOVABLE_API_KEY.
 * - APIFY_API_KEY hanya dibaca server-side.
 * - Hanya menjalankan mode keyword research; domain/backlink/traffic dimatikan.
 */
export const researchKeywordVolumeViaApify = createServerFn({ method: "POST" })
  .inputValidator((data: { keyword: string; country?: string }) => {
    const keyword = String(data?.keyword ?? "").trim();
    const country = String(data?.country ?? "id").trim().toLowerCase() || "id";

    if (!keyword) throw new Error("Keyword wajib diisi");

    return { keyword, country };
  })
  .handler(async ({ data }): Promise<ApifyKeywordVolumeResult> => {
    const { keyword, country } = data;
    const apifyKey = process.env["APIFY_API_KEY"];

    if (!apifyKey) {
      return {
        keyword,
        country,
        searchVolume: null,
        error: "APIFY_API_KEY belum tersedia di environment server.",
      };
    }

    try {
      const response = await fetch(APIFY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apifyKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keyword,
          country,
          mode: "exact",
          include_web_authority: false,
          include_traffic: false,
          include_ai_visibility: false,
          include_keywords: true,
          include_keywords_difficulty: false,
          include_keywords_ranking: false,
          include_serp: false,
          include_backlinks: false,
          include_broken_links: false,
          include_competitors: false,
          include_top_websites: false,
        }),
      });

      const raw = await response.text();

      if (!response.ok) {
        return {
          keyword,
          country,
          searchVolume: null,
          error: `Apify error ${response.status}: ${raw.slice(0, 180)}`,
        };
      }

      let items: ApifyKeywordItem[];

      try {
        items = JSON.parse(raw) as ApifyKeywordItem[];
      } catch {
        return {
          keyword,
          country,
          searchVolume: null,
          error: "Response Apify bukan JSON yang valid.",
        };
      }

      const searchVolume = findExactVolume(items, keyword);

      if (searchVolume == null) {
        return {
          keyword,
          country,
          searchVolume: null,
          error: "Search Volume exact keyword tidak ditemukan pada output Actor.",
        };
      }

      return {
        keyword,
        country,
        searchVolume,
        error: null,
      };
    } catch (error) {
      return {
        keyword,
        country,
        searchVolume: null,
        error: error instanceof Error ? error.message : "Gagal menghubungi Apify",
      };
    }
  });
