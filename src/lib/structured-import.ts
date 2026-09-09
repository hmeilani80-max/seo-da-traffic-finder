import { supabase } from "@/integrations/supabase/client";
import { normalizeDomain } from "@/lib/project-profile";

/**
 * Pola import terstruktur yang dapat dipakai ulang:
 * Input → Deteksi → Normalisasi → Pemetaan Field → Validasi → Pratinjau → Konfirmasi → Simpan.
 *
 * Tidak ada baris yang disimpan sebelum user menekan konfirmasi.
 */

export type ImportFieldKey = "domain" | "keyword" | "target_url" | "note" | "ignore";

export type ImportFieldDefinition = {
  key: ImportFieldKey;
  label: string;
  required?: boolean;
  normalize?: (value: string) => string;
  validate?: (value: string) => string | null;
};

export const DOMAIN_LIST_SCHEMA: ImportFieldDefinition[] = [
  {
    key: "domain",
    label: "Domain",
    required: true,
    normalize: normalizeDomain,
    validate: (v) => (/^[a-z0-9.-]+\.[a-z]{2,}$/.test(v) ? null : "Format domain tidak valid"),
  },
  { key: "keyword", label: "Keyword", normalize: (v) => v.trim() },
  {
    key: "target_url",
    label: "Target URL",
    normalize: (v) => v.trim(),
    validate: (v) => (!v || /^https?:\/\//i.test(v) ? null : "URL harus diawali http/https"),
  },
  { key: "note", label: "Catatan", normalize: (v) => v.trim() },
  { key: "ignore", label: "Abaikan kolom" },
];

export type DetectedTable = {
  delimiter: string;
  headers: string[];
  rows: string[][];
  hasHeaderRow: boolean;
};

/** Deteksi pemisah kolom dan baris header dari teks tempel/CSV. */
export function detectTable(text: string): DetectedTable {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { delimiter: ",", headers: [], rows: [], hasHeaderRow: false };
  }

  const candidates = [",", ";", "\t", "|"];
  const first = lines[0] ?? "";
  const delimiter =
    candidates
      .map((d) => ({ d, count: first.split(d).length }))
      .sort((a, b) => b.count - a.count)[0]?.d ?? ",";

  const matrix = lines.map((line) => line.split(delimiter).map((c) => c.trim()));
  const headerCandidate = matrix[0] ?? [];
  const looksLikeHeader = headerCandidate.some((c) =>
    /domain|keyword|url|target|catatan|note/i.test(c),
  );

  return {
    delimiter,
    headers: looksLikeHeader
      ? headerCandidate
      : headerCandidate.map((_, i) => `Kolom ${i + 1}`),
    rows: looksLikeHeader ? matrix.slice(1) : matrix,
    hasHeaderRow: looksLikeHeader,
  };
}

/** Tebakan awal pemetaan kolom → field. Selalu dapat diubah user sebelum simpan. */
export function suggestMapping(headers: string[]): ImportFieldKey[] {
  return headers.map((header) => {
    const h = header.toLowerCase();
    if (/domain|situs|site/.test(h)) return "domain";
    if (/keyword|kata kunci/.test(h)) return "keyword";
    if (/url|halaman|page|target/.test(h)) return "target_url";
    if (/note|catatan|keterangan/.test(h)) return "note";
    return "ignore";
  });
}

export type NormalizedRow = {
  index: number;
  values: Partial<Record<Exclude<ImportFieldKey, "ignore">, string>>;
  raw: string[];
  errors: string[];
  duplicate: boolean;
};

export type ImportPreview = {
  rows: NormalizedRow[];
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
};

export function buildPreview(
  table: DetectedTable,
  mapping: ImportFieldKey[],
  schema: ImportFieldDefinition[] = DOMAIN_LIST_SCHEMA,
): ImportPreview {
  const byKey = new Map(schema.map((f) => [f.key, f]));
  const seen = new Set<string>();
  const rows: NormalizedRow[] = [];

  table.rows.forEach((raw, index) => {
    const values: NormalizedRow["values"] = {};
    const errors: string[] = [];

    mapping.forEach((key, col) => {
      if (key === "ignore") return;
      const def = byKey.get(key);
      const rawValue = raw[col] ?? "";
      const value = def?.normalize ? def.normalize(rawValue) : rawValue.trim();
      if (value) values[key] = value;
    });

    for (const def of schema) {
      if (def.key === "ignore") continue;
      const value = values[def.key];
      if (def.required && !value) {
        errors.push(`${def.label} wajib diisi`);
        continue;
      }
      if (value && def.validate) {
        const message = def.validate(value);
        if (message) errors.push(message);
      }
    }

    const dedupeKey = values.domain ?? "";
    const duplicate = Boolean(dedupeKey) && seen.has(dedupeKey);
    if (dedupeKey) seen.add(dedupeKey);

    rows.push({ index, values, raw, errors, duplicate });
  });

  return {
    rows,
    totalRows: rows.length,
    validRows: rows.filter((r) => r.errors.length === 0 && !r.duplicate).length,
    invalidRows: rows.filter((r) => r.errors.length > 0).length,
    duplicateRows: rows.filter((r) => r.duplicate).length,
  };
}

/**
 * Menyimpan hasil import setelah konfirmasi user.
 * Riwayat import dicatat di `data_imports`, dan hasil normalisasi disimpan
 * sebagai evidence proyek sehingga sumber asli tetap tersimpan.
 */
export async function commitImport(params: {
  workspaceId: string;
  projectId: string;
  module: string;
  originalFilename: string | null;
  mapping: ImportFieldKey[];
  headers: string[];
  preview: ImportPreview;
  rawText: string;
}) {
  const includedRows = params.preview.rows.filter((r) => r.errors.length === 0 && !r.duplicate);

  const { data: importRow, error } = await supabase
    .from("data_imports")
    .insert({
      workspace_id: params.workspaceId,
      project_id: params.projectId,
      module: params.module,
      source_type: "manual_upload",
      original_filename: params.originalFilename,
      mapping: Object.fromEntries(params.headers.map((h, i) => [h, params.mapping[i] ?? "ignore"])),
      normalization_summary: {
        total_rows: params.preview.totalRows,
        valid_rows: params.preview.validRows,
        invalid_rows: params.preview.invalidRows,
        duplicate_rows: params.preview.duplicateRows,
        saved_rows: includedRows.map((r) => r.values),
      } as never,
      status: "confirmed",
    })
    .select("id")
    .single();

  if (error) throw error;

  const { addEvidenceNote } = await import("@/lib/evidence");
  await addEvidenceNote({
    workspaceId: params.workspaceId,
    projectId: params.projectId,
    title: params.originalFilename ?? "Import data terstruktur",
    text: params.rawText.slice(0, 200_000),
    sourceType: "structured_import",
    metadata: {
      import_id: importRow?.id ?? null,
      total_rows: params.preview.totalRows,
      saved_rows: includedRows.length,
    },
  });

  return { importId: importRow?.id ?? null, savedRows: includedRows.length };
}

export async function fetchProjectImports(projectId: string) {
  const { data, error } = await supabase
    .from("data_imports")
    .select("id, module, original_filename, status, normalization_summary, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
