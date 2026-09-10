import { createServerFn } from "@tanstack/react-start";

import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { GenerateProjectIntelligenceResult } from "./project-intelligence.server";

export type { GenerateProjectIntelligenceResult, ProjectIntelligenceOutput } from "./project-intelligence.server";

export const generateProjectIntelligenceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string }) => ({
    projectId: String(input?.projectId ?? "").trim(),
  }))
  .handler(async ({ data, context }): Promise<GenerateProjectIntelligenceResult> => {
    if (!data.projectId) {
      return { runId: null, provider: "openai", output: null, error: "Project ID wajib diisi." };
    }
    const { generateProjectIntelligence } = await import("./project-intelligence.server");
    return generateProjectIntelligence({
      projectId: data.projectId,
      userId: context.userId,
      supabase: context.supabase,
    });
  });

export const decideProjectFieldSuggestionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: { suggestionId: string; decision: "accept" | "ignore"; editedValue?: string }) => {
      const editedValue = input?.editedValue === undefined ? undefined : String(input.editedValue);
      return {
        suggestionId: String(input?.suggestionId ?? "").trim(),
        decision: input?.decision === "accept" ? ("accept" as const) : ("ignore" as const),
        ...(editedValue === undefined ? {} : { editedValue }),
      };
    },
  )
  .handler(async ({ data, context }) => {
    if (!data.suggestionId) return { projectId: null, error: "Suggestion ID wajib diisi." };
    const { decideProjectFieldSuggestion } = await import("./project-intelligence.server");
    return decideProjectFieldSuggestion({
      suggestionId: data.suggestionId,
      decision: data.decision,
      ...(data.editedValue === undefined ? {} : { editedValue: data.editedValue }),
      userId: context.userId,
      supabase: context.supabase,
    });
  });
