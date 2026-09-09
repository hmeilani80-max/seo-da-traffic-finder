import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link2, Loader2, Trash2, UploadCloud } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  addProjectLinkEvidence,
  deleteProjectEvidence,
  uploadProjectEvidence,
  type ProjectEvidenceRow,
} from "@/lib/project-workspace";
import type { ProjectRow } from "@/lib/projects";

export function ProjectEvidencePanel({
  project,
  rows,
  loading,
  onChanged,
}: {
  project: ProjectRow;
  rows: ProjectEvidenceRow[];
  loading: boolean;
  onChanged: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const upload = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Pilih file terlebih dahulu.");
      return uploadProjectEvidence(project, file);
    },
    onSuccess: () => {
      setFile(null);
      toast.success("Evidence tersimpan");
      onChanged();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Gagal upload evidence"),
  });

  const addLink = useMutation({
    mutationFn: () => addProjectLinkEvidence(project, { title: linkTitle, url: linkUrl }),
    onSuccess: () => {
      setLinkTitle("");
      setLinkUrl("");
      toast.success("Link evidence ditambahkan");
      onChanged();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Gagal menambah link"),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Tambah Evidence</CardTitle>
          <CardDescription>
            File disimpan privat. Upload biasa belum dianggap sudah diparsing/extracted.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2 font-medium"><UploadCloud className="size-4" /> Upload File</div>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">Maksimal 50 MB. File disimpan sebagai source evidence.</p>
            <Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
              {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              Simpan File
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2 font-medium"><Link2 className="size-4" /> Add Link</div>
            <Input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="Judul / keterangan" />
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            <p className="text-xs text-muted-foreground">Link diregistrasikan; kontennya belum otomatis di-crawl.</p>
            <Button onClick={() => addLink.mutate()} disabled={!linkUrl.trim() || addLink.isPending}>
              {addLink.isPending ? <Loader2 className="size-4 animate-spin" /> : <Link2 className="size-4" />}
              Tambah Link
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project Evidence</CardTitle>
          <CardDescription>{rows.length} item tersimpan.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Memuat evidence…</div>
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Belum ada evidence. Tambahkan brief, laporan lama, spreadsheet, atau link relevan.
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {rows.map((row) => <EvidenceRow key={row.id} row={row} onChanged={onChanged} />)}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EvidenceRow({ row, onChanged }: { row: ProjectEvidenceRow; onChanged: () => void }) {
  const remove = useMutation({
    mutationFn: () => deleteProjectEvidence(row),
    onSuccess: () => {
      toast.success("Evidence dihapus");
      onChanged();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Gagal menghapus evidence"),
  });

  return (
    <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{row.title || row.original_filename || row.source_url || "Evidence"}</p>
          <Badge variant="outline">{row.source_type.includes("link") ? "Link" : row.source_type.includes("import") ? "Import" : "File"}</Badge>
          <Badge variant="secondary">
            {row.processing_status === "stored" ? "Stored · belum diekstrak" : row.processing_status}
          </Badge>
        </div>
        <p className="mt-1 truncate text-xs text-muted-foreground">
          {row.source_url || row.original_filename || row.mime_type || "Source metadata tersimpan"}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        aria-label="Hapus evidence"
        onClick={() => {
          if (confirm("Hapus evidence ini?")) remove.mutate();
        }}
        disabled={remove.isPending}
      >
        {remove.isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
      </Button>
    </div>
  );
}
