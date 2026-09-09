/**
 * Layanan workspace internal (server-only).
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
 * Memastikan user yang sedang login memiliki membership workspace default.
 *
 * SECURITY:
 * - Jika user sudah member, fungsi bersifat idempoten.
 * - Jika workspace sudah memiliki member, user lain TIDAK boleh self-join.
 * - Bootstrap member pertama hanya diberikan kepada akun Auth tertua yang sudah ada.
 *
 * Dengan aturan ini, public signup yang mungkin masih aktif di backend tidak otomatis
 * memberikan akses ke seluruh data internal. Penambahan member berikutnya harus dilakukan
 * secara eksplisit oleh admin/internal team management.
 */
export async function ensureDefaultMembership(userId: string): Promise<WorkspaceMembership | null> {
  const workspace = await getDefaultWorkspace();
  if (!workspace) return null;

  const existing = (await listMemberships(userId)).find(
    (membership) => membership.workspaceId === workspace.id,
  );
  if (existing) return existing;

  const supabase = await admin();
  const { count, error: countError } = await supabase
    .from("app_workspace_members")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .eq("status", "active");

  if (countError) throw countError;
  if ((count ?? 0) > 0) return null;

  // Safe first-member bootstrap: only the oldest existing Auth account may claim it.
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 1000,
  });
  if (usersError) throw usersError;

  const oldest = [...(usersData.users ?? [])].sort((a, b) => {
    const aTime = Date.parse(a.created_at ?? "");
    const bTime = Date.parse(b.created_at ?? "");
    return (Number.isFinite(aTime) ? aTime : Number.MAX_SAFE_INTEGER) -
      (Number.isFinite(bTime) ? bTime : Number.MAX_SAFE_INTEGER);
  })[0];

  if (!oldest || oldest.id !== userId) return null;

  const { error: upsertError } = await supabase.from("app_workspace_members").upsert(
    {
      workspace_id: workspace.id,
      user_id: userId,
      role: "admin",
      status: "active",
    },
    { onConflict: "workspace_id,user_id" },
  );
  if (upsertError) throw upsertError;

  return {
    workspaceId: workspace.id,
    workspaceName: workspace.name,
    role: "admin",
    status: "active",
  };
}
