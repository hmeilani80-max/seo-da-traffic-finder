import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { BacklinkRecommendationResult } from "./backlink-recommendation.server";

export type {
  BacklinkCandidate,
  BacklinkRecommendationResult,
} from "./backlink-recommendation.server";

export const recommendBacklinkPlacementsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { sourceDomain: string; targetDomain: string; country?: string }) => ({
    sourceDomain: String(input?.sourceDomain ?? "").trim(),
    targetDomain: String(input?.targetDomain ?? "").trim(),
    country: input?.country ? String(input.country).trim() : "id",
  }))
  .handler(async ({ data, context }): Promise<BacklinkRecommendationResult> => {
    const { recommendBacklinkPlacements } = await import("./backlink-recommendation.server");
    return recommendBacklinkPlacements({ ...data, userId: context.userId });
  });
