import { supabase } from "@/integrations/supabase/client";
import { updateProjectProfile } from "@/lib/project-profile";

export type IntelligenceRunRow = {
  id: string;
  project_id: string;
  provider: string;
  model: string | null;
  status: string;
  error: string | null;
  input_summary: Record<string, unknown>;
  output: Record<string, unknown>;
  created_at: string;
};

export type FieldSuggestionRow = {
  id: string;
  project_id: string;
  run_id: string | null;
  field: string;
  suggested_value: string;
  rationale: string | null;
  status: string;
  created_at: string;
};

export const FIELD_LABEL: Record<string, string> = {
  industry: "Industri",
  objectives: "Objective",
  target_market: "Target Market",
  current_problem: "Masalah Saat Ini",
  contact_person: "Kontak Person",
  budget_indication: "Indikasi Budget",
  competitors: "Kompetitor",
};

export async function fetchIntelligenceRuns(projectId: string): Promise<IntelligenceRunRow[]> {
  const { data, error } = await supabase
    .from("project_intelligence_runs")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as unknown as IntelligenceRunRow[];
}

export async function fetchFieldSuggestions(projectId: string): Promise<FieldSuggestionRow[]> {
  const { data, error } = await supabase
    .from("project_field_suggestions")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FieldSuggestionRow[];
}

async function markSuggestion(id: string, status: string) {
  const { data: auth } = await supabase.auth.getUser();
  const { error } = await supabase
    .from("project_field_suggestions")
    .update({
      status,
      decided_by: auth.user?.id ?? null,
      decided_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

/** Menerapkan usulan AI ke Project hanya setelah user menyetujui secara eksplisit. */
export async function acceptSuggestion(
  projectId: string,
  suggestion: FieldSuggestionRow,
  overrideValue?: string,
) {
  const value = (overrideValue ?? suggestion.suggested_value).trim();
  if (!value) throw new Error("Nilai tidak boleh kosong.");

  const listFields = ["objectives", "competitors"];
  const patch = listFields.includes(suggestion.field)
    ? {
        [suggestion.field]: value
          .split(/[,\n;]/)
          .map((v) => v.trim())
          .filter(Boolean),
      }
    : { [suggestion.field]: value };

  await updateProjectProfile(projectId, patch);
  await markSuggestion(suggestion.id, "accepted");
}

export async function ignoreSuggestion(suggestion: FieldSuggestionRow) {
  await markSuggestion(suggestion.id, "ignored");
}
