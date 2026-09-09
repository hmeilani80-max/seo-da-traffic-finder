/**
 * Wave 0 — layanan workspace internal (server-only).
 *
 * Model akses: seluruh anggota aktif workspace dapat melihat Project bersama.
 * RLS tetap aktif; akses diberikan hanya melalui keanggotaan eksplisit.
 */

const DEFAULT_WORKSPACE_SLUG = "internal-seo-team";

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type WorkspaceMembership = {
  workspaceId: string;
  workspaceName: string;
  role: string;
  status: string;
};

/** Workspace internal default (dibuat oleh migrasi Wave 0). */
export async function getDefaultWorkspace(): Promise<{ id: string; name: string } | null> {
  const supabase = await admin();
  const { data } = await supabase
    .from("app_workspaces")
    .select("id, name")
    .eq("slug", DEFAULT_WORKSPACE_SLUG)
    .maybeSingle();

  return data ? { id: data.id, name: data.name } : null;
}

/** Keanggotaan aktif seorang user. */
export async function listMemberships(userId: string): Promise<WorkspaceMembership[]> {
  const supabase = await admin();
  const { data, error } = await supabase
    .from("app_workspace_members")
    .select("workspace_id, role, status, app_workspaces(name)")
    .eq("user_id", userId)
    .eq("status", "active");

  if (error) throw error;

  return (data ?? []).map((row) => ({
    workspaceId: row.workspace_id,
    workspaceName:
      (row as unknown as { app_workspaces?: { name?: string } }).app_workspaces?.name ?? "",
    role: row.role,
    status: row.status,
  }));
}

/**
 * Memastikan user internal yang sudah terautentikasi terdaftar pada workspace default.
 * Idempoten; tidak pernah membuat keanggotaan untuk user yang tidak dikenal.
 */
export async function ensureDefaultMembership(userId: string): Promise<WorkspaceMembership | null> {
  const workspace = await getDefaultWorkspace();
  if (!workspace) return null;

  const supabase = await admin();
  await supabase
    .from("app_workspace_members")
    .upsert(
      { workspace_id: workspace.id, user_id: userId, role: "member", status: "active" },
      { onConflict: "workspace_id,user_id" },
    );

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    role: "member",
    status: "active",
  };
}
