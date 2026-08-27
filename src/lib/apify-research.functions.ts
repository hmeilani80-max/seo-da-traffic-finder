import { createServerFn } from "@tanstack/react-start";

export type ApifyResearchResult = {
  domain: string;
  dr: number | null;
  traffic: number | null;
  error: string | null;
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/apify";
const ACTOR_ID = "radeance~ahrefs-scraper";

function normalize(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/[?#].*$/, "");
}

type ApifyItem = {
  type?: string;
  domain_rating?: number | null;
  website_authority?: { domainRating?: number | null } | null;
  website_traffic?: { trafficMonthlyAvg?: number | null } | null;
};

/**
 * Riset DR & Organic Traffic lewat Apify Actor radeance/ahrefs-scraper.
 * Token Apify tidak pernah dikirim ke browser — semua panggilan lewat gateway server-side.
 */
export const researchDomainViaApify = createServerFn({ method: "POST" })
  .inputValidator((data: { domain: string }) => {
    const domain = normalize(String(data?.domain ?? ""));
    if (!domain || !domain.includes(".")) throw new Error("Domain tidak valid");
    return { domain };
  })
  .handler(async ({ data }): Promise<ApifyResearchResult> => {
    const { domain } = data;

    const lovableApiKey = process.env["LOVABLE_API_KEY"];
    const apifyKey = process.env["APIFY_API_KEY"];

    if (!lovableApiKey || !apifyKey) {
      return {
        domain,
        dr: null,
        traffic: null,
        error:
          "Koneksi Apify belum tersedia di server. Hubungkan connector Apify pada Project Settings → Connectors.",
      };
    }

    try {
      const res = await fetch(
        `${GATEWAY_URL}/acts/${ACTOR_ID}/run-sync-get-dataset-items?timeout=180`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${lovableApiKey}`,
            "X-Connection-Api-Key": apifyKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: domain,
            mode: "exact",
            country: "us",
            include_web_authority: true,
            include_traffic: true,
            include_backlinks: false,
          }),
        },
      );

      if (!res.ok) {
        const body = await res.text();
        console.error(`[Apify] gagal [${res.status}]: ${body.slice(0, 500)}`);
        return {
          domain,
          dr: null,
          traffic: null,
          error: `Apify error ${res.status}: ${body.slice(0, 160)}`,
        };
      }

      const items = (await res.json()) as ApifyItem[];

      let dr: number | null = null;
      let traffic: number | null = null;

      for (const item of items ?? []) {
        const itemDr = item.domain_rating ?? item.website_authority?.domainRating ?? null;
        if (itemDr != null && dr == null) dr = Number(itemDr);

        const itemTraffic = item.website_traffic?.trafficMonthlyAvg ?? null;
        if (itemTraffic != null && traffic == null) traffic = Number(itemTraffic);
      }

      if (dr == null && traffic == null) {
        return {
          domain,
          dr: null,
          traffic: null,
          error: "Actor tidak mengembalikan data DR maupun traffic untuk domain ini.",
        };
      }

      return { domain, dr, traffic: traffic ?? 0, error: null };
    } catch (e) {
      console.error("[Apify] exception", e);
      return {
        domain,
        dr: null,
        traffic: null,
        error: e instanceof Error ? e.message : "Gagal menghubungi Apify",
      };
    }
  });
