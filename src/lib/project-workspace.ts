import { supabase } from "@/integrations/supabase/client";
import type { ProjectRow } from "@/lib/projects";

export type ProjectEvidenceRow = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  created_by: string;
  source_type: string;
  title: string | null;
  original_filename: string | null;
  mime_type: string | null;
  storage_path: string | null;
  source_url: string | null;
  raw_text: string | null;
  extracted_metadata: Record<string, unknown>;
  processing_status: string;
  processing_error: string | null;
  created_at: string;
  updated_at: string;
};

export type ProjectDataSourceRow = {
  id: string;
  workspace_id: string;
  project_id: string;
  source_key: string;
  status: string;
  notes: string | null;
  updated_by: string;
  created_at: string;
  updated_at: string;
};

export type ProjectWorkspaceSummary = {
  evidenceCount: number;
  sourceCount: number;
  readySourceCount: number;
  intelligenceRunCount: number;
  placementOrderCount: number;
  backlinkCount: number;
};

export const PROJECT_DATA_SOURCE_CATALOG = [
  {
    key: "ahrefs_apify",
    label: "Ahrefs / Apify",
    category: "SEO Intelligence",
    note: "Provider SEO global aplikasi. Status project di bawah adalah registry akses/kesiapan, bukan OAuth connection.",
  },
  {
    key: "google_search_console",
    label: "Google Search Console",
    category: "Search Performance",
    note: "Registry akses project. Integrasi API belum diaktifkan pada Wave 1 ini.",
  },
  {
    key: "google_analytics_4",
    label: "Google Analytics 4",
    category: "Analytics",
    note: "Registry akses project. Integrasi API belum diaktifkan pada Wave 1 ini.",
  },
  {
    key: "google_ads",
    label: "Google Ads",
    category: "Advertising",
    note: "Registry akses project. Tidak ada automatic sync pada Wave 1 ini.",
  },
  {
    key: "cms",
    label: "CMS / Website Access",
    category: "Website",
    note: "Catat apakah tim memiliki akses CMS atau teknis yang diperlukan.",
  },
  {
    key: "manual_import",
    label: "Manual Import",
    category: "Evidence",
    note: "File atau data yang diberikan manual oleh client/tim.",
  },
] as const;

export const DATA_SOURCE_STATUS = [
  "not_connected",
  "access_available",
  "connected_external",
  "error",
] as const;

export const DATA_SOURCE_STATUS_LABEL: Record<string, string> = {
  not_connected: "Belum Tersedia",
  access_available: "Akses Tersedia",
  connected_external: "Terhubung Eksternal",
  error: "Perlu Perhatian",
};

function requireWorkspace(project: ProjectRow): string {
  if (!project.workspace_id) {
    throw new Error("Project belum memiliki workspace. Muat ulang project atau hubungi admin.");
  }
  return project.workspace_id;
}

// The production database already contains Wave 0/1 tables, while the generated
// Supabase TS file still trails that schema. Keep the temporary untyped boundary
// isolated in this service until generated types are refreshed.
function db() {
  return supabase as any;
}

export async function fetchProjectEvidence(projectId: string): Promise<ProjectEvidenceRow[]> {
  const { data, error } = await db()
    .from("project_evidence")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectEvidenceRow[];
}

export async function addProjectLinkEvidence(
  project: ProjectRow,
  input: { title?: string; url: string },
): Promise<ProjectEvidenceRow> {
  const workspaceId = requireWorkspace(project);
  const url = input.url.trim();
  if (!/^https?:\/\//i.test(url)) throw new Error("Link harus diawali http:// atau https://");

  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sesi tidak ditemukan, silakan login ulang.");

  const { data, error } = await db()
    .from("project_evidence")
    .insert({
      workspace_id: workspaceId,
      project_id: project.id,
      created_by: auth.user.id,
      source_type: "external_link",
      title: input.title?.trim() || url,
      source_url: url,
      processing_status: "stored",
      extracted_metadata: { extraction: "not_configured" },
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as ProjectEvidenceRow;
}

function safeFileName(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "evidence-file";
}

export async function uploadProjectEvidence(
  project: ProjectRow,
  file: File,
): Promise<ProjectEvidenceRow> {
  const workspaceId = requireWorkspace(project);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sesi tidak ditemukan, silakan login ulang.");
  if (file.size > 50 * 1024 * 1024) throw new Error("Ukuran file maksimal 50 MB.");

  const storagePath = `${auth.user.id}/${project.id}/${crypto.randomUUID()}-${safeFileName(file.name)}`;
  const uploadOptions = file.type
    ? { upsert: false, contentType: file.type }
    : { upsert: false };
  const { error: uploadError } = await supabase.storage
    .from("project-evidence")
    .upload(storagePath, file, uploadOptions);
  if (uploadError) throw uploadError;

  const { data, error } = await db()
    .from("project_evidence")
    .insert({
      workspace_id: workspaceId,
      project_id: project.id,
      created_by: auth.user.id,
      source_type: "manual_upload",
      title: file.name,
      original_filename: file.name,
      mime_type: file.type || null,
      storage_path: storagePath,
      processing_status: "stored",
      extracted_metadata: { extraction: "not_configured", size_bytes: file.size },
    })
    .select("*")
    .single();

  if (error) {
    await supabase.storage.from("project-evidence").remove([storagePath]);
    throw error;
  }
  return data as ProjectEvidenceRow;
}

export async function deleteProjectEvidence(row: ProjectEvidenceRow): Promise<void> {
  if (row.storage_path) {
    const { error: storageError } = await supabase.storage
      .from("project-evidence")
      .remove([row.storage_path]);
    if (storageError) throw storageError;
  }
  const { error } = await db().from("project_evidence").delete().eq("id", row.id);
  if (error) throw error;
}

export async function fetchProjectDataSources(projectId: string): Promise<ProjectDataSourceRow[]> {
  const { data, error } = await db()
    .from("project_data_sources")
    .select("*")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectDataSourceRow[];
}

export async function upsertProjectDataSource(
  project: ProjectRow,
  input: { sourceKey: string; status: string; notes?: string | null },
): Promise<ProjectDataSourceRow> {
  const workspaceId = requireWorkspace(project);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sesi tidak ditemukan, silakan login ulang.");

  const status = DATA_SOURCE_STATUS.includes(input.status as (typeof DATA_SOURCE_STATUS)[number])
    ? input.status
    : "not_connected";

  const { data, error } = await db()
    .from("project_data_sources")
    .upsert(
      {
        workspace_id: workspaceId,
        project_id: project.id,
        source_key: input.sourceKey,
        status,
        notes: input.notes?.trim() || null,
        updated_by: auth.user.id,
      },
      { onConflict: "project_id,source_key" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return data as ProjectDataSourceRow;
}

export async function fetchProjectWorkspaceSummary(
  projectId: string,
): Promise<ProjectWorkspaceSummary> {
  const database = db();
  const [evidence, sources, intelligence, orders, backlinks] = await Promise.all([
    database.from("project_evidence").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    database.from("project_data_sources").select("status").eq("project_id", projectId),
    database.from("project_intelligence_runs").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("placement_orders").select("id", { count: "exact", head: true }).eq("project_id", projectId),
    supabase.from("backlinks").select("id", { count: "exact", head: true }).eq("project_id", projectId),
  ]);

  for (const result of [evidence, sources, intelligence, orders, backlinks]) {
    if (result.error) throw result.error;
  }

  const sourceRows = (sources.data ?? []) as { status: string }[];
  return {
    evidenceCount: evidence.count ?? 0,
    sourceCount: sourceRows.length,
    readySourceCount: sourceRows.filter((row) =>
      ["access_available", "connected_external"].includes(row.status),
    ).length,
    intelligenceRunCount: intelligence.count ?? 0,
    placementOrderCount: orders.count ?? 0,
    backlinkCount: backlinks.count ?? 0,
  };
}
