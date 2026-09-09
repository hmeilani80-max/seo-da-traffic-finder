import { supabase } from "@/integrations/supabase/client";

/**
 * Registry sumber data per Project.
 *
 * `availability` menjelaskan kondisi teknis nyata di aplikasi saat ini —
 * tidak ada koneksi OAuth palsu pada Wave 1.
 */
export type SourceAvailability = "connector_available" | "not_implemented";

export type DataSourceDefinition = {
  key: string;
  label: string;
  category: string;
  availability: SourceAvailability;
  description: string;
};

export const DATA_SOURCE_CATALOG: DataSourceDefinition[] = [
  {
    key: "google_search_console",
    label: "Google Search Console",
    category: "Search",
    availability: "connector_available",
    description: "Query, klik, impresi, dan indexing. Koneksi resmi belum diaktifkan di aplikasi.",
  },
  {
    key: "google_analytics_4",
    label: "Google Analytics 4",
    category: "Analytics",
    availability: "connector_available",
    description: "Trafik organik, konversi, dan perilaku pengguna.",
  },
  {
    key: "google_ads",
    label: "Google Ads",
    category: "Paid",
    availability: "connector_available",
    description: "Konteks kata kunci berbayar dan biaya akuisisi.",
  },
  {
    key: "shopify",
    label: "Shopify",
    category: "Ecommerce",
    availability: "not_implemented",
    description: "Data produk dan penjualan. Belum tersedia; gunakan bukti manual.",
  },
  {
    key: "woocommerce",
    label: "WooCommerce",
    category: "Ecommerce",
    availability: "not_implemented",
    description: "Data toko WooCommerce. Belum tersedia; gunakan bukti manual.",
  },
  {
    key: "wordpress_cms",
    label: "WordPress / CMS",
    category: "CMS",
    availability: "not_implemented",
    description: "Akses publikasi konten dan perbaikan on-page.",
  },
];

export const SOURCE_STATUS = ["not_connected", "manual_evidence", "requested", "connected"] as const;
export type SourceStatus = (typeof SOURCE_STATUS)[number];

export const SOURCE_STATUS_LABEL: Record<string, string> = {
  not_connected: "Belum Terhubung",
  manual_evidence: "Bukti Manual",
  requested: "Akses Diminta",
  connected: "Terhubung",
};

export type ProjectDataSourceRow = {
  id: string;
  project_id: string;
  workspace_id: string;
  source_key: string;
  status: string;
  notes: string | null;
  updated_at: string;
};

export async function fetchProjectDataSources(projectId: string): Promise<ProjectDataSourceRow[]> {
  const { data, error } = await supabase
    .from("project_data_sources")
    .select("*")
    .eq("project_id", projectId);
  if (error) throw error;
  return (data ?? []) as ProjectDataSourceRow[];
}

export async function upsertProjectDataSource(params: {
  workspaceId: string;
  projectId: string;
  sourceKey: string;
  status: string;
  notes?: string | null;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Sesi tidak ditemukan, silakan login ulang.");

  const { error } = await supabase.from("project_data_sources").upsert(
    {
      workspace_id: params.workspaceId,
      project_id: params.projectId,
      source_key: params.sourceKey,
      status: params.status,
      notes: params.notes ?? null,
      updated_by: userId,
    },
    { onConflict: "project_id,source_key" },
  );

  if (error) throw error;
}
