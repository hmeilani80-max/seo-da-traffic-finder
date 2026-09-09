import { runAiJson } from "@/lib/ai/provider.server";

export type ProjectIntelligenceOutput = {
  business_understanding: string[];
  client_objectives: string[];
  available_data_and_access: string[];
  initial_findings: string[];
  missing_information: string[];
  suggested_questions: string[];
  recommended_next_actions: string[];
  field_suggestions: Array<{
    field: "industry" | "objectives" | "target_market" | "current_problem" | "competitors" | "discovery_notes";
    suggested_value: string;
    rationale: string;
  }>;
};

export type GenerateProjectIntelligenceResult = {
  runId: string | null;
  provider: string;
  output: ProjectIntelligenceOutput | null;
  error: string | null;
};

const ALLOWED_SUGGESTION_FIELDS = new Set([
  "industry",
  "objectives",
  "target_market",
  "current_problem",
  "competitors",
  "discovery_notes",
]);

function cleanList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item ?? "").trim()).filter(Boolean).slice(0, 12);
}

function normalizeOutput(raw: any): ProjectIntelligenceOutput {
  const fieldSuggestions = Array.isArray(raw?.field_suggestions)
    ? raw.field_suggestions
        .map((item: any) => ({
          field: String(item?.field ?? "").trim(),
          suggested_value: String(item?.suggested_value ?? "").trim(),
          rationale: String(item?.rationale ?? "").trim(),
        }))
        .filter(
          (item: { field: string; suggested_value: string }) =>
            ALLOWED_SUGGESTION_FIELDS.has(item.field) && item.suggested_value,
        )
        .slice(0, 8)
    : [];

  return {
    business_understanding: cleanList(raw?.business_understanding),
    client_objectives: cleanList(raw?.client_objectives),
    available_data_and_access: cleanList(raw?.available_data_and_access),
    initial_findings: cleanList(raw?.initial_findings),
    missing_information: cleanList(raw?.missing_information),
    suggested_questions: cleanList(raw?.suggested_questions),
    recommended_next_actions: cleanList(raw?.recommended_next_actions),
    field_suggestions: fieldSuggestions as ProjectIntelligenceOutput["field_suggestions"],
  };
}

export async function generateProjectIntelligence(input: {
  projectId: string;
  userId: string;
  supabase: any;
}): Promise<GenerateProjectIntelligenceResult> {
  const db = input.supabase;
  const { data: project, error: projectError } = await db
    .from("projects")
    .select("*")
    .eq("id", input.projectId)
    .single();

  if (projectError || !project) {
    return { runId: null, provider: "openai", output: null, error: "Project tidak ditemukan atau tidak dapat diakses." };
  }
  if (!project.workspace_id) {
    return { runId: null, provider: "openai", output: null, error: "Project belum memiliki workspace." };
  }

  const [{ data: evidence, error: evidenceError }, { data: sources, error: sourcesError }] = await Promise.all([
    db
      .from("project_evidence")
      .select("source_type,title,source_url,raw_text,extracted_metadata,processing_status")
      .eq("project_id", input.projectId)
      .order("created_at", { ascending: false })
      .limit(20),
    db
      .from("project_data_sources")
      .select("source_key,status,notes")
      .eq("project_id", input.projectId),
  ]);

  if (evidenceError || sourcesError) {
    return {
      runId: null,
      provider: "openai",
      output: null,
      error: evidenceError?.message || sourcesError?.message || "Gagal membaca context Project.",
    };
  }

  const facts = {
    project: {
      name: project.name,
      website: project.client_domain,
      lifecycle_status: project.lifecycle_status,
      description: project.description,
      industry: project.industry,
      objectives: project.objectives,
      target_market: project.target_market,
      current_problem: project.current_problem,
      contact_person: project.contact_person,
      budget_indication: project.budget_indication,
      known_competitors: project.competitors,
      discovery_notes: project.discovery_notes,
    },
    data_sources: (sources ?? []).map((row: any) => ({
      source: row.source_key,
      status: row.status,
      notes: row.notes,
    })),
    evidence: (evidence ?? []).map((row: any) => ({
      source_type: row.source_type,
      title: row.title,
      source_url: row.source_url,
      processing_status: row.processing_status,
      // Only text already stored/extracted is sent. Files are not claimed to be parsed.
      available_text: row.raw_text ? String(row.raw_text).slice(0, 12000) : null,
      metadata: row.extracted_metadata,
    })),
  };

  const system = [
    "You are an SEO client-intelligence analyst.",
    "Use ONLY the supplied Project facts, source registry, and available evidence text.",
    "Do not invent SEO metrics, rankings, traffic, DR, search volume, analytics, credentials, or facts that are not supplied.",
    "If information is missing, put it under missing_information or suggested_questions instead of guessing.",
    "Clearly distinguish what is known from what is a recommendation.",
    "Respond in Indonesian unless the supplied business context is clearly English-first.",
    "Return JSON only with keys: business_understanding, client_objectives, available_data_and_access, initial_findings, missing_information, suggested_questions, recommended_next_actions, field_suggestions.",
    "All section values are arrays of concise strings.",
    "field_suggestions is an array of {field,suggested_value,rationale}; allowed fields only: industry, objectives, target_market, current_problem, competitors, discovery_notes.",
    "For objectives or competitors, suggested_value should be a JSON array encoded as a string.",
    "Only suggest a field when the supplied evidence/context materially supports it. Never silently overwrite data.",
  ].join(" ");

  const ai = await runAiJson<any>({
    system,
    user: JSON.stringify(facts),
    temperature: 0.2,
  });

  const inputSummary = {
    project_id: input.projectId,
    evidence_count: evidence?.length ?? 0,
    data_source_count: sources?.length ?? 0,
    evidence_with_text: (evidence ?? []).filter((row: any) => Boolean(row.raw_text)).length,
  };

  if (ai.error || !ai.data) {
    const { data: failedRun } = await db
      .from("project_intelligence_runs")
      .insert({
        workspace_id: project.workspace_id,
        project_id: input.projectId,
        provider: ai.provider,
        status: "error",
        error: ai.error ?? "AI tidak mengembalikan output.",
        input_summary: inputSummary,
        output: {},
        created_by: input.userId,
      })
      .select("id")
      .single();

    return {
      runId: failedRun?.id ?? null,
      provider: ai.provider,
      output: null,
      error: ai.error ?? "AI tidak mengembalikan output.",
    };
  }

  const output = normalizeOutput(ai.data);
  const { data: run, error: runError } = await db
    .from("project_intelligence_runs")
    .insert({
      workspace_id: project.workspace_id,
      project_id: input.projectId,
      provider: ai.provider,
      status: "ok",
      input_summary: inputSummary,
      output,
      created_by: input.userId,
    })
    .select("id")
    .single();

  if (runError || !run) {
    return { runId: null, provider: ai.provider, output: null, error: runError?.message ?? "Gagal menyimpan AI Intelligence." };
  }

  if (output.field_suggestions.length > 0) {
    const suggestionRows = output.field_suggestions.map((item) => ({
      workspace_id: project.workspace_id,
      project_id: input.projectId,
      run_id: run.id,
      field: item.field,
      suggested_value: item.suggested_value,
      rationale: item.rationale || null,
      status: "pending",
    }));
    const { error: suggestionError } = await db.from("project_field_suggestions").insert(suggestionRows);
    if (suggestionError) {
      return {
        runId: run.id,
        provider: ai.provider,
        output,
        error: `Intelligence tersimpan, tetapi field suggestions gagal disimpan: ${suggestionError.message}`,
      };
    }
  }

  return { runId: run.id, provider: ai.provider, output, error: null };
}

function parseSuggestedField(field: string, value: string): unknown {
  if (field === "objectives" || field === "competitors") {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.map((item) => String(item).trim()).filter(Boolean);
    } catch {
      // Fall through to delimiter parsing for human-edited values.
    }
    return value.split(/[\n,;|]+/).map((item) => item.trim()).filter(Boolean);
  }
  return value.trim() || null;
}

export async function decideProjectFieldSuggestion(input: {
  suggestionId: string;
  decision: "accept" | "ignore";
  editedValue?: string;
  userId: string;
  supabase: any;
}): Promise<{ projectId: string | null; error: string | null }> {
  const db = input.supabase;
  const { data: suggestion, error } = await db
    .from("project_field_suggestions")
    .select("id,project_id,field,suggested_value,status")
    .eq("id", input.suggestionId)
    .single();

  if (error || !suggestion) return { projectId: null, error: "Suggestion tidak ditemukan atau tidak dapat diakses." };
  if (suggestion.status !== "pending") return { projectId: suggestion.project_id, error: "Suggestion ini sudah diputuskan." };
  if (!ALLOWED_SUGGESTION_FIELDS.has(suggestion.field)) return { projectId: suggestion.project_id, error: "Field suggestion tidak diizinkan." };

  if (input.decision === "accept") {
    const value = input.editedValue !== undefined ? input.editedValue : suggestion.suggested_value;
    const { error: updateProjectError } = await db
      .from("projects")
      .update({ [suggestion.field]: parseSuggestedField(suggestion.field, value) })
      .eq("id", suggestion.project_id);
    if (updateProjectError) return { projectId: suggestion.project_id, error: updateProjectError.message };
  }

  const { error: decisionError } = await db
    .from("project_field_suggestions")
    .update({
      status: input.decision === "accept" ? "accepted" : "ignored",
      decided_by: input.userId,
      decided_at: new Date().toISOString(),
      ...(input.decision === "accept" && input.editedValue !== undefined
        ? { suggested_value: input.editedValue }
        : {}),
    })
    .eq("id", suggestion.id);

  return {
    projectId: suggestion.project_id,
    error: decisionError?.message ?? null,
  };
}
