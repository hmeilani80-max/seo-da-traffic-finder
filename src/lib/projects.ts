import { supabase } from "@/integrations/supabase/client";

export type ProjectRow = {
  id: string;
  name: string;
  client_domain: string | null;
  description: string | null;
  status: string;
  workspace_id: string | null;
  lifecycle_status: string;
  activated_at: string | null;
  industry: string | null;
  objectives: string[];
  target_market: string | null;
  current_problem: string | null;
  contact_person: string | null;
  budget_indication: string | null;
  competitors: string[];
  discovery_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type PlacementOrderRow = {
  id: string;
  project_id: string | null;
  workspace_id?: string | null;
  source_domain: string;
  target_url: string | null;
  keyword: string | null;
  anchor_text: string | null;
  status: string;
  price: number | null;
  placed_at: string | null;
  notes: string | null;
  dr: number | null;
  traffic: number | null;
  search_volume: number | null;
  created_at: string;
  updated_at: string;
};

export type BacklinkRow = {
  id: string;
  project_id: string | null;
  workspace_id?: string | null;
  placement_order_id: string | null;
  source_domain: string;
  source_url: string | null;
  target_url: string | null;
  keyword: string | null;
  anchor_text: string | null;
  link_type: string;
  status: string;
  dr: number | null;
  traffic: number | null;
  created_at: string;
};

export const PROJECT_LIFECYCLES = [
  "prospect",
  "assessment",
  "proposal",
  "active",
  "lost",
  "archived",
] as const;

export const PROJECT_LIFECYCLE_LABEL: Record<string, string> = {
  prospect: "Prospect",
  assessment: "Assessment",
  proposal: "Proposal",
  active: "Active",
  lost: "Lost",
  archived: "Archived",
};

export const PLACEMENT_STATUS = ["draft", "dipesan", "tayang", "batal"] as const;

export type PlacementStatus = (typeof PLACEMENT_STATUS)[number];

export const PLACEMENT_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  dipesan: "Dipesan",
  tayang: "Tayang",
  batal: "Batal",
};

/* ------------------------------- Projects -------------------------------- */

export async function fetchProjects(): Promise<ProjectRow[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as ProjectRow[];
}

export async function fetchProject(id: string): Promise<ProjectRow> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error) throw error;
  return data as unknown as ProjectRow;
}

export async function createProject(input: {
  name: string;
  client_domain?: string | null;
  description?: string | null;
}): Promise<ProjectRow> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Sesi tidak ditemukan, silakan login ulang.");

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      client_domain: input.client_domain?.trim() || null,
      description: input.description?.trim() || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as ProjectRow;
}

export type ProjectProfileInput = {
  name: string;
  client_domain: string | null;
  description: string | null;
  lifecycle_status: string;
  industry: string | null;
  objectives: string[];
  target_market: string | null;
  current_problem: string | null;
  contact_person: string | null;
  budget_indication: string | null;
  competitors: string[];
  discovery_notes: string | null;
};

export async function updateProjectProfile(
  id: string,
  input: ProjectProfileInput,
): Promise<ProjectRow> {
  // The generated Supabase type file currently trails the already-applied Wave 1
  // schema. Keep this escape local until generated types are refreshed.
  const db = supabase as any;
  const lifecycle = PROJECT_LIFECYCLES.includes(input.lifecycle_status as (typeof PROJECT_LIFECYCLES)[number])
    ? input.lifecycle_status
    : "prospect";

  const payload: Record<string, unknown> = {
    name: input.name.trim(),
    client_domain: input.client_domain?.trim() || null,
    description: input.description?.trim() || null,
    lifecycle_status: lifecycle,
    industry: input.industry?.trim() || null,
    objectives: input.objectives.map((v) => v.trim()).filter(Boolean),
    target_market: input.target_market?.trim() || null,
    current_problem: input.current_problem?.trim() || null,
    contact_person: input.contact_person?.trim() || null,
    budget_indication: input.budget_indication?.trim() || null,
    competitors: input.competitors.map((v) => v.trim()).filter(Boolean),
    discovery_notes: input.discovery_notes?.trim() || null,
  };

  if (lifecycle === "active") payload.activated_at = new Date().toISOString();

  const { data, error } = await db.from("projects").update(payload).eq("id", id).select("*").single();
  if (error) throw error;
  return data as ProjectRow;
}

export async function deleteProject(id: string) {
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) throw error;
}

/* --------------------------- Placement orders ----------------------------- */

export async function fetchPlacementOrders(): Promise<PlacementOrderRow[]> {
  const { data, error } = await supabase
    .from("placement_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as PlacementOrderRow[];
}

export type PlacementOrderInput = {
  project_id: string | null;
  source_domain: string;
  target_url?: string | null;
  keyword?: string | null;
  anchor_text?: string | null;
  status?: string;
  price?: number | null;
  placed_at?: string | null;
  notes?: string | null;
  dr?: number | null;
  traffic?: number | null;
  search_volume?: number | null;
};

export async function createPlacementOrder(input: PlacementOrderInput): Promise<PlacementOrderRow> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Sesi tidak ditemukan, silakan login ulang.");

  const { data, error } = await supabase
    .from("placement_orders")
    .insert({
      user_id: userId,
      project_id: input.project_id,
      source_domain: input.source_domain.trim().toLowerCase(),
      target_url: input.target_url?.trim() || null,
      keyword: input.keyword?.trim() || null,
      anchor_text: input.anchor_text?.trim() || null,
      status: input.status ?? "draft",
      price: input.price ?? null,
      placed_at: input.placed_at || null,
      notes: input.notes?.trim() || null,
      dr: input.dr ?? null,
      traffic: input.traffic ?? null,
      search_volume: input.search_volume ?? null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as unknown as PlacementOrderRow;
}

export async function assignPlacementProject(id: string, projectId: string | null) {
  const { error } = await supabase
    .from("placement_orders")
    .update({ project_id: projectId })
    .eq("id", id);

  if (error) throw error;
}

export async function updatePlacementStatus(id: string, status: string) {
  const { error } = await supabase.from("placement_orders").update({ status }).eq("id", id);

  if (error) throw error;
}

export async function deletePlacementOrder(id: string) {
  const { error } = await supabase.from("placement_orders").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------- Backlinks -------------------------------- */

export async function fetchBacklinks(): Promise<BacklinkRow[]> {
  const { data, error } = await supabase
    .from("backlinks")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as unknown as BacklinkRow[];
}
