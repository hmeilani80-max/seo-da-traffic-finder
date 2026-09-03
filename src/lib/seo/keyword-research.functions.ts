import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { KeywordIdeasResult } from "./keyword-research.server";
import type { KeywordMetricsResult } from "./types";

export type { KeywordIdeasResult } from "./keyword-research.server";
export type { KeywordIdea, KeywordMetricsResult } from "./types";

const MAX_SHORTLIST = 25;

export const generateKeywordIdeasFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { seed: string; country?: string; language?: string; limit?: number }) => ({
    seed: String(input?.seed ?? "").trim(),
    country: input?.country ? String(input.country).trim() : "id",
    language: input?.language ? String(input.language).trim() : "id",
    limit: Number.isFinite(Number(input?.limit)) ? Number(input?.limit) : 50,
  }))
  .handler(async ({ data }): Promise<KeywordIdeasResult> => {
    const { generateKeywordIdeas } = await import("./keyword-research.server");
    return generateKeywordIdeas(data);
  });

export const researchKeywordsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      keywords: string[];
      country?: string;
      language?: string;
      forceRefresh?: boolean;
    }) => ({
    keywords: (Array.isArray(input?.keywords) ? input.keywords : [])
      .map((k) => String(k ?? "").trim())
      .filter(Boolean)
      .slice(0, MAX_SHORTLIST),
      country: input?.country ? String(input.country).trim() : "id",
      language: input?.language ? String(input.language).trim() : "id",
      forceRefresh: Boolean(input?.forceRefresh),
    }),
  )
  .handler(async ({ data }): Promise<KeywordMetricsResult[]> => {
    if (data.keywords.length === 0) return [];
    const { researchKeywords } = await import("./keyword-research.server");
    return researchKeywords(data);
  });
