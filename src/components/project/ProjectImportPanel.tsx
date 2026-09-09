import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileSpreadsheet, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PROJECT_IMPORT_FIELDS,
  autoMapProjectImportHeaders,
  buildProjectImportPreview,
  parseStructuredText,
  saveProjectContextImport,
  type ParsedStructuredFile,
  type ProjectImportMapping,
} from "@/lib/project-import";
import type { ProjectRow } from "@/lib/projects";

const FIELD_LABELS: Record<string, string> = {
  ignore: "Ignore",
  industry: "Industry",
  target_market: "Target Market",
  current_problem: "Current Problem",
  contact_person: "Contact Person",
  budget_indication: "Budget Indication",
  objectives: "Objectives",
  competitors: "Known Competitors",
  discovery_notes: "Discovery Notes",
};

const FLOW = ["Input", "Detect", "Normalize", "Map", "Validate", "Preview", "Confirm", "Save"];

export function ProjectImportPanel({ project }: { project: ProjectRow }) {
  const qc = useQueryClient();
  const [fileName, setFileName] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState<ParsedStructuredFile | null>(null);
  const [mapping, setMapping] = useState<ProjectImportMapping>({});

  const preview = useMemo(
    () => (parsed ? buildProjectImportPreview(parsed, mapping) : {}),
    [parsed, mapping],
  );
  const mappedCount = Object.values(mapping).filter((value) => value !== "ignore").length;

  async function selectFile(file: File | null) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      toast.error("Structured import Wave 1 dibatasi 1 MB per file.");
      return;
    }
    try {
      const text = await file.text();
      const result = parseStructuredText(text);
      setFileName(file.name);
      setRawText(text);
      setParsed(result);
      setMapping(autoMapProjectImportHeaders(result.headers));
      toast.success(`${result.rows.length} baris terdeteksi untuk preview`);
    } catch (error) {
      setParsed(null);
      setMapping({});
      toast.error(error instanceof Error ? error.message : "File tidak dapat dibaca");
    }
  }

  const save = useMutation({
    mutationFn: () => {
      if (!parsed) throw new Error("Pilih file terlebih dahulu.");
      return saveProjectContextImport({ project, fileName, rawText, parsed, mapping });
    },
    onSuccess: () => {
      toast.success("Structured import disimpan dan Project Context diperbarui");
      setFileName("");
      setRawText("");
      setParsed(null);
      setMapping({});
      qc.invalidateQueries({ queryKey: ["project", project.id] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["project-evidence", project.id] });
      qc.invalidateQueries({ queryKey: ["project-workspace-summary", project.id] });
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Structured import gagal"),
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="size-5" /> Structured Import — Project Context
          </CardTitle>
          <CardDescription>
            Representative Wave 1 importer untuk CSV/TSV client context. Tidak ada data yang disimpan sebelum Preview dan Confirm.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            {FLOW.map((step, index) => (
              <Badge key={step} variant={parsed || index === 0 ? "secondary" : "outline"}>
                {index + 1}. {step}
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-import-file">CSV / TSV</Label>
            <Input
              id="project-import-file"
              type="file"
              accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
              onChange={(event) => void selectFile(event.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Maksimal 1 MB; preview dibatasi 50 data rows. Original text disimpan sebagai Project Evidence setelah Confirm.
            </p>
          </div>

          {parsed && (
            <>
              <div className="grid gap-3 sm:grid-cols-3">
                <Info label="File" value={fileName} />
                <Info
                  label="Delimiter"
                  value={parsed.delimiter === "\t" ? "Tab" : parsed.delimiter === "," ? "Comma" : "Semicolon"}
                />
                <Info label="Rows" value={String(parsed.rows.length)} />
              </div>

              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold">Map Columns</h3>
                  <p className="text-sm text-muted-foreground">
                    Auto-map hanya untuk header yang dikenali. Periksa mapping sebelum lanjut.
                  </p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {parsed.headers.map((header) => (
                    <div key={header} className="grid grid-cols-[minmax(0,1fr)_minmax(160px,1fr)] items-center gap-3 rounded-lg border p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{header}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {parsed.rows[0]?.[header] || "empty"}
                        </p>
                      </div>
                      <Select
                        value={mapping[header] ?? "ignore"}
                        onValueChange={(value) =>
                          setMapping((previous) => ({
                            ...previous,
                            [header]: value as ProjectImportMapping[string],
                          }))
                        }
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ignore">Ignore</SelectItem>
                          {PROJECT_IMPORT_FIELDS.map((field) => (
                            <SelectItem key={field} value={field}>{FIELD_LABELS[field]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="font-semibold">Validate & Preview</h3>
                    <p className="text-sm text-muted-foreground">
                      {mappedCount} source columns akan digunakan. Nilai di bawah yang akan diterapkan ke Project.
                    </p>
                  </div>
                  {mappedCount > 0 && (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle2 className="size-3.5" /> Ready to confirm
                    </Badge>
                  )}
                </div>

                {Object.keys(preview).length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
                    Belum ada kolom yang dipetakan ke Project field.
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 text-left">
                        <tr>
                          <th className="p-3">Project Field</th>
                          <th className="p-3">Value after confirm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(preview).map(([field, value]) => (
                          <tr key={field} className="border-t align-top">
                            <td className="p-3 font-medium">{FIELD_LABELS[field] ?? field}</td>
                            <td className="whitespace-pre-wrap p-3 text-muted-foreground">
                              {Array.isArray(value) ? value.join("\n") : value || "—"}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <Button onClick={() => save.mutate()} disabled={mappedCount === 0 || save.isPending}>
                  {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                  Confirm & Save Import
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}
