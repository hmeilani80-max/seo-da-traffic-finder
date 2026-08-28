import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { DomainResearchReport } from "./domain-research.server";

export type { DomainResearchReport } from "./domain-research.server";

const MAX_DOMAINS = 20;

export const researchDomainsFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { domains: string[]; country?: string; forceRefresh?: boolean }) => ({
    domains: (Array.isArray(input?.domains) ? input.domains : [])
      .map((d) => String(d ?? "").trim())
      .filter(Boolean)
      .slice(0, MAX_DOMAINS),
    country: input?.country ? String(input.country).trim() : "id",
    forceRefresh: Boolean(input?.forceRefresh),
  }))
  .handler(async ({ data }): Promise<DomainResearchReport[]> => {
    if (data.domains.length === 0) return [];
    const { researchDomains } = await import("./domain-research.server");
    return researchDomains(data);
  });
