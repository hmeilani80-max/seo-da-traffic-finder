import { supabase } from "@/integrations/supabase/client";

export type TableKey = "domain_sudah_pernah" | "traffic_nol" | "sudah_dibeli";

export const TABLE_META: Record<TableKey, { label: string; deskripsi: string }> = {
  domain_sudah_pernah: {
    label: "Domain Sudah Pernah",
    deskripsi: "Domain yang sudah pernah muncul di riwayat pembelian/pengecekan.",
  },
  traffic_nol: {
    label: "Traffic 0",
    deskripsi: "Domain baru dengan organic traffic 0 — tidak direkomendasikan.",
  },
  sudah_dibeli: {
    label: "Sudah Dibeli",
    deskripsi: "Domain baru dengan traffic > 0 dan ditandai sudah dibeli.",
  },
};

export type DomainRow = {
  id: string;
  domain: string;
  dr: number | null;
  traffic: number | null;
  checked_at: string;
  status: string;
  notes: string | null;
  created_at: string;
  keyword?: string | null;
  target_page?: string | null;
  purchase_date?: string | null;
  price?: number | null;
  research_status?: "belum_diriset" | "sedang_diriset" | "selesai" | "gagal" | null;
};

export type LogRow = {
  id: string;
  domain: string;
  hasil: string;
  dr: number | null;
  traffic: number | null;
  pesan: string | null;
  created_at: string;
};

export type SearchHistoryRow = {
  id: string;
  query: string;
  normalized_query: string;
  search_count: number;
  first_searched_at: string;
  last_searched_at: string;
};

export type SearchMatchType =
  | "sama"
  | "mengandung"
  | "terkandung"
  | "tidak_terkait";

export type DomainPriceTotal = {
  table_name: "sudah_dibeli" | "domain_sudah_pernah";
  total_price: number;
  updated_at: string;
};

export async function fetchTable(table: TableKey): Promise<DomainRow[]> {
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .order("checked_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as DomainRow[];
}

export async function fetchDomainPriceTotal(
  table: "sudah_dibeli" | "domain_sudah_pernah",
) {
  const { data, error } = await supabase
    .from("domain_price_totals")
    .select("table_name, total_price, updated_at")
    .eq("table_name", table)
    .maybeSingle();

  if (error) throw error;

  return (
    data ?? {
      table_name: table,
      total_price: 0,
      updated_at: new Date(0).toISOString(),
    }
  ) as DomainPriceTotal;
}

export async function fetchLogs(): Promise<LogRow[]> {
  const { data, error } = await supabase
    .from("check_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  return (data ?? []) as LogRow[];
}

export async function fetchSearchHistory(): Promise<SearchHistoryRow[]> {
  const { data, error } = await supabase
    .from("search_history")
    .select(
      "id, query, normalized_query, search_count, first_searched_at, last_searched_at",
    )
    .order("last_searched_at", { ascending: false })
    .limit(50);

  if (error) throw error;

  return (data ?? []) as SearchHistoryRow[];
}

export function normalizeSearchQuery(input: string) {
  return input.trim().toLowerCase().replace(/\s+/g, " ");
}

export function getSearchMatchType(
  activeQuery: string,
  historyQuery: string,
): SearchMatchType {
  const active = normalizeSearchQuery(activeQuery);
  const history = normalizeSearchQuery(historyQuery);

  if (!active || !history) {
    return "tidak_terkait";
  }

  if (active === history) {
    return "sama";
  }

  if (history.includes(active)) {
    return "mengandung";
  }

  if (active.includes(history)) {
    return "terkandung";
  }

  return "tidak_terkait";
}

export async function saveSearchQuery(input: string) {
  const query = input.trim();
  const normalizedQuery = normalizeSearchQuery(query);

  // Jangan simpan query terlalu pendek.
  if (normalizedQuery.length < 2) return;

  const { data: existing, error: findError } = await supabase
    .from("search_history")
    .select("id, search_count")
    .eq("normalized_query", normalizedQuery)
    .maybeSingle();

  if (findError) throw findError;

  if (existing) {
    const { error } = await supabase
      .from("search_history")
      .update({
        query,
        search_count: existing.search_count + 1,
        last_searched_at: new Date().toISOString(),
      })
      .eq("id", existing.id);

    if (error) throw error;

    return;
  }

  const now = new Date().toISOString();

  const { error } = await supabase.from("search_history").insert({
    query,
    normalized_query: normalizedQuery,
    search_count: 1,
    first_searched_at: now,
    last_searched_at: now,
  });

  if (error) throw error;
}

export async function deleteRow(table: TableKey, id: string) {
  const { error } = await supabase.from(table).delete().eq("id", id);

  if (error) throw error;
}

export async function updateNotes(
  table: TableKey,
  id: string,
  notes: string,
) {
  const { error } = await supabase
    .from(table)
    .update({ notes })
    .eq("id", id);

  if (error) throw error;
}

export function normalizeDomain(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

export async function findExisting(
  domain: string,
): Promise<TableKey | null> {
  const found = await findExistingRow(domain);
  return found ? found.table : null;
}

/**
 * Cari domain (exact, hasil normalisasi) di seluruh tabel riwayat.
 * Mengembalikan baris pertama yang cocok beserta tabel asalnya.
 */
export async function findExistingRow(
  domain: string,
): Promise<{ table: TableKey; row: DomainRow } | null> {
  const normalized = normalizeDomain(domain);

  const tables: TableKey[] = [
    "sudah_dibeli",
    "domain_sudah_pernah",
    "traffic_nol",
  ];

  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .ilike("domain", normalized)
      .order("checked_at", { ascending: false })
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      return { table, row: data[0] as DomainRow };
    }
  }

  return null;
}

/** Simpan hasil riset Apify (DR + traffic) dengan research_status "selesai". */
export async function insertResearchedRow(
  table: TableKey,
  row: {
    domain: string;
    dr: number | null;
    traffic: number | null;
    checked_at: string;
    notes?: string | null;
  },
) {
  const { error } = await supabase.from(table).insert({
    domain: row.domain,
    dr: row.dr,
    traffic: row.traffic,
    checked_at: row.checked_at,
    status: table,
    research_status: "selesai",
    notes: row.notes ?? null,
  });

  if (error) throw error;
}


export async function insertRow(
  table: TableKey,
  row: {
    domain: string;
    dr: number | null;
    traffic: number | null;
    notes?: string | null;
  },
) {
  const { error } = await supabase.from(table).insert({
    domain: row.domain,
    dr: row.dr,
    traffic: row.traffic,
    notes: row.notes ?? null,
    checked_at: new Date().toISOString(),
    status: table,
  });

  if (error) throw error;
}

export async function insertLog(row: {
  domain: string;
  hasil: string;
  dr?: number | null;
  traffic?: number | null;
  pesan?: string | null;
}) {
  const { error } = await supabase.from("check_logs").insert({
    domain: row.domain,
    hasil: row.hasil,
    dr: row.dr ?? null,
    traffic: row.traffic ?? null,
    pesan: row.pesan ?? null,
  });

  if (error) throw error;
}

export function toCSV(rows: DomainRow[]) {
  const header = [
    "Domain",
    "DR/DA",
    "Traffic",
    "Tanggal Dicek",
    "Status",
    "Status Riset",
    "Catatan",
  ];

  const escape = (value: unknown) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const lines = rows.map((row) =>
    [
      row.domain,
      row.dr ?? "",
      row.traffic ?? "",
      new Date(row.checked_at).toLocaleString("id-ID"),
      row.status,
      row.research_status ?? "",
      row.notes ?? "",
    ]
      .map(escape)
      .join(","),
  );

  return [header.map(escape).join(","), ...lines].join("\n");
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");

  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
}
