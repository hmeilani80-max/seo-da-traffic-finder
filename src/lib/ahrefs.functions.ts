import { createServerFn } from "@tanstack/react-start";

export type AhrefsResult = {
  domain: string;
  dr: number | null;
  traffic: number | null;
  error: string | null;
};

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function normalize(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

/**
 * Mengambil Domain Rating & Organic Traffic dari Ahrefs API v3.
 * API key dikirim dari klien (disimpan lokal di browser pengguna).
 */
export const fetchAhrefsMetrics = createServerFn({ method: "POST" })
  .inputValidator((data: { domain: string; apiKey: string }) => {
    const domain = normalize(String(data?.domain ?? ""));
    const apiKey = String(data?.apiKey ?? "").trim();
    if (!domain) throw new Error("Domain tidak valid");
    if (!apiKey) throw new Error("Ahrefs API Key belum diisi");
    return { domain, apiKey };
  })
  .handler(async ({ data }): Promise<AhrefsResult> => {
    const { domain, apiKey } = data;
    const date = todayISO();
    const headers = {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
    };

    const base = "https://api.ahrefs.com/v3/site-explorer";
    const drUrl = `${base}/domain-rating?target=${encodeURIComponent(domain)}&date=${date}`;
    const mtUrl = `${base}/metrics?target=${encodeURIComponent(domain)}&date=${date}&mode=domain&volume_mode=monthly`;

    try {
      const [drRes, mtRes] = await Promise.all([
        fetch(drUrl, { headers }),
        fetch(mtUrl, { headers }),
      ]);

      if (!drRes.ok && !mtRes.ok) {
        const text = await drRes.text();
        return {
          domain,
          dr: null,
          traffic: null,
          error: `Ahrefs error ${drRes.status}: ${text.slice(0, 160)}`,
        };
      }

      let dr: number | null = null;
      let traffic: number | null = null;

      if (drRes.ok) {
        const j = (await drRes.json()) as { domain_rating?: { domain_rating?: number } };
        dr = j?.domain_rating?.domain_rating ?? null;
      }
      if (mtRes.ok) {
        const j = (await mtRes.json()) as { metrics?: { org_traffic?: number } };
        traffic = j?.metrics?.org_traffic ?? null;
      }

      return { domain, dr, traffic: traffic ?? 0, error: null };
    } catch (e) {
      return {
        domain,
        dr: null,
        traffic: null,
        error: e instanceof Error ? e.message : "Gagal menghubungi Ahrefs",
      };
    }
  });
