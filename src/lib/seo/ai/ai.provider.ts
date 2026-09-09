/**
 * Wave 0 — Abstraksi provider AI (server-only).
 *
 * Tujuan:
 * - Semua alur AI baru memanggil abstraksi ini, bukan SDK/kunci provider.
 * - Alur OpenAI existing (rekomendasi backlink) tetap bekerja apa adanya.
 * - Komponen UI tidak boleh mengimpor modul ini secara langsung; gunakan server function.
 *
 * Aturan integritas fakta:
 * AI hanya untuk penalaran. AI TIDAK BOLEH menghasilkan metrik faktual
 * (DR, traffic, search volume, KD, CPC, posisi SERP, jumlah backlink, dsb).
 */

export type AiProviderId = "openai" | "lovable";

export type AiJsonRequest = {
  system: string;
  user: string;
  /** Opsional; setiap adapter memetakan ke model default-nya bila kosong. */
  model?: string;
  temperature?: number;
};

export type AiJsonResponse<T> = {
  data: T | null;
  error: string | null;
  provider: AiProviderId;
  model: string | null;
};

export type AiProvider = {
  id: AiProviderId;
  isConfigured: () => boolean;
  /** Memaksa balasan berbentuk JSON object. */
  json: <T>(request: AiJsonRequest) => Promise<AiJsonResponse<T>>;
};

export const AI_FACTUAL_INTEGRITY_RULE =
  "DILARANG KERAS mengarang metrik faktual apa pun (DR, organic traffic, search volume, KD, CPC, traffic potential, posisi SERP, jumlah backlink/referring domain, data analytics/ads/ecommerce). Gunakan hanya angka yang diberikan pada input.";

/**
 * Memilih provider AI untuk workflow baru.
 *
 * Default: Lovable managed AI bila LOVABLE_API_KEY tersedia, jika tidak fallback ke OpenAI.
 * Dapat dipaksa lewat env AI_PROVIDER=openai|lovable.
 */
export async function getAiProvider(preferred?: AiProviderId): Promise<AiProvider> {
  const [{ openAiProvider }, { lovableAiProvider }] = await Promise.all([
    import("./openai.provider"),
    import("./lovable-ai.provider"),
  ]);

  const requested =
    preferred ?? (process.env["AI_PROVIDER"] as AiProviderId | undefined) ?? undefined;

  if (requested === "openai") return openAiProvider;
  if (requested === "lovable") return lovableAiProvider;

  return lovableAiProvider.isConfigured() ? lovableAiProvider : openAiProvider;
}

/** Helper ringkas untuk workflow baru. */
export async function aiJson<T>(
  request: AiJsonRequest,
  preferred?: AiProviderId,
): Promise<AiJsonResponse<T>> {
  const provider = await getAiProvider(preferred);
  return provider.json<T>(request);
}
