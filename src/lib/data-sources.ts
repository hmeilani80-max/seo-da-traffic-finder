import { supabase } from "@/integrations/supabase/client";

/**
 * Registry sumber data per Project.
 *
 * `availability` menjelaskan kondisi teknis nyata di aplikasi saat ini.
 * Wave 1 belum memiliki OAuth/connector production, sehingga UI tidak boleh
 * mengklaim sebuah source sebagai benar-benar connected.
 */
export type SourceAvailability = "planned_connector" | "manual_only";

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
    availability: "planned_connector",
    description: "Query, klik, impresi, dan indexing. Koneksi otomatis belum diaktifkan di aplikasi.",
  },
  {
    key: "google_analytics_4",
    label: "Google Analytics 4",
    category: "Analytics",
    availability: "planned_connector",
    description: "Trafik organik, konversi, dan perilaku pengguna. Koneksi otomatis belum aktif.",
  },
  {
    key: "google_ads",
    label: "Google Ads",
    category: "Paid",
    availability: "planned_connector",
    description: "Konteks kata kunci berbayar dan biaya akuisisi. Koneksi otomatis belum aktif.",
  },
  {
    key: "meta_ads",
    label: "Meta Ads",
    category: "Paid",
    availability: "planned_connector",
    description: "Data campaign dan conversion context. Gunakan evidence manual sampai connector aktif.",
  },
  {
    key: "tiktok_ads",
    label: "TikTok Ads",
    category: "Paid",
    availability: "planned_connector",
    description: "Data campaign dan conversion context. Gunakan evidence manual sampai connector aktif.",
  },
  {
    key: "shopify",
    label: "Shopify",
    category: "Ecommerce",
    availability: "planned_connector",
    description: "Data produk, transaksi, dan conversion. Gunakan evidence manual sampai connector aktif.",
  },
  {
    key: "woocommerce",
    label: "WooCommerce",
    category: "Ecommerce",
    availability: "planned_connector",
    description: "Data toko WooCommerce. Gunakan evidence manual sampai connector aktif.",
  },
  {
    key: "wordpress_cms",
    label: "WordPress / CMS",
    category: "CMS",
    availability: "manual_only",
    description: "Catat ketersediaan akses CMS secara manual pada tahap discovery.",
  },
  {
    key: "hosting_server",
    label: "Hosting / Server",
    category: "Access",
    availability: "manual_only",
    description: "Catat apakah tim mendapat akses hosting/server untuk kebutuhan technical SEO.",
  },
];

export const SOURCE_STATUS = ["not_connected", "manual_evidence", "requested"] as const;
export type SourceStatus = (typeof SOURCE_STATUS)[number];

export const SOURCE_STATUS_LABEL: Record<string, string> = {
  not_connected: "Belum Terhubung",
  manual_evidence: "Bukti Manual / Akses Tersedia",
  requested: "Akses Diminta",
  // Dipertahankan untuk kompatibilitas data di masa depan, tetapi tidak dapat dipilih pada Wave 1.
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

  if (!SOURCE_STATUS.includes(params.status as SourceStatus)) {
    throw new Error("Status sumber data belum didukung pada fase ini.");
  }

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
