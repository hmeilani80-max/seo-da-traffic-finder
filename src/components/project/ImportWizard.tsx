import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DOMAIN_LIST_SCHEMA,
  buildPreview,
  commitImport,
  detectTable,
  fetchProjectImports,
  suggestMapping,
  type ImportFieldKey,
} from "@/lib/structured-import";

/**
 * Wizard import terstruktur (pola dapat dipakai ulang untuk importer lain):
 * Input → Deteksi → Normalisasi → Pemetaan → Validasi → Pratinjau → Konfirmasi → Simpan.
 */
export function ImportWizard({
  projectId,
  workspaceId,
}: {
  projectId: string;
  workspaceId: string;
}) {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [filename, setFilename] = useState<string | null>(null);
  const [mapping, setMapping] = useState<ImportFieldKey[] | null>(null);

  const table = useMemo(() => (text.trim() ? detectTable(text) : null), [text]);
  const effectiveMapping = useMemo(() => {
    if (!table) return [];
    if (mapping && mapping.length === table.headers.length) return mapping;
    return suggestMapping(table.headers);
  }, [table, mapping]);

  const preview = useMemo(
    () => (table ? buildPreview(table, effectiveMapping) : null),
    [table, effectiveMapping],
  );

  const imports = useQuery({
    queryKey: ["project-imports", projectId],
    queryFn: () => fetchProjectImports(projectId),
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!table || !preview) throw new Error("Belum ada data untuk disimpan.");
      return commitImport({
        workspaceId,
        projectId,
        module: "project_domain_list",
        originalFilename: filename,
        mapping: effectiveMapping,
        headers: table.headers,
        preview,
        rawText: text,
      });
    },
    onSuccess: (result) => {
      setText("");
      setFilename(null);
      setMapping(null);
      qc.invalidateQueries({ queryKey: ["project-imports", projectId] });
      qc.invalidateQueries({ queryKey: ["evidence", projectId] });
      toast.success(`${result.savedRows} baris tersimpan setelah konfirmasi.`);
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal menyimpan import"),
  });

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold">Import Data Terstruktur</h2>
        <p className="text-sm text-muted-foreground">
          Tempel atau unggah daftar domain/keyword milik klien. Tidak ada baris yang tersimpan
          sebelum Anda menekan konfirmasi.
        </p>
      </header>

      <div className="space-y-2">
        <Label htmlFor="imp-text">1. Input data (CSV, tab, atau titik koma)</Label>
        <Textarea
          id="imp-text"
          rows={6}
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setMapping(null);
          }}
          placeholder={"domain,keyword,target_url\ncontoh.com,jasa seo,https://contoh.com/jasa"}
        />
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            setText(await file.text());
            setFilename(file.name);
            setMapping(null);
            e.target.value = "";
          }}
        />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()}>
          <Upload className="mr-2 size-4" /> Unggah CSV
        </Button>
      </div>

      {table && preview && (
        <>
          <div className="space-y-2">
            <Label>2. Pemetaan kolom (dapat diubah)</Label>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {table.headers.map((header, i) => (
                <div key={`${header}-${i}`} className="flex items-center gap-2">
                  <span className="w-28 truncate text-xs text-muted-foreground">{header}</span>
                  <Select
                    value={effectiveMapping[i] ?? "ignore"}
                    onValueChange={(value) => {
                      const next = [...effectiveMapping];
                      next[i] = value as ImportFieldKey;
                      setMapping(next);
                    }}
                  >
                    <SelectTrigger className="flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DOMAIN_LIST_SCHEMA.map((f) => (
                        <SelectItem key={f.key} value={f.key}>
                          {f.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>3. Pratinjau &amp; validasi</Label>
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="secondary">{preview.totalRows} baris</Badge>
              <Badge className="bg-kpi-lime text-foreground">{preview.validRows} valid</Badge>
              <Badge className="bg-destructive/10 text-destructive">
                {preview.invalidRows} tidak valid
              </Badge>
              <Badge className="bg-kpi-cream text-foreground">
                {preview.duplicateRows} duplikat
              </Badge>
            </div>

            <div className="max-h-72 overflow-auto rounded-xl border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/60 text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">#</th>
                    <th className="px-3 py-2 text-left">Domain</th>
                    <th className="px-3 py-2 text-left">Keyword</th>
                    <th className="px-3 py-2 text-left">Target URL</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.rows.slice(0, 100).map((row) => (
                    <tr key={row.index}>
                      <td className="px-3 py-1.5 text-muted-foreground">{row.index + 1}</td>
                      <td className="px-3 py-1.5">{row.values.domain ?? "—"}</td>
                      <td className="px-3 py-1.5">{row.values.keyword ?? "—"}</td>
                      <td className="max-w-52 truncate px-3 py-1.5">
                        {row.values.target_url ?? "—"}
                      </td>
                      <td className="px-3 py-1.5 text-xs">
                        {row.errors.length > 0 ? (
                          <span className="text-destructive">{row.errors.join(", ")}</span>
                        ) : row.duplicate ? (
                          <span className="text-muted-foreground">Duplikat, dilewati</span>
                        ) : (
                          <span className="text-success">Siap disimpan</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <Button
            onClick={() => saveMutation.mutate()}
            disabled={preview.validRows === 0 || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="mr-2 size-4 animate-spin" />
            ) : (
              <CheckCircle2 className="mr-2 size-4" />
            )}
            4. Konfirmasi &amp; simpan {preview.validRows} baris
          </Button>
        </>
      )}

      {(imports.data ?? []).length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Riwayat Import</h3>
          <ul className="divide-y divide-border rounded-xl border border-border text-sm">
            {(imports.data ?? []).map((row) => {
              const summary = (row.normalization_summary ?? {}) as Record<string, unknown>;
              return (
                <li key={row.id} className="flex items-center justify-between gap-3 px-4 py-2">
                  <span className="truncate">{row.original_filename ?? row.module}</span>
                  <span className="text-xs text-muted-foreground">
                    {String(summary["saved_rows"] ? (summary["saved_rows"] as unknown[]).length : 0)}{" "}
                    baris · {new Date(row.created_at).toLocaleDateString("id-ID")}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
}
