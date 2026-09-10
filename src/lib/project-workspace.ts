import { supabase } from "@/integrations/supabase/client";

export const PROJECT_LIFECYCLE = [
  "prospect",
  "assessment",
  "proposal",
  "active",
  "lost",
  "archived",
] as const;

export type ProjectLifecycle = (typeof PROJECT_LIFECYCLE)[number];

export const PROJECT_LIFECYCLE_LABEL: Record<ProjectLifecycle, string> = {
  prospect: "Prospect",
  assessment: "Assessment",
  proposal: "Proposal",
  active: "Active",
  lost: "Lost",
  archived: "Archived",
};

export const PROJECT_DATA_SOURCES = [
  { key: "google_search_console", label: "Google Search Console" },
  { key: "ga4", label: "Google Analytics 4" },
  { key: "google_ads", label: "Google Ads" },
] as const;

export const DATA_SOURCE_STATUS = ["not_connected", "available", "not_available"] as const;
export type DataSourceStatus = (typeof DATA_SOURCE_STATUS)[number];

export const DATA_SOURCE_STATUS_LABEL: Record<DataSourceStatus, string> = {
  not_connected: "Belum Dicek",
  available: "Akses Tersedia",
  not_available: "Belum Tersedia",
};

export type ProjectWorkspaceRow = {
  id: string;
  workspace_id: string | null;
  name: string;
  client_domain: string | null;
  description: string | null;
  lifecycle_status: string;
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

export type ProjectEvidenceRow = {
  id: string;
  workspace_id: string;
  project_id: string | null;
  source_type: string;
  title: string | null;
  original_filename: string | null;
  mime_type: string | null;
  storage_path: string | null;
  source_url: string | null;
  raw_text: string | null;
  extracted_metadata: unknown;
  processing_status: string;
  processing_error: string | null;
  created_at: string;
};

export type ProjectDataSourceRow = {
  id: string;
  workspace_id: string;
  project_id: string;
  source_key: string;
  status: string;
  notes: string | null;
  updated_at: string;
};

export type ProjectIntelligenceRunRow = {
  id: string;
  provider: string;
  status: string;
  error: string | null;
  output: ProjectIntelligenceOutput | Record<string, unknown>;
  created_at: string;
};

export type ProjectFieldSuggestionRow = {
  id: string;
  run_id: string | null;
  field: string;
  suggested_value: string;
  rationale: string | null;
  status: string;
  created_at: string;
};

export type ProjectIntelligenceOutput = {
  businessUnderstanding: string;
  clientObjectives: string;
  availableDataAccess: string;
  initialFindings: string;
  missingInformation: string[];
  suggestedQuestions: string[];
  recommendedNextActions: string[];
  fieldSuggestions?: Array<{ field: string; value: string; rationale?: string }>;
};

export async function fetchProjectWorkspace(projectId: string): Promise<ProjectWorkspaceRow> {
  const { data, error } = await supabase.from("projects").select("*").eq("id", projectId).single();
  if (error) throw error;
  return data as ProjectWorkspaceRow;
}

export async function updateProjectFields(
  projectId: string,
  patch: Partial<
    Pick<
      ProjectWorkspaceRow,
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
  >,
) {
  const normalizedPatch: Record<string, unknown> = { ...patch };
  if (patch.lifecycle_status === "active") normalizedPatch["activated_at"] = new Date().toISOString();
  const { error } = await supabase.from("projects").update(normalizedPatch).eq("id", projectId);
  if (error) throw error;
}

export async function fetchProjectEvidence(projectId: string): Promise<ProjectEvidenceRow[]> {
  const { data, error } = await supabase
    .from("project_evidence")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectEvidenceRow[];
}

function safeFilename(name: string) {
  return name
    .normalize("NFKD")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "evidence";
}

const TEXT_MIME_TYPES = new Set([
  "text/plain",
  "text/csv",
  "application/json",
  "text/markdown",
]);

export async function uploadProjectEvidence(project: ProjectWorkspaceRow, file: File) {
  if (!project.workspace_id) throw new Error("Project belum memiliki workspace.");
  const { data: auth, error: authError } = await supabase.auth.getUser();
  if (authError || !auth.user) throw authError ?? new Error("Sesi login tidak ditemukan.");

  const fileName = safeFilename(file.name);
  const storagePath = `${auth.user.id}/${project.id}/${Date.now()}-${fileName}`;
  const { error: uploadError } = await supabase.storage
    .from("project-evidence")
    .upload(storagePath, file, { upsert: false, contentType: file.type || undefined });
  if (uploadError) throw uploadError;

  const canExtractText = TEXT_MIME_TYPES.has(file.type) || /\.(txt|csv|json|md)$/i.test(file.name);
  let rawText: string | null = null;
  let processingStatus = "stored";
  let processingError: string | null = null;

  if (canExtractText && file.size <= 500_000) {
    try {
      rawText = (await file.text()).slice(0, 200_000);
      processingStatus = "ready";
    } catch (error) {
      processingStatus = "stored";
      processingError = error instanceof Error ? error.message : "Text extraction gagal";
    }
  } else if (canExtractText) {
    processingError = "File disimpan, tetapi text extraction dilewati karena ukuran file terlalu besar.";
  } else {
    processingError = "File disimpan sebagai evidence. Format ini belum diparsing otomatis pada Wave 1.";
  }

  const { error: insertError } = await supabase.from("project_evidence").insert({
    workspace_id: project.workspace_id,
    project_id: project.id,
    source_type: "manual_upload",
    title: file.name,
    original_filename: file.name,
    mime_type: file.type || null,
    storage_path: storagePath,
    raw_text: rawText,
    processing_status: processingStatus,
    processing_error: processingError,
    extracted_metadata: {
      size: file.size,
      text_extracted: Boolean(rawText),
    },
  });

  if (insertError) {
    await supabase.storage.from("project-evidence").remove([storagePath]);
    throw insertError;
  }
}

export async function addProjectLinkEvidence(
  project: ProjectWorkspaceRow,
  input: { url: string; title?: string },
) {
  if (!project.workspace_id) throw new Error("Project belum memiliki workspace.");
  const url = input.url.trim();
  try {
    new URL(url);
  } catch {
    throw new Error("URL tidak valid. Gunakan URL lengkap, misalnya https://example.com");
  }

  const { error } = await supabase.from("project_evidence").insert({
    workspace_id: project.workspace_id,
    project_id: project.id,
    source_type: "link",
    title: input.title?.trim() || url,
    source_url: url,
    processing_status: "ready",
    extracted_metadata: { note: "URL evidence; isi halaman tidak dicrawl otomatis pada Wave 1." },
  });
  if (error) throw error;
}

export async function openEvidenceFile(evidence: ProjectEvidenceRow) {
  if (!evidence.storage_path) return;
  const { data, error } = await supabase.storage
    .from("project-evidence")
    .createSignedUrl(evidence.storage_path, 60);
  if (error) throw error;
  window.open(data.signedUrl, "_blank", "noopener,noreferrer");
}

export async function fetchProjectDataSources(project: ProjectWorkspaceRow) {
  if (!project.workspace_id) return [] as ProjectDataSourceRow[];

  const rows = PROJECT_DATA_SOURCES.map((source) => ({
    workspace_id: project.workspace_id!,
    project_id: project.id,
    source_key: source.key,
  }));

  const { error: seedError } = await supabase
    .from("project_data_sources")
    .upsert(rows, { onConflict: "project_id,source_key", ignoreDuplicates: true });
  if (seedError) throw seedError;

  const { data, error } = await supabase
    .from("project_data_sources")
    .select("*")
    .eq("project_id", project.id)
    .order("source_key");
  if (error) throw error;
  return (data ?? []) as ProjectDataSourceRow[];
}

export async function updateProjectDataSource(
  id: string,
  patch: { status?: DataSourceStatus; notes?: string | null },
) {
  const { error } = await supabase.from("project_data_sources").update(patch).eq("id", id);
  if (error) throw error;
}

export async function fetchProjectIntelligenceRuns(projectId: string) {
  const { data, error } = await supabase
    .from("project_intelligence_runs")
    .select("id,provider,status,error,output,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(10);
  if (error) throw error;
  return (data ?? []) as ProjectIntelligenceRunRow[];
}

export async function fetchProjectFieldSuggestions(projectId: string) {
  const { data, error } = await supabase
    .from("project_field_suggestions")
    .select("id,run_id,field,suggested_value,rationale,status,created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ProjectFieldSuggestionRow[];
}

const SUGGESTIBLE_FIELDS = new Set([
  "industry",
  "target_market",
  "current_problem",
  "discovery_notes",
]);

export async function decideProjectFieldSuggestion(input: {
  projectId: string;
  suggestionId: string;
  field: string;
  action: "accept" | "ignore";
  value?: string;
}) {
  if (!SUGGESTIBLE_FIELDS.has(input.field)) throw new Error("Field suggestion tidak didukung.");

  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) throw new Error("Sesi login tidak ditemukan.");

  if (input.action === "accept") {
    const value = String(input.value ?? "").trim();
    const { error: projectError } = await supabase
      .from("projects")
      .update({ [input.field]: value || null })
      .eq("id", input.projectId);
    if (projectError) throw projectError;

    const { error: suggestionError } = await supabase
      .from("project_field_suggestions")
      .update({
        suggested_value: value,
        status: "accepted",
        decided_by: userId,
        decided_at: new Date().toISOString(),
      })
      .eq("id", input.suggestionId);
    if (suggestionError) throw suggestionError;
    return;
  }

  const { error } = await supabase
    .from("project_field_suggestions")
    .update({ status: "ignored", decided_by: userId, decided_at: new Date().toISOString() })
    .eq("id", input.suggestionId);
  if (error) throw error;
}

function normalizeDomain(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[a-z]+:\/\//, "")
    .replace(/^www\./, "")
    .replace(/[/?#].*$/, "")
    .replace(/\.$/, "");
}

function splitCsvLine(line: string, delimiter: string) {
  const out: string[] = [];
  let current = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
    } else if (char === delimiter && !quoted) {
      out.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  out.push(current.trim());
  return out;
}

export type CompetitorImportPreview = {
  delimiter: string;
  headers: string[];
  domainColumn: number;
  domainHeader: string;
  rawCount: number;
  validDomains: string[];
  invalidValues: string[];
};

export function prepareCompetitorImport(rawText: string): CompetitorImportPreview {
  const lines = rawText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (lines.length === 0) throw new Error("File CSV kosong.");

  const candidates = [",", ";", "\t"];
  const delimiter = candidates
    .map((item) => ({ item, count: (lines[0].match(new RegExp(item === "\t" ? "\\t" : `\\${item}`, "g")) ?? []).length }))
    .sort((a, b) => b.count - a.count)[0]?.item ?? ",";

  const headers = splitCsvLine(lines[0], delimiter);
  const normalizedHeaders = headers.map((header) => header.toLowerCase().replace(/[^a-z0-9]+/g, ""));
  const preferred = ["domain", "competitor", "competitordomain", "website", "url", "sitedomain"];
  let domainColumn = normalizedHeaders.findIndex((header) => preferred.includes(header));
  const hasHeader = domainColumn >= 0;
  if (domainColumn < 0) domainColumn = 0;

  const dataLines = hasHeader ? lines.slice(1) : lines;
  const valid: string[] = [];
  const invalid: string[] = [];
  for (const line of dataLines) {
    const cells = splitCsvLine(line, delimiter);
    const raw = cells[domainColumn] ?? "";
    const domain = normalizeDomain(raw);
    if (/^(?=.{1,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(domain)) {
      valid.push(domain);
    } else if (raw) {
      invalid.push(raw);
    }
  }

  return {
    delimiter,
    headers: hasHeader ? headers : ["domain"],
    domainColumn,
    domainHeader: hasHeader ? headers[domainColumn] || "domain" : "domain",
    rawCount: dataLines.length,
    validDomains: [...new Set(valid)],
    invalidValues: invalid.slice(0, 20),
  };
}

export async function saveCompetitorImport(
  project: ProjectWorkspaceRow,
  preview: CompetitorImportPreview,
  originalFilename: string,
) {
  if (!project.workspace_id) throw new Error("Project belum memiliki workspace.");
  if (preview.validDomains.length === 0) throw new Error("Tidak ada domain valid untuk disimpan.");

  const competitors = [...new Set([...(project.competitors ?? []), ...preview.validDomains])];
  const { error: updateError } = await supabase
    .from("projects")
    .update({ competitors })
    .eq("id", project.id);
  if (updateError) throw updateError;

  const { error: importError } = await supabase.from("data_imports").insert({
    workspace_id: project.workspace_id,
    project_id: project.id,
    module: "project_competitors",
    source_type: "csv_upload",
    original_filename: originalFilename,
    mapping: { domain: preview.domainHeader },
    normalization_summary: {
      raw_count: preview.rawCount,
      valid_count: preview.validDomains.length,
      invalid_count: preview.invalidValues.length,
      normalized_domains: preview.validDomains.slice(0, 250),
    },
    status: "confirmed",
  });
  if (importError) throw importError;
}
