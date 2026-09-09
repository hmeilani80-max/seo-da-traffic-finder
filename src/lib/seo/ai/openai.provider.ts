/**
 * Adapter OpenAI (server-only) — membungkus helper existing tanpa mengubahnya.
 * Dipakai sebagai provider kompatibilitas untuk alur rekomendasi backlink.
 */

import { isOpenAiConfigured, openAiJson } from "../openai.server";
import type { AiJsonRequest, AiJsonResponse, AiProvider } from "./ai.provider";

const DEFAULT_MODEL = "gpt-4o-mini";

export const openAiProvider: AiProvider = {
  id: "openai",
  isConfigured: () => isOpenAiConfigured(),
  async json<T>(request: AiJsonRequest): Promise<AiJsonResponse<T>> {
    const model = request.model ?? DEFAULT_MODEL;
    const result = await openAiJson<T>({ ...request, model });
    return { data: result.data, error: result.error, provider: "openai", model };
  },
};
