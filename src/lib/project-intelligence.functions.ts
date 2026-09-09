import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Menjalankan AI Client Intelligence untuk satu Project.
 * Semua kredensial AI dibaca server-side. Hasil disimpan sebagai riwayat,
 * dan usulan field disimpan sebagai saran yang menunggu persetujuan manusia.
 */
export const runProjectIntelligence = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { projectId: string; prompt?: string }) => {
    if (!input?.projectId) throw new Error("projectId wajib diisi");
    return input;
  })
  .handler(async ({ data, context }) => {
    const supabase = context.supabase;

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", data.projectId)
      .single();

    if (projectError || !project) {
      throw new Error("Project tidak ditemukan atau Anda tidak memiliki akses.");
    }
    if (!project.workspace_id) {
      throw new Error("Project belum terhubung ke workspace internal.");
    }

    const { data: evidenceRows } = await supabase
      .from("project_evidence")
      .select("title, source_type, processing_status, raw_text, source_url")
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false })
      .limit(15);

    const { data: sourceRows } = await supabase
      .from("project_data_sources")
      .select("source_key, status")
      .eq("project_id", data.projectId);

    const { runClientIntelligence } = await import("./seo/ai/client-intelligence.server");

    const result = await runClientIntelligence({
      project: {
        name: project.name,
        client_domain: project.client_domain,
        lifecycle_status: project.lifecycle_status,
        industry: project.industry,
        objectives: project.objectives ?? [],
        target_market: project.target_market,
        current_problem: project.current_problem,
        contact_person: project.contact_person,
        budget_indication: project.budget_indication,
        competitors: project.competitors ?? [],
        discovery_notes: project.discovery_notes,
        description: project.description,
      },
      evidence: (evidenceRows ?? []).map((e) => ({
        title: e.title ?? "(tanpa judul)",
        source_type: e.source_type,
        status: e.processing_status,
        excerpt: e.raw_text ?? e.source_url,
      })),
      dataSources: (sourceRows ?? []).map((s) => ({ label: s.source_key, status: s.status })),
      ...(data.prompt ? { userPrompt: data.prompt } : {}),
    });

    const { data: run, error: runError } = await supabase
      .from("project_intelligence_runs")
      .insert({
        workspace_id: project.workspace_id,
        project_id: project.id,
        provider: result.provider,
        model: result.model,
        status: result.error ? "gagal" : "ok",
        error: result.error,
        input_summary: {
          evidence_count: evidenceRows?.length ?? 0,
          data_source_count: sourceRows?.length ?? 0,
          prompt: data.prompt ?? null,
        },
        output: (result.data ?? {}) as never,
        created_by: context.userId,
      })
      .select("id")
      .single();

    if (runError) throw runError;

    const suggestions = result.data?.field_suggestions ?? [];
    if (run && suggestions.length > 0) {
      await supabase.from("project_field_suggestions").insert(
        suggestions
          .filter((s) => s.field && s.value)
          .map((s) => ({
            workspace_id: project.workspace_id as string,
            project_id: project.id,
            run_id: run.id,
            field: s.field,
            suggested_value: String(s.value),
            rationale: s.rationale ?? null,
            status: "pending",
          })),
      );
    }

    return {
      runId: run?.id ?? null,
      provider: result.provider,
      model: result.model,
      error: result.error,
      output: result.data,
    };
  });
