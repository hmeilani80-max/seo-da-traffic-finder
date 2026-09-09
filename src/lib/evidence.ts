import { supabase } from "@/integrations/supabase/client";

export const EVIDENCE_BUCKET = "project-evidence";

export type EvidenceRow = {
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

export const EVIDENCE_SOURCE_LABEL: Record<string, string> = {
  manual_upload: "Unggahan File",
  link: "Tautan",
  manual_note: "Catatan Manual",
  structured_import: "Import Terstruktur",
};

export const EVIDENCE_STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  stored: "Tersimpan",
  processed: "Terproses",
  failed: "Gagal",
};

/**
 * Tipe file yang teksnya dapat dibaca langsung oleh aplikasi pada Wave 1.
 * Selain ini file tetap disimpan aman, tapi TIDAK diklaim terekstraksi.
 */
const TEXT_EXTRACTABLE = ["text/plain", "text/csv", "text/markdown", "application/json"];

export function canExtractText(mime: string | null): boolean {
  if (!mime) return false;
  return TEXT_EXTRACTABLE.some((t) => mime.startsWith(t));
}

export async function fetchEvidence(projectId: string): Promise<EvidenceRow[]> {
  const { data, error } = await supabase
    .from("project_evidence")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as EvidenceRow[];
}

async function currentUserId(): Promise<string> {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Sesi tidak ditemukan, silakan login ulang.");
  return id;
}

export async function uploadEvidenceFile(params: {
  workspaceId: string;
  projectId: string;
  file: File;
  title?: string;
}): Promise<EvidenceRow> {
  const userId = await currentUserId();
  const safeName = params.file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${params.projectId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .upload(path, params.file, { upsert: false });

  if (uploadError) throw new Error(`Gagal mengunggah file: ${uploadError.message}`);

  const mime = params.file.type || null;
  let rawText: string | null = null;
  let status = "stored";
  let processingError: string | null = null;

  if (canExtractText(mime)) {
    try {
      rawText = (await params.file.text()).slice(0, 200_000);
      status = "processed";
    } catch (e) {
      // Sumber asli tetap dipertahankan meski pembacaan teks gagal.
      status = "failed";
      processingError = e instanceof Error ? e.message : "Gagal membaca isi file";
    }
  }

  const { data, error } = await supabase
    .from("project_evidence")
    .insert({
      workspace_id: params.workspaceId,
      project_id: params.projectId,
      created_by: userId,
      source_type: "manual_upload",
      title: params.title?.trim() || params.file.name,
      original_filename: params.file.name,
      mime_type: mime,
      storage_path: path,
      raw_text: rawText,
      processing_status: status,
      processing_error: processingError,
      extracted_metadata: { size_bytes: params.file.size, text_extracted: rawText !== null },
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as EvidenceRow;
}

export async function addEvidenceLink(params: {
  workspaceId: string;
  projectId: string;
  url: string;
  title?: string;
  note?: string;
}): Promise<EvidenceRow> {
  const userId = await currentUserId();
  const url = params.url.trim();
  if (!/^https?:\/\//i.test(url)) throw new Error("Tautan harus diawali http:// atau https://");

  const { data, error } = await supabase
    .from("project_evidence")
    .insert({
      workspace_id: params.workspaceId,
      project_id: params.projectId,
      created_by: userId,
      source_type: "link",
      title: params.title?.trim() || url,
      source_url: url,
      raw_text: params.note?.trim() || null,
      // Tautan hanya dicatat pada Wave 1; isi halaman belum di-crawl.
      processing_status: "stored",
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as EvidenceRow;
}

export async function addEvidenceNote(params: {
  workspaceId: string;
  projectId: string;
  title: string;
  text: string;
  sourceType?: string;
  metadata?: Record<string, unknown>;
}): Promise<EvidenceRow> {
  const userId = await currentUserId();
  const text = params.text.trim();
  if (!text) throw new Error("Isi catatan tidak boleh kosong.");

  const { data, error } = await supabase
    .from("project_evidence")
    .insert({
      workspace_id: params.workspaceId,
      project_id: params.projectId,
      created_by: userId,
      source_type: params.sourceType ?? "manual_note",
      title: params.title.trim() || "Catatan manual",
      raw_text: text,
      processing_status: "processed",
      extracted_metadata: (params.metadata ?? {}) as never,
    })
    .select("*")
    .single();

  if (error) throw error;
  return data as EvidenceRow;
}

/** Coba baca ulang isi file teks yang sebelumnya gagal. Sumber asli tidak dihapus. */
export async function retryEvidenceProcessing(row: EvidenceRow): Promise<void> {
  if (!row.storage_path || !canExtractText(row.mime_type)) {
    throw new Error("Tipe sumber ini belum didukung untuk ekstraksi teks otomatis.");
  }

  const { data, error } = await supabase.storage.from(EVIDENCE_BUCKET).download(row.storage_path);
  if (error || !data) {
    await supabase
      .from("project_evidence")
      .update({
        processing_status: "failed",
        processing_error: error?.message ?? "File tidak dapat diunduh",
      })
      .eq("id", row.id);
    throw new Error(error?.message ?? "File tidak dapat diunduh");
  }

  const text = (await data.text()).slice(0, 200_000);
  const { error: updateError } = await supabase
    .from("project_evidence")
    .update({ raw_text: text, processing_status: "processed", processing_error: null })
    .eq("id", row.id);
  if (updateError) throw updateError;
}

export async function getEvidenceUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(storagePath, 60 * 10);
  if (error || !data) throw new Error(error?.message ?? "Gagal membuat tautan file");
  return data.signedUrl;
}
