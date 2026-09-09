/**
 * Abstraksi provider AI (server-only).
 *
 * Runtime policy saat ini: OpenAI only.
 * Lovable AI / AI Gateway tidak boleh dipanggil agar tidak mengonsumsi token/kredit Lovable.
 * UI tidak boleh mengimpor provider secara langsung; semua workflow AI harus melalui server function.
 *
 * Aturan integritas fakta:
 * AI hanya untuk penalaran. AI TIDAK BOLEH menghasilkan metrik faktual
 * (DR, traffic, search volume, KD, CPC, posisi SERP, jumlah backlink, dsb).
 */

export type AiProviderId = "openai";

export type AiJsonRequest = {
  system: string;
  user: string;
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
  json: <T>(request: AiJsonRequest) => Promise<AiJsonResponse<T>>;
};

export const AI_FACTUAL_INTEGRITY_RULE =
  "DILARANG KERAS mengarang metrik faktual apa pun (DR, organic traffic, search volume, KD, CPC, traffic potential, posisi SERP, jumlah backlink/referring domain, data analytics/ads/ecommerce). Gunakan hanya angka yang diberikan pada input.";

/** Runtime provider untuk seluruh workflow AI baru: OpenAI. */
export async function getAiProvider(): Promise<AiProvider> {
  const { openAiProvider } = await import("./openai.provider");
  return openAiProvider;
}

export async function aiJson<T>(request: AiJsonRequest): Promise<AiJsonResponse<T>> {
  const provider = await getAiProvider();
  return provider.json<T>(request);
}
