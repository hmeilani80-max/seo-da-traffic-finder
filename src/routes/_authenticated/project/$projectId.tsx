import { useMemo, useState } from "react";
import { createFileRoute, useParams } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Brain,
  Check,
  ExternalLink,
  FileText,
  Files,
  Globe,
  HardDrive,
  LayoutDashboard,
  Link2,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Upload,
  X,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { runProjectIntelligenceFn } from "@/lib/project-intelligence.functions";
import {
  DATA_SOURCE_STATUS,
  DATA_SOURCE_STATUS_LABEL,
  PROJECT_DATA_SOURCES,
  PROJECT_LIFECYCLE,
  PROJECT_LIFECYCLE_LABEL,
  addProjectLinkEvidence,
  decideProjectFieldSuggestion,
  fetchProjectDataSources,
  fetchProjectEvidence,
  fetchProjectFieldSuggestions,
  fetchProjectIntelligenceRuns,
  fetchProjectWorkspace,
  openEvidenceFile,
  prepareCompetitorImport,
  saveCompetitorImport,
  updateProjectDataSource,
  updateProjectFields,
  uploadProjectEvidence,
  type CompetitorImportPreview,
  type DataSourceStatus,
  type ProjectEvidenceRow,
  type ProjectFieldSuggestionRow,
  type ProjectIntelligenceOutput,
  type ProjectWorkspaceRow,
} from "@/lib/project-workspace";

export const Route = createFileRoute("/_authenticated/project/$projectId")({
  head: () => ({
    meta: [
      { title: "Project Workspace — SEO Operating System" },
      { name: "description", content: "Workspace project untuk discovery, evidence, data access, dan AI client intelligence." },
    ],
  }),
  component: ProjectWorkspace,
});

function invalidateProject(qc: ReturnType<typeof useQueryClient>, projectId: string) {
  return Promise.all([
    qc.invalidateQueries({ queryKey: ["project", projectId] }),
    qc.invalidateQueries({ queryKey: ["projects-list"] }),
  ]);
}

function EditableField({
  label,
  value,
  fieldKey,
  projectId,
  multiline = false,
}: {
  label: string;
  value: string | null;
  fieldKey:
    | "industry"
    | "target_market"
    | "current_problem"
    | "contact_person"
    | "budget_indication"
    | "discovery_notes";
  projectId: string;
  multiline?: boolean;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");
  const mutation = useMutation({
    mutationFn: () => updateProjectFields(projectId, { [fieldKey]: draft.trim() || null }),
    onSuccess: async () => {
      await invalidateProject(qc, projectId);
      setEditing(false);
      toast.success(`${label} diperbarui`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="group rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {!editing && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setDraft(value ?? "");
              setEditing(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {editing ? (
        <div className="mt-2 space-y-2">
          {multiline ? (
            <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={4} autoFocus />
          ) : (
            <Input value={draft} onChange={(event) => setDraft(event.target.value)} autoFocus />
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              Simpan
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={mutation.isPending}>
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm">
          {value || <span className="italic text-muted-foreground">Belum diisi</span>}
        </p>
      )}
    </div>
  );
}

function EditableListField({
  label,
  values,
  fieldKey,
  projectId,
  placeholder,
}: {
  label: string;
  values: string[];
  fieldKey: "objectives" | "competitors";
  projectId: string;
  placeholder: string;
}) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(values.join("\n"));
  const mutation = useMutation({
    mutationFn: () => {
      const items = [...new Set(draft.split(/[\n,]/).map((item) => item.trim()).filter(Boolean))];
      return updateProjectFields(projectId, { [fieldKey]: items });
    },
    onSuccess: async () => {
      await invalidateProject(qc, projectId);
      setEditing(false);
      toast.success(`${label} diperbarui`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs text-muted-foreground">{label}</Label>
        {!editing && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={() => {
              setDraft(values.join("\n"));
              setEditing(true);
            }}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
      {editing ? (
        <div className="mt-2 space-y-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            rows={4}
            placeholder={placeholder}
            autoFocus
          />
          <p className="text-xs text-muted-foreground">Satu item per baris, atau pisahkan dengan koma.</p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              Simpan
            </Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} disabled={mutation.isPending}>
              Batal
            </Button>
          </div>
        </div>
      ) : values.length ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {values.map((item) => (
            <Badge key={item} variant="secondary">{item}</Badge>
          ))}
        </div>
      ) : (
        <p className="mt-1 text-sm italic text-muted-foreground">Belum diisi</p>
      )}
    </div>
  );
}

function LifecycleControl({ project }: { project: ProjectWorkspaceRow }) {
  const qc = useQueryClient();
  const mutation = useMutation({
    mutationFn: (status: string) => updateProjectFields(project.id, { lifecycle_status: status }),
    onSuccess: async () => {
      await invalidateProject(qc, project.id);
      toast.success("Lifecycle project diperbarui");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <Select value={project.lifecycle_status || "prospect"} onValueChange={(value) => mutation.mutate(value)} disabled={mutation.isPending}>
      <SelectTrigger className="w-[170px] border-white/30 bg-white/10 text-white">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROJECT_LIFECYCLE.map((status) => (
          <SelectItem key={status} value={status}>{PROJECT_LIFECYCLE_LABEL[status]}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function OverviewTab({ project }: { project: ProjectWorkspaceRow }) {
  const evidence = useQuery({
    queryKey: ["project-evidence", project.id],
    queryFn: () => fetchProjectEvidence(project.id),
  });
  const sources = useQuery({
    queryKey: ["project-data-sources", project.id],
    queryFn: () => fetchProjectDataSources(project),
    enabled: Boolean(project.workspace_id),
  });
  const runs = useQuery({
    queryKey: ["project-intelligence", project.id],
    queryFn: () => fetchProjectIntelligenceRuns(project.id),
  });

  const latest = runs.data?.[0];
  const output = latest?.output as ProjectIntelligenceOutput | undefined;
  const availableSources = (sources.data ?? []).filter((item) => item.status === "available").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Evidence</p><p className="text-2xl font-semibold">{evidence.data?.length ?? 0}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Data access tersedia</p><p className="text-2xl font-semibold">{availableSources}</p></CardContent></Card>
        <Card><CardContent className="pt-5"><p className="text-xs text-muted-foreground">Intelligence runs</p><p className="text-2xl font-semibold">{runs.data?.length ?? 0}</p></CardContent></Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Business Context</CardTitle>
            <CardDescription>Isi secara bertahap. Tidak perlu lengkap saat project dibuat.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <EditableField label="Industry" value={project.industry} fieldKey="industry" projectId={project.id} />
            <EditableListField label="Objectives" values={project.objectives ?? []} fieldKey="objectives" projectId={project.id} placeholder="Contoh: meningkatkan qualified organic traffic" />
            <EditableField label="Target Market" value={project.target_market} fieldKey="target_market" projectId={project.id} />
            <EditableField label="Current Problem" value={project.current_problem} fieldKey="current_problem" projectId={project.id} multiline />
            <EditableField label="Contact Person" value={project.contact_person} fieldKey="contact_person" projectId={project.id} />
            <EditableField label="Budget Indication" value={project.budget_indication} fieldKey="budget_indication" projectId={project.id} />
            <EditableListField label="Known Competitors" values={project.competitors ?? []} fieldKey="competitors" projectId={project.id} placeholder="competitor-a.com" />
            <EditableField label="Discovery Notes" value={project.discovery_notes} fieldKey="discovery_notes" projectId={project.id} multiline />
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />AI Client Intelligence</CardTitle>
              <CardDescription>Ringkasan terakhir berdasarkan Project context dan evidence yang tersedia.</CardDescription>
            </CardHeader>
            <CardContent>
              {latest?.status === "ok" && output ? (
                <div className="space-y-3 text-sm">
                  <div><p className="font-medium">Business Understanding</p><p className="mt-1 text-muted-foreground">{output.businessUnderstanding}</p></div>
                  <div><p className="font-medium">Initial Findings</p><p className="mt-1 text-muted-foreground">{output.initialFindings}</p></div>
                  <div>
                    <p className="font-medium">Next Actions</p>
                    <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                      {(output.recommendedNextActions ?? []).slice(0, 4).map((item) => <li key={item}>{item}</li>)}
                    </ul>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada hasil intelligence yang berhasil. Jalankan dari tab Intelligence.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Project Readiness</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <ReadinessRow label="Website/domain" ready={Boolean(project.client_domain)} />
              <ReadinessRow label="Business context" ready={Boolean(project.industry || project.target_market || project.current_problem)} />
              <ReadinessRow label="Evidence" ready={(evidence.data?.length ?? 0) > 0} />
              <ReadinessRow label="AI intelligence" ready={latest?.status === "ok"} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ReadinessRow({ label, ready }: { label: string; ready: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <span>{label}</span>
      <Badge variant={ready ? "default" : "outline"}>{ready ? "Ready" : "Belum"}</Badge>
    </div>
  );
}

function IntelligenceTab({ project }: { project: ProjectWorkspaceRow }) {
  const qc = useQueryClient();
  const runIntelligence = useServerFn(runProjectIntelligenceFn);
  const runs = useQuery({
    queryKey: ["project-intelligence", project.id],
    queryFn: () => fetchProjectIntelligenceRuns(project.id),
  });
  const suggestions = useQuery({
    queryKey: ["project-field-suggestions", project.id],
    queryFn: () => fetchProjectFieldSuggestions(project.id),
  });

  const runMutation = useMutation({
    mutationFn: () => runIntelligence({ data: { projectId: project.id } }),
    onSuccess: async (result) => {
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["project-intelligence", project.id] }),
        qc.invalidateQueries({ queryKey: ["project-field-suggestions", project.id] }),
      ]);
      if (result.error) toast.error(result.error);
      else toast.success("AI Client Intelligence selesai");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const latest = runs.data?.[0];
  const output = latest?.output as ProjectIntelligenceOutput | undefined;
  const pending = (suggestions.data ?? []).filter((item) => item.status === "pending");

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>AI Client Intelligence</CardTitle>
            <CardDescription>AI hanya memakai Project profile, evidence, dan status data source yang tersedia. Tidak boleh mengarang metrik SEO.</CardDescription>
          </div>
          <Button onClick={() => runMutation.mutate()} disabled={runMutation.isPending || !project.workspace_id}>
            {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {runs.data?.length ? "Jalankan Ulang" : "Jalankan Analisa"}
          </Button>
        </CardHeader>
        <CardContent>
          {runs.isLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : latest?.status === "ok" && output ? (
            <div className="grid gap-4 md:grid-cols-2">
              <IntelligenceBlock title="Business Understanding" text={output.businessUnderstanding} />
              <IntelligenceBlock title="Client Objectives" text={output.clientObjectives} />
              <IntelligenceBlock title="Available Data & Access" text={output.availableDataAccess} />
              <IntelligenceBlock title="Initial Findings" text={output.initialFindings} />
              <IntelligenceList title="Missing Information" items={output.missingInformation} />
              <IntelligenceList title="Suggested Questions" items={output.suggestedQuestions} />
              <div className="md:col-span-2"><IntelligenceList title="Recommended Next Actions" items={output.recommendedNextActions} /></div>
            </div>
          ) : latest?.status === "error" ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-medium">Intelligence run gagal</p>
              <p className="mt-1 text-muted-foreground">{latest.error || "Provider AI tidak tersedia."}</p>
            </div>
          ) : (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              Tambahkan Project context/evidence, lalu jalankan analisa.
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Field Suggestions</CardTitle>
          <CardDescription>AI tidak pernah menimpa Project otomatis. Review setiap saran dengan Accept, Edit, atau Ignore.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada suggestion yang menunggu keputusan.</p>
          ) : pending.map((suggestion) => (
            <SuggestionCard key={suggestion.id} projectId={project.id} suggestion={suggestion} />
          ))}
        </CardContent>
      </Card>

      {runs.data && runs.data.length > 1 && (
        <Card>
          <CardHeader><CardTitle>Run History</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {runs.data.map((run) => (
              <div key={run.id} className="flex items-center justify-between rounded-md border p-3 text-sm">
                <div><p className="font-medium">{new Date(run.created_at).toLocaleString("id-ID")}</p><p className="text-xs text-muted-foreground">Provider: {run.provider}</p></div>
                <Badge variant={run.status === "ok" ? "default" : "destructive"}>{run.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function IntelligenceBlock({ title, text }: { title: string; text: string }) {
  return <div className="rounded-lg border p-4"><p className="text-sm font-semibold">{title}</p><p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{text}</p></div>;
}

function IntelligenceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-semibold">{title}</p>
      {items?.length ? <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{items.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-muted-foreground">Tidak ada.</p>}
    </div>
  );
}

function SuggestionCard({ projectId, suggestion }: { projectId: string; suggestion: ProjectFieldSuggestionRow }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(suggestion.suggested_value);
  const mutation = useMutation({
    mutationFn: (action: "accept" | "ignore") => decideProjectFieldSuggestion({
      projectId,
      suggestionId: suggestion.id,
      field: suggestion.field,
      action,
      value,
    }),
    onSuccess: async () => {
      await Promise.all([
        invalidateProject(qc, projectId),
        qc.invalidateQueries({ queryKey: ["project-field-suggestions", projectId] }),
      ]);
      toast.success("Suggestion diproses");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Badge variant="secondary">{suggestion.field.replaceAll("_", " ")}</Badge>
          {editing ? (
            <Textarea className="mt-3" value={value} onChange={(event) => setValue(event.target.value)} rows={3} />
          ) : (
            <p className="mt-3 whitespace-pre-wrap text-sm font-medium">{value}</p>
          )}
          {suggestion.rationale && <p className="mt-2 text-xs text-muted-foreground">Alasan: {suggestion.rationale}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={() => mutation.mutate("accept")} disabled={mutation.isPending}>
            <Check className="h-4 w-4" />{editing ? "Accept Edit" : "Accept"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setEditing((current) => !current)} disabled={mutation.isPending}>
            <Pencil className="h-4 w-4" />Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => mutation.mutate("ignore")} disabled={mutation.isPending}>
            <X className="h-4 w-4" />Ignore
          </Button>
        </div>
      </div>
    </div>
  );
}

function DataSourcesTab({ project }: { project: ProjectWorkspaceRow }) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ["project-data-sources", project.id],
    queryFn: () => fetchProjectDataSources(project),
    enabled: Boolean(project.workspace_id),
  });

  if (!project.workspace_id) return <p className="text-sm text-destructive">Project belum memiliki workspace.</p>;
  if (query.isLoading) return <Loader2 className="h-5 w-5 animate-spin" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Data Source Registry</CardTitle>
        <CardDescription>Wave 1 hanya mencatat kesiapan akses. Status “Akses Tersedia” bukan berarti connector sudah terhubung.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {PROJECT_DATA_SOURCES.map((definition) => {
          const row = query.data?.find((item) => item.source_key === definition.key);
          if (!row) return null;
          return <DataSourceRow key={definition.key} projectId={project.id} label={definition.label} row={row} onSaved={() => qc.invalidateQueries({ queryKey: ["project-data-sources", project.id] })} />;
        })}
      </CardContent>
    </Card>
  );
}

function DataSourceRow({
  label,
  row,
  onSaved,
}: {
  projectId: string;
  label: string;
  row: { id: string; status: string; notes: string | null };
  onSaved: () => Promise<unknown>;
}) {
  const [status, setStatus] = useState<DataSourceStatus>((DATA_SOURCE_STATUS.includes(row.status as DataSourceStatus) ? row.status : "not_connected") as DataSourceStatus);
  const [notes, setNotes] = useState(row.notes ?? "");
  const mutation = useMutation({
    mutationFn: () => updateProjectDataSource(row.id, { status, notes: notes.trim() || null }),
    onSuccess: async () => {
      await onSaved();
      toast.success(`${label} diperbarui`);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="grid gap-3 rounded-lg border p-4 md:grid-cols-[220px_180px_1fr_auto] md:items-center">
      <div><p className="text-sm font-medium">{label}</p><p className="text-xs text-muted-foreground">Registry status</p></div>
      <Select value={status} onValueChange={(value) => setStatus(value as DataSourceStatus)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>{DATA_SOURCE_STATUS.map((item) => <SelectItem key={item} value={item}>{DATA_SOURCE_STATUS_LABEL[item]}</SelectItem>)}</SelectContent>
      </Select>
      <Input value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Catatan akses/property/account (opsional)" />
      <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Simpan"}</Button>
    </div>
  );
}

function EvidenceTab({ project }: { project: ProjectWorkspaceRow }) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [linkTitle, setLinkTitle] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [importName, setImportName] = useState("");
  const [importPreview, setImportPreview] = useState<CompetitorImportPreview | null>(null);

  const evidence = useQuery({
    queryKey: ["project-evidence", project.id],
    queryFn: () => fetchProjectEvidence(project.id),
  });

  const uploadMutation = useMutation({
    mutationFn: () => {
      if (!file) throw new Error("Pilih file terlebih dahulu.");
      return uploadProjectEvidence(project, file);
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["project-evidence", project.id] });
      setFile(null);
      toast.success("Evidence disimpan");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const linkMutation = useMutation({
    mutationFn: () => addProjectLinkEvidence(project, { title: linkTitle, url: linkUrl }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["project-evidence", project.id] });
      setLinkTitle("");
      setLinkUrl("");
      toast.success("Link evidence ditambahkan");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const importMutation = useMutation({
    mutationFn: () => {
      if (!importPreview) throw new Error("Belum ada import preview.");
      return saveCompetitorImport(project, importPreview, importName || "competitors.csv");
    },
    onSuccess: async () => {
      await invalidateProject(qc, project.id);
      setImportPreview(null);
      setImportName("");
      toast.success("Competitor import dikonfirmasi dan disimpan");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function prepareImport(selected: File | null) {
    if (!selected) return;
    try {
      const text = await selected.text();
      setImportName(selected.name);
      setImportPreview(prepareCompetitorImport(text));
    } catch (error) {
      setImportPreview(null);
      toast.error(error instanceof Error ? error.message : "Gagal membaca CSV");
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Upload Evidence</CardTitle><CardDescription>TXT/CSV/JSON/MD diekstrak sebagai text bila kecil. PDF/DOCX/image tetap disimpan sebagai source tanpa klaim parsing.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Input type="file" accept=".txt,.csv,.json,.md,.pdf,.doc,.docx,.png,.jpg,.jpeg,.webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            {file && <p className="text-xs text-muted-foreground">{file.name} · {Math.ceil(file.size / 1024)} KB</p>}
            <Button onClick={() => uploadMutation.mutate()} disabled={!file || uploadMutation.isPending || !project.workspace_id}>
              {uploadMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Simpan Evidence
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Link2 className="h-5 w-5" />Add Link</CardTitle><CardDescription>Simpan URL sebagai evidence/provenance. Wave 1 tidak otomatis crawl isi link.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Judul (opsional)" value={linkTitle} onChange={(event) => setLinkTitle(event.target.value)} />
            <Input placeholder="https://example.com/reference" value={linkUrl} onChange={(event) => setLinkUrl(event.target.value)} />
            <Button onClick={() => linkMutation.mutate()} disabled={!linkUrl.trim() || linkMutation.isPending || !project.workspace_id}>
              {linkMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}Tambah Link
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Structured Import — Competitor Domains</CardTitle><CardDescription>Representative Wave 1 import: Input → Detect → Normalize → Map → Validate → Preview → Confirm → Save. CSV ini menambah Known Competitors pada Project.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <Input type="file" accept=".csv,text/csv" onChange={(event) => void prepareImport(event.target.files?.[0] ?? null)} />
          {importPreview && (
            <div className="space-y-3 rounded-lg border p-4">
              <div className="grid gap-2 text-sm sm:grid-cols-4">
                <div><p className="text-xs text-muted-foreground">Detected column</p><p className="font-medium">{importPreview.domainHeader}</p></div>
                <div><p className="text-xs text-muted-foreground">Rows</p><p className="font-medium">{importPreview.rawCount}</p></div>
                <div><p className="text-xs text-muted-foreground">Valid unique</p><p className="font-medium">{importPreview.validDomains.length}</p></div>
                <div><p className="text-xs text-muted-foreground">Invalid preview</p><p className="font-medium">{importPreview.invalidValues.length}</p></div>
              </div>
              <div className="max-h-44 overflow-auto rounded-md bg-muted/30 p-3 text-sm">
                {importPreview.validDomains.slice(0, 25).map((domain) => <div key={domain}>{domain}</div>)}
              </div>
              {importPreview.invalidValues.length > 0 && <p className="text-xs text-muted-foreground">Tidak disimpan: {importPreview.invalidValues.slice(0, 5).join(", ")}</p>}
              <div className="flex gap-2">
                <Button onClick={() => importMutation.mutate()} disabled={!importPreview.validDomains.length || importMutation.isPending}>{importMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}Confirm & Save</Button>
                <Button variant="outline" onClick={() => setImportPreview(null)} disabled={importMutation.isPending}>Batal</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Evidence Library</CardTitle><CardDescription>Source asli dipertahankan bersama processing status dan provenance.</CardDescription></CardHeader>
        <CardContent className="space-y-3">
          {evidence.isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : evidence.data?.length ? evidence.data.map((item) => <EvidenceItem key={item.id} item={item} />) : <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Belum ada evidence.</div>}
        </CardContent>
      </Card>
    </div>
  );
}

function EvidenceItem({ item }: { item: ProjectEvidenceRow }) {
  const statusVariant = item.processing_status === "ready" ? "default" : "secondary";
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2"><FileText className="h-4 w-4" /><p className="font-medium">{item.title || item.original_filename || item.source_url || "Evidence"}</p><Badge variant={statusVariant}>{item.processing_status}</Badge><Badge variant="outline">{item.source_type}</Badge></div>
          <p className="mt-1 text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("id-ID")}{item.mime_type ? ` · ${item.mime_type}` : ""}</p>
        </div>
        <div className="flex gap-2">
          {item.source_url && <Button size="sm" variant="outline" onClick={() => window.open(item.source_url!, "_blank", "noopener,noreferrer")}><ExternalLink className="h-4 w-4" />Open Link</Button>}
          {item.storage_path && <Button size="sm" variant="outline" onClick={() => void openEvidenceFile(item).catch((error: Error) => toast.error(error.message))}><ExternalLink className="h-4 w-4" />Open File</Button>}
        </div>
      </div>
      {item.raw_text && <pre className="mt-3 max-h-32 overflow-auto whitespace-pre-wrap rounded-md bg-muted/30 p-3 text-xs">{item.raw_text.slice(0, 1000)}</pre>}
      {item.processing_error && <p className="mt-2 text-xs text-muted-foreground">{item.processing_error}</p>}
    </div>
  );
}

function ProjectWorkspace() {
  const { projectId } = useParams({ from: "/_authenticated/project/$projectId" });
  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProjectWorkspace(projectId),
  });

  const project = projectQuery.data;
  const domainHref = useMemo(() => {
    if (!project?.client_domain) return null;
    return project.client_domain.startsWith("http") ? project.client_domain : `https://${project.client_domain}`;
  }, [project?.client_domain]);

  if (projectQuery.isLoading) return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (projectQuery.isError) return <div className="mx-auto max-w-5xl p-8"><Card><CardContent className="pt-6 text-sm text-destructive">{projectQuery.error instanceof Error ? projectQuery.error.message : "Gagal memuat project"}</CardContent></Card></div>;
  if (!project) return <div className="mx-auto max-w-5xl p-8 text-center"><h2 className="text-xl font-bold">Project tidak ditemukan</h2></div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="relative overflow-hidden rounded-xl bg-teal-800 p-6 text-white shadow-md sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-40 h-96 w-96 rounded-full bg-white opacity-5 blur-3xl" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-3"><Badge variant="secondary" className="bg-white/20 text-white">Project Workspace</Badge><span className="text-sm text-teal-100">Wave 1</span></div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            {domainHref && <a href={domainHref} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-teal-100 hover:text-white hover:underline"><Globe className="h-4 w-4" />{project.client_domain}<ExternalLink className="h-3 w-3" /></a>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <LifecycleControl project={project} />
            <Button variant="secondary" disabled title="Site Audit dimulai pada Wave 2">Site Audit · Wave 2</Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="overview" className="w-full">
        <div className="overflow-x-auto border-b">
          <TabsList className="h-12 w-max justify-start rounded-none bg-transparent p-0">
            <TabsTrigger value="overview" className="h-12 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary"><LayoutDashboard className="mr-2 h-4 w-4" />Overview</TabsTrigger>
            <TabsTrigger value="intelligence" className="h-12 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary"><Brain className="mr-2 h-4 w-4" />Intelligence</TabsTrigger>
            <TabsTrigger value="datasources" className="h-12 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary"><HardDrive className="mr-2 h-4 w-4" />Data Sources</TabsTrigger>
            <TabsTrigger value="evidence" className="h-12 rounded-none border-b-2 border-transparent px-4 data-[state=active]:border-primary"><Files className="mr-2 h-4 w-4" />Files & Evidence</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-6"><OverviewTab project={project} /></TabsContent>
        <TabsContent value="intelligence" className="mt-6"><IntelligenceTab project={project} /></TabsContent>
        <TabsContent value="datasources" className="mt-6"><DataSourcesTab project={project} /></TabsContent>
        <TabsContent value="evidence" className="mt-6"><EvidenceTab project={project} /></TabsContent>
      </Tabs>
    </div>
  );
}
