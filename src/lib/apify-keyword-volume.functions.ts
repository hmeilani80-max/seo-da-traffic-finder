import { createServerFn } from "@tanstack/react-start";

const ACTOR_ID = "burbn~ahrefs-keyword-explorer";
const APIFY_URL = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?timeout=180`;

export type ApifyKeywordVolumeResult = {
  keyword: string;
  country: string;
  searchVolume: number | null;
  difficulty: number | null;
  globalSearchVolume: number | null;
  trafficPotential: number | null;
  error: string | null;
};

type ApifyKeywordItem = {
  keyword?: string | null;
  searchVolume?: number | null;
  difficulty?: number | null;
  globalSearchVolume?: number | null;
  trafficPotential?: number | null;
};

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function toFiniteNumber(value: unknown): number | null {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isFinite(number) ? number : null;
}

/**
 * Ambil Search Volume langsung dari Apify Actor burbn/ahrefs-keyword-explorer.
 * Tidak lewat connector-gateway.lovable.dev dan tidak memakai LOVABLE_API_KEY.
 * APIFY_API_KEY hanya dibaca server-side.
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

    const empty = (error: string): ApifyKeywordVolumeResult => ({
      keyword,
      country,
      searchVolume: null,
      difficulty: null,
      globalSearchVolume: null,
      trafficPotential: null,
      error,
    });

    if (!apifyKey) {
      return empty("APIFY_API_KEY belum tersedia di environment server.");
    }

    try {
      const response = await fetch(APIFY_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apifyKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          keywords: [keyword],
          country,
        }),
      });

      const raw = await response.text();

      if (!response.ok) {
        return empty(`Apify error ${response.status}: ${raw.slice(0, 180)}`);
      }

      let items: ApifyKeywordItem[];

      try {
        items = JSON.parse(raw) as ApifyKeywordItem[];
      } catch {
        return empty("Response Apify bukan JSON yang valid.");
      }

      const wanted = normalizeKeyword(keyword);
      const item = items.find(
        (row) => normalizeKeyword(String(row.keyword ?? "")) === wanted,
      );

      if (!item) {
        return empty("Keyword exact tidak ditemukan pada output Actor.");
      }

      const searchVolume = toFiniteNumber(item.searchVolume);

      if (searchVolume == null) {
        return empty("Search Volume tidak tersedia pada output Actor.");
      }

      return {
        keyword,
        country,
        searchVolume,
        difficulty: toFiniteNumber(item.difficulty),
        globalSearchVolume: toFiniteNumber(item.globalSearchVolume),
        trafficPotential: toFiniteNumber(item.trafficPotential),
        error: null,
      };
    } catch (error) {
      return empty(error instanceof Error ? error.message : "Gagal menghubungi Apify");
    }
  });
