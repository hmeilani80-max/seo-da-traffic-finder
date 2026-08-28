import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { Phase2TestResult } from "./phase2-test.server";

export type { Phase2TestResult, Phase2FieldReport, Phase2StepReport } from "./phase2-test.server";

export const runSeoPhase2Test = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { domain: string; keyword: string; country?: string }) => ({
    domain: String(input?.domain ?? "").trim(),
    keyword: String(input?.keyword ?? "").trim(),
    country: input?.country ? String(input.country).trim() : "id",
  }))
  .handler(async ({ data }): Promise<Phase2TestResult> => {
    const { runPhase2Test } = await import("./phase2-test.server");
    return runPhase2Test(data);
  });
