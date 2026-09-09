import { supabase } from "@/integrations/supabase/client";
import type { ProjectIntelligenceOutput } from "./project-intelligence.functions";

export type ProjectIntelligenceRunRow = {
  id: string;
  project_id: string;
  provider: string;
  model: string | null;
  status: string;
  error: string | null;
  input_summary: Record<string, unknown>;
  output: ProjectIntelligenceOutput | Record<string, never>;
  created_at: string;
};

export type ProjectFieldSuggestionRow = {
  id: string;
  project_id: string;
  run_id: string | null;
  field: string;
  suggested_value: string;
  rationale: string | null;
  status: string;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string;
};

function db() {
  return supabase as any;
}

export async function fetchProjectIntelligenceRuns(
  projectId: string,
): Promise<ProjectIntelligenceRunRow[]> {
  const { data, error } = await db()
    .from("project_intelligence_runs")
    .select("id,project_id,provider,model,status,error,input_summary,output,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as ProjectIntelligenceRunRow[];
}

export async function fetchProjectFieldSuggestions(
  projectId: string,
): Promise<ProjectFieldSuggestionRow[]> {
  const { data, error } = await db()
    .from("project_field_suggestions")
    .select("id,project_id,run_id,field,suggested_value,rationale,status,decided_by,decided_at,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectFieldSuggestionRow[];
}
