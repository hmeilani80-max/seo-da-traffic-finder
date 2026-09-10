import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { runAiJson } from "@/lib/ai/provider.server";
import type { ProjectIntelligenceOutput } from "@/lib/project-workspace";

const ALLOWED_SUGGESTION_FIELDS = new Set([
  "industry",
  "target_market",
  "current_problem",
  "discovery_notes",
]);

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean).slice(0, 12);
}

function normalizeOutput(value: unknown): ProjectIntelligenceOutput {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const suggestionsRaw = Array.isArray(raw["fieldSuggestions"]) ? raw["fieldSuggestions"] : [];

  return {
    businessUnderstanding: String(raw["businessUnderstanding"] ?? "Belum cukup data untuk menyimpulkan business understanding."),
    clientObjectives: String(raw["clientObjectives"] ?? "Belum cukup data untuk menyimpulkan objective klien."),
    availableDataAccess: String(raw["availableDataAccess"] ?? "Belum ada informasi akses data yang cukup."),
    initialFindings: String(raw["initialFindings"] ?? "Belum cukup evidence untuk initial findings."),
    missingInformation: asStringArray(raw["missingInformation"]),
    suggestedQuestions: asStringArray(raw["suggestedQuestions"]),
    recommendedNextActions: asStringArray(raw["recommendedNextActions"]),
    fieldSuggestions: suggestionsRaw
      .map((item) => {
        const obj = (item && typeof item === "object" ? item : {}) as Record<string, unknown>;
        return {
          field: String(obj["field"] ?? ""),
          value: String(obj["value"] ?? "").trim(),
          rationale: String(obj["rationale"] ?? "").trim(),
        };
      })
      .filter((item) => ALLOWED_SUGGESTION_FIELDS.has(item.field) && item.value)
      .slice(0, 8),
  };
}

export const runProjectIntelligenceFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string }) => ({
    projectId: String(input?.projectId ?? "").trim(),
  }))
  .handler(async ({ data, context }) => {
    if (!data.projectId) throw new Error("Project ID wajib diisi.");

    const { supabase, userId } = context;
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", data.projectId)
      .single();
    if (projectError || !project) throw projectError ?? new Error("Project tidak ditemukan.");
    if (!project.workspace_id) throw new Error("Project belum memiliki workspace.");

    const [{ data: evidence, error: evidenceError }, { data: sources, error: sourceError }] =
      await Promise.all([
        supabase
          .from("project_evidence")
          .select("title,source_type,source_url,raw_text,processing_status,processing_error,created_at")
          .eq("project_id", data.projectId)
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("project_data_sources")
          .select("source_key,status,notes")
          .eq("project_id", data.projectId),
      ]);
    if (evidenceError) throw evidenceError;
    if (sourceError) throw sourceError;

    const evidenceContext = (evidence ?? []).map((item, index) => ({
      index: index + 1,
      title: item.title,
      source_type: item.source_type,
      source_url: item.source_url,
      processing_status: item.processing_status,
      processing_error: item.processing_error,
      raw_text: item.raw_text ? item.raw_text.slice(0, 3500) : null,
    }));

    const sourceContext = (sources ?? []).map((item) => ({
      source_key: item.source_key,
      status: item.status,
      notes: item.notes,
    }));

    const factualContext = {
      project: {
        name: project.name,
        client_domain: project.client_domain,
        description: project.description,
        lifecycle_status: project.lifecycle_status,
        industry: project.industry,
        objectives: project.objectives,
        target_market: project.target_market,
        current_problem: project.current_problem,
        contact_person: project.contact_person,
        budget_indication: project.budget_indication,
        competitors: project.competitors,
        discovery_notes: project.discovery_notes,
      },
      evidence: evidenceContext,
      data_sources: sourceContext,
    };

    const ai = await runAiJson<unknown>({
      temperature: 0.2,
      system: [
        "You are the Client Intelligence assistant inside an SEO agency operating system.",
        "Use ONLY the factual Project context, evidence text, links, and data-source statuses provided by the user message.",
        "Do not invent SEO metrics, rankings, traffic, business facts, access status, competitors, budgets, guarantees, or conclusions unsupported by the supplied context.",
        "When evidence is insufficient, explicitly say that information is missing.",
        "Return JSON only with keys: businessUnderstanding, clientObjectives, availableDataAccess, initialFindings, missingInformation, suggestedQuestions, recommendedNextActions, fieldSuggestions.",
        "fieldSuggestions must be an array of objects {field,value,rationale}; allowed fields only: industry, target_market, current_problem, discovery_notes.",
        "Field suggestions are suggestions only and must never imply they were already applied.",
        "Write concise professional Indonesian suitable for an internal SEO specialist.",
      ].join("\n"),
      user: `Analyze this Project context:\n${JSON.stringify(factualContext)}`,
    });

    const normalized = normalizeOutput(ai.data);
    const status = ai.error ? "error" : "ok";

    const { data: run, error: runError } = await supabase
      .from("project_intelligence_runs")
      .insert({
        workspace_id: project.workspace_id,
        project_id: project.id,
        provider: ai.provider,
        status,
        error: ai.error,
        input_summary: {
          evidence_count: evidenceContext.length,
          text_evidence_count: evidenceContext.filter((item) => Boolean(item.raw_text)).length,
          data_source_count: sourceContext.length,
        },
        output: normalized,
        created_by: userId,
      })
      .select("id")
      .single();
    if (runError || !run) throw runError ?? new Error("Gagal menyimpan intelligence run.");

    if (!ai.error && normalized.fieldSuggestions?.length) {
      const rows = normalized.fieldSuggestions.map((suggestion) => ({
        workspace_id: project.workspace_id,
        project_id: project.id,
        run_id: run.id,
        field: suggestion.field,
        suggested_value: suggestion.value,
        rationale: suggestion.rationale || null,
        status: "pending",
      }));
      const { error: suggestionError } = await supabase.from("project_field_suggestions").insert(rows);
      if (suggestionError) throw suggestionError;
    }

    return {
      runId: run.id,
      provider: ai.provider,
      error: ai.error,
      output: normalized,
    };
  });
