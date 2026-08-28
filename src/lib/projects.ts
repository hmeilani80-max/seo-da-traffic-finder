import { supabase } from "@/integrations/supabase/client";

export type ProjectRow = {
  id: string;
  name: string;
  client_domain: string | null;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type PlacementOrderRow = {
  id: string;
  project_id: string | null;
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

export const PLACEMENT_STATUS = [
  "draft",
  "dipesan",
  "tayang",
  "batal",
] as const;

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
  return (data ?? []) as ProjectRow[];
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
  return (data ?? []) as PlacementOrderRow[];
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

export async function createPlacementOrder(
  input: PlacementOrderInput,
): Promise<PlacementOrderRow> {
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
  return data as PlacementOrderRow;
}

export async function assignPlacementProject(
  id: string,
  projectId: string | null,
) {
  const { error } = await supabase
    .from("placement_orders")
    .update({ project_id: projectId })
    .eq("id", id);

  if (error) throw error;
}

export async function updatePlacementStatus(id: string, status: string) {
  const { error } = await supabase
    .from("placement_orders")
    .update({ status })
    .eq("id", id);

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
  return (data ?? []) as BacklinkRow[];
}
