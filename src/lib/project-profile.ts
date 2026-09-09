import { supabase } from "@/integrations/supabase/client";

/* ------------------------------- Lifecycle -------------------------------- */

export const LIFECYCLE = [
  "prospect",
  "assessment",
  "proposal",
  "active",
  "lost",
  "archived",
] as const;

export type Lifecycle = (typeof LIFECYCLE)[number];

export const LIFECYCLE_LABEL: Record<string, string> = {
  prospect: "Prospek",
  assessment: "Riset / Assessment",
  proposal: "Proposal",
  active: "Aktif",
  lost: "Tidak Lanjut",
  archived: "Arsip",
};

/** Kelas warna badge lifecycle (memakai token semantik). */
export const LIFECYCLE_TONE: Record<string, string> = {
  prospect: "bg-kpi-cream text-foreground border-border",
  assessment: "bg-kpi-aqua text-foreground border-border",
  proposal: "bg-kpi-peach text-foreground border-border",
  active: "bg-kpi-lime text-foreground border-border",
  lost: "bg-destructive/10 text-destructive border-destructive/20",
  archived: "bg-muted text-muted-foreground border-border",
};

/* --------------------------------- Types ---------------------------------- */

export type ProjectFull = {
  id: string;
  workspace_id: string | null;
  user_id: string;
  name: string;
  client_domain: string | null;
  description: string | null;
  status: string;
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

export type ProjectProfilePatch = Partial<
  Pick<
    ProjectFull,
    | "name"
    | "client_domain"
    | "description"
    | "industry"
    | "objectives"
    | "target_market"
    | "current_problem"
    | "contact_person"
    | "budget_indication"
    | "competitors"
    | "discovery_notes"
    | "lifecycle_status"
  >
>;

/** Bersihkan domain tanpa mengubah maksud input manual (tanpa protokol/www/path). */
export function normalizeDomain(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\s+/g, "");
}

/* ------------------------------- Queries ---------------------------------- */

export async function fetchProjectList(): Promise<ProjectFull[]> {
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectFull[];
}

export async function fetchProject(id: string): Promise<ProjectFull> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", id).single();
  if (error) throw error;
  return data as ProjectFull;
}

/** Pembuatan minimal: cukup nama proyek/klien. Domain opsional. */
export async function createProjectMinimal(input: {
  name: string;
  client_domain?: string | null;
  lifecycle_status?: string;
}): Promise<ProjectFull> {
  const name = input.name.trim();
  if (!name) throw new Error("Nama proyek wajib diisi.");

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Sesi tidak ditemukan, silakan login ulang.");

  const domain = input.client_domain ? normalizeDomain(input.client_domain) : "";

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name,
      client_domain: domain || null,
      lifecycle_status: input.lifecycle_status ?? "prospect",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as ProjectFull;
}

export async function updateProjectProfile(
  id: string,
  patch: ProjectProfilePatch,
): Promise<ProjectFull> {
  const payload: Record<string, unknown> = { ...patch };

  if (typeof payload["name"] === "string") {
    const name = (payload["name"] as string).trim();
    if (!name) throw new Error("Nama proyek tidak boleh kosong.");
    payload["name"] = name;
  }
  if (typeof payload["client_domain"] === "string") {
    payload["client_domain"] = normalizeDomain(payload["client_domain"] as string) || null;
  }
  if (payload["lifecycle_status"] === "active") {
    payload["activated_at"] = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("projects")
    .update(payload as never)
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  return data as ProjectFull;
}

export async function setProjectLifecycle(id: string, lifecycle: string) {
  return updateProjectProfile(id, { lifecycle_status: lifecycle });
}
