import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExternalLink, FileText, Link2, Loader2, RefreshCw, StickyNote, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EVIDENCE_SOURCE_LABEL,
  EVIDENCE_STATUS_LABEL,
  addEvidenceLink,
  addEvidenceNote,
  canExtractText,
  fetchEvidence,
  getEvidenceUrl,
  retryEvidenceProcessing,
  uploadEvidenceFile,
  type EvidenceRow,
} from "@/lib/evidence";

function statusTone(status: string) {
  if (status === "processed") return "bg-kpi-lime text-foreground";
  if (status === "failed") return "bg-destructive/10 text-destructive";
  if (status === "pending") return "bg-kpi-cream text-foreground";
  return "bg-muted text-muted-foreground";
}

export function EvidenceWorkspace({
  projectId,
  workspaceId,
}: {
  projectId: string;
  workspaceId: string;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [linkTitle, setLinkTitle] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");

  const evidence = useQuery({
    queryKey: ["evidence", projectId],
    queryFn: () => fetchEvidence(projectId),
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["evidence", projectId] });
  };

  const uploadMutation = useMutation({
    mutationFn: (file: File) => uploadEvidenceFile({ workspaceId, projectId, file }),
    onSuccess: (row) => {
      invalidate();
      toast.success(
        row.processing_status === "processed"
          ? "File tersimpan dan teksnya terbaca."
          : "File tersimpan. Isi file tidak dibaca otomatis pada tahap ini.",
      );
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal mengunggah"),
  });

  const linkMutation = useMutation({
    mutationFn: () =>
      addEvidenceLink({ workspaceId, projectId, url: linkUrl, title: linkTitle }),
    onSuccess: () => {
      setLinkUrl("");
      setLinkTitle("");
      invalidate();
      toast.success("Tautan dicatat sebagai evidence.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal menyimpan tautan"),
  });

  const noteMutation = useMutation({
    mutationFn: () =>
      addEvidenceNote({ workspaceId, projectId, title: noteTitle, text: noteText }),
    onSuccess: () => {
      setNoteTitle("");
      setNoteText("");
      invalidate();
      toast.success("Catatan manual tersimpan.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal menyimpan catatan"),
  });

  const retryMutation = useMutation({
    mutationFn: (row: EvidenceRow) => retryEvidenceProcessing(row),
    onSuccess: () => {
      invalidate();
      toast.success("Pemrosesan ulang berhasil.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal memproses ulang"),
  });

  const rows = evidence.data ?? [];

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold">File &amp; Evidence</h2>
        <p className="text-sm text-muted-foreground">
          Simpan bukti asli dari klien: file, tautan, atau catatan manual. Sumber asli selalu
          dipertahankan meski pemrosesan gagal.
        </p>
      </header>

      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">
            <Upload className="mr-2 size-4" /> Unggah File
          </TabsTrigger>
          <TabsTrigger value="link">
            <Link2 className="mr-2 size-4" /> Tautan
          </TabsTrigger>
          <TabsTrigger value="note">
            <StickyNote className="mr-2 size-4" /> Catatan
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-2 pt-4">
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMutation.mutate(file);
              e.target.value = "";
            }}
          />
          <Button onClick={() => fileRef.current?.click()} disabled={uploadMutation.isPending}>
            {uploadMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <Upload className="mr-2 size-4" />
            )}
            Pilih File
          </Button>
          <p className="text-xs text-muted-foreground">
            Semua tipe file disimpan aman di penyimpanan privat. Pembacaan teks otomatis saat ini
            hanya untuk file teks/CSV/JSON/Markdown. PDF, DOCX, gambar, dan spreadsheet biner
            tersimpan sebagai sumber asli tanpa klaim ekstraksi.
          </p>
        </TabsContent>

        <TabsContent value="link" className="space-y-3 pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ev-url">URL</Label>
              <Input
                id="ev-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://contoh.com/brief"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ev-title">Judul (opsional)</Label>
              <Input
                id="ev-title"
                value={linkTitle}
                onChange={(e) => setLinkTitle(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={() => linkMutation.mutate()} disabled={!linkUrl || linkMutation.isPending}>
            {linkMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Simpan Tautan
          </Button>
        </TabsContent>

        <TabsContent value="note" className="space-y-3 pt-4">
          <div className="space-y-1.5">
            <Label htmlFor="ev-note-title">Judul</Label>
            <Input
              id="ev-note-title"
              value={noteTitle}
              onChange={(e) => setNoteTitle(e.target.value)}
              placeholder="Hasil meeting discovery"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ev-note">Isi Catatan</Label>
            <Textarea
              id="ev-note"
              rows={4}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
            />
          </div>
          <Button
            onClick={() => noteMutation.mutate()}
            disabled={!noteText.trim() || noteMutation.isPending}
          >
            {noteMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Simpan Catatan
          </Button>
        </TabsContent>
      </Tabs>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Daftar Evidence ({rows.length})</h3>
        {evidence.isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat…</p>
        ) : rows.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            Belum ada evidence untuk proyek ini.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {rows.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
                <FileText className="size-4 shrink-0 text-muted-foreground" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{row.title ?? row.original_filename}</p>
                  <p className="text-xs text-muted-foreground">
                    {EVIDENCE_SOURCE_LABEL[row.source_type] ?? row.source_type} ·{" "}
                    {new Date(row.created_at).toLocaleString("id-ID")}
                    {row.processing_error ? ` · ${row.processing_error}` : ""}
                  </p>
                </div>
                <Badge className={statusTone(row.processing_status)} variant="secondary">
                  {EVIDENCE_STATUS_LABEL[row.processing_status] ?? row.processing_status}
                </Badge>
                {row.source_url && (
                  <a
                    href={row.source_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1 text-xs text-primary"
                  >
                    Buka <ExternalLink className="size-3" />
                  </a>
                )}
                {row.storage_path && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        const url = await getEvidenceUrl(row.storage_path as string);
                        window.open(url, "_blank", "noopener");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Gagal membuka file");
                      }
                    }}
                  >
                    Unduh
                  </Button>
                )}
                {row.processing_status === "failed" && canExtractText(row.mime_type) && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => retryMutation.mutate(row)}
                    disabled={retryMutation.isPending}
                  >
                    <RefreshCw className="mr-1.5 size-3.5" /> Coba lagi
                  </Button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
