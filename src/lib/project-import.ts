import { supabase } from "@/integrations/supabase/client";
import type { ProjectRow } from "@/lib/projects";

export const PROJECT_IMPORT_FIELDS = [
  "industry",
  "target_market",
  "current_problem",
  "contact_person",
  "budget_indication",
  "objectives",
  "competitors",
  "discovery_notes",
] as const;

export type ProjectImportField = (typeof PROJECT_IMPORT_FIELDS)[number];
export type ProjectImportMapping = Record<string, ProjectImportField | "ignore">;

export type ParsedStructuredFile = {
  delimiter: string;
  headers: string[];
  rows: Record<string, string>[];
};

const ALIASES: Record<ProjectImportField, string[]> = {
  industry: ["industry", "industri", "business industry"],
  target_market: ["target market", "target_market", "market", "pasar", "target audience"],
  current_problem: ["current problem", "current_problem", "problem", "pain point", "masalah"],
  contact_person: ["contact person", "contact_person", "pic", "contact", "kontak"],
  budget_indication: ["budget", "budget indication", "budget_indication", "anggaran"],
  objectives: ["objectives", "objective", "goals", "goal", "tujuan"],
  competitors: ["competitors", "competitor", "pesaing"],
  discovery_notes: ["discovery notes", "discovery_notes", "notes", "catatan", "brief"],
};

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ");
}

export function autoMapProjectImportHeaders(headers: string[]): ProjectImportMapping {
  const result: ProjectImportMapping = {};
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    const target = PROJECT_IMPORT_FIELDS.find((field) =>
      ALIASES[field].some((alias) => normalizeHeader(alias) === normalized),
    );
    result[header] = target ?? "ignore";
  }
  return result;
}

function countOutsideQuotes(line: string, delimiter: string): number {
  let quoted = false;
  let count = 0;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') index += 1;
      else quoted = !quoted;
    } else if (!quoted && char === delimiter) count += 1;
  }
  return count;
}

function detectDelimiter(firstLine: string): string {
  const candidates = [",", "\t", ";"];
  return candidates.sort(
    (a, b) => countOutsideQuotes(firstLine, b) - countOutsideQuotes(firstLine, a),
  )[0] ?? ",";
}

function parseDelimitedLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

export function parseStructuredText(text: string): ParsedStructuredFile {
  const normalizedText = text.replace(/^\uFEFF/, "").trim();
  const lines = normalizedText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) throw new Error("File harus memiliki header dan minimal satu baris data.");

  const firstLine = lines[0];
  if (!firstLine) throw new Error("Header file tidak ditemukan.");

  const delimiter = detectDelimiter(firstLine);
  const headers = parseDelimitedLine(firstLine, delimiter).map((header, index) =>
    header || `column_${index + 1}`,
  );
  const rows = lines.slice(1, 51).map((line) => {
    const values = parseDelimitedLine(line, delimiter);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
  return { delimiter, headers, rows };
}

function mergeValues(rows: Record<string, string>[], sourceHeader: string, target: ProjectImportField) {
  const values = rows.map((row) => row[sourceHeader]?.trim()).filter(Boolean) as string[];
  if (target === "objectives" || target === "competitors") {
    return Array.from(
      new Set(values.flatMap((value) => value.split(/[|;\n]+/).map((item) => item.trim()).filter(Boolean))),
    );
  }
  return values.find(Boolean) ?? null;
}

export function buildProjectImportPreview(
  parsed: ParsedStructuredFile,
  mapping: ProjectImportMapping,
): Partial<Record<ProjectImportField, string | string[] | null>> {
  const output: Partial<Record<ProjectImportField, string | string[] | null>> = {};
  for (const header of parsed.headers) {
    const target = mapping[header];
    if (!target || target === "ignore") continue;
    output[target] = mergeValues(parsed.rows, header, target);
  }
  return output;
}

function db() {
  return supabase as any;
}

export async function saveProjectContextImport(input: {
  project: ProjectRow;
  fileName: string;
  rawText: string;
  parsed: ParsedStructuredFile;
  mapping: ProjectImportMapping;
}): Promise<void> {
  if (!input.project.workspace_id) throw new Error("Project belum memiliki workspace.");
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) throw new Error("Sesi tidak ditemukan, silakan login ulang.");

  const preview = buildProjectImportPreview(input.parsed, input.mapping);
  if (Object.keys(preview).length === 0) throw new Error("Map minimal satu kolom ke Project field.");

  const database = db();
  const { data: importRow, error: importError } = await database
    .from("data_imports")
    .insert({
      workspace_id: input.project.workspace_id,
      project_id: input.project.id,
      module: "project_context",
      source_type: "structured_file",
      original_filename: input.fileName,
      mapping: input.mapping,
      normalization_summary: {
        detected_delimiter: input.parsed.delimiter === "\t" ? "tab" : input.parsed.delimiter,
        headers: input.parsed.headers,
        rows_detected: input.parsed.rows.length,
        fields_to_update: Object.keys(preview),
      },
      status: "processing",
      created_by: auth.user.id,
    })
    .select("id")
    .single();
  if (importError || !importRow) throw importError ?? new Error("Gagal membuat import record.");

  const { error: updateError } = await database.from("projects").update(preview).eq("id", input.project.id);
  if (updateError) {
    await database
      .from("data_imports")
      .update({ status: "error", error: updateError.message })
      .eq("id", importRow.id);
    throw updateError;
  }

  const { error: evidenceError } = await database.from("project_evidence").insert({
    workspace_id: input.project.workspace_id,
    project_id: input.project.id,
    created_by: auth.user.id,
    source_type: "structured_import",
    title: input.fileName,
    original_filename: input.fileName,
    mime_type: "text/csv",
    raw_text: input.rawText.slice(0, 250000),
    processing_status: "ready",
    extracted_metadata: {
      import_id: importRow.id,
      rows_detected: input.parsed.rows.length,
      mapped_fields: Object.keys(preview),
    },
  });

  await database
    .from("data_imports")
    .update({
      status: evidenceError ? "completed_with_warning" : "completed",
      error: evidenceError?.message ?? null,
    })
    .eq("id", importRow.id);

  if (evidenceError) {
    throw new Error(`Project ter-update, tetapi evidence import gagal disimpan: ${evidenceError.message}`);
  }
}
