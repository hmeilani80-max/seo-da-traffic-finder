import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Database,
  FileText,
  FolderKanban,
  Link2,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
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
import {
  PROJECT_LIFECYCLES,
  PROJECT_LIFECYCLE_LABEL,
  fetchProject,
  updateProjectProfile,
  type ProjectProfileInput,
  type ProjectRow,
} from "@/lib/projects";
import {
  DATA_SOURCE_STATUS,
  DATA_SOURCE_STATUS_LABEL,
  PROJECT_DATA_SOURCE_CATALOG,
  addProjectLinkEvidence,
  deleteProjectEvidence,
  fetchProjectDataSources,
  fetchProjectEvidence,
  fetchProjectWorkspaceSummary,
  uploadProjectEvidence,
  upsertProjectDataSource,
  type ProjectDataSourceRow,
  type ProjectEvidenceRow,
} from "@/lib/project-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project Workspace — SEO Operating System" },
      {
        name: "description",
        content: "Kelola konteks client, data source, evidence, dan kesiapan Project SEO.",
      },
    ],
  }),
  component: ProjectWorkspacePage,
});

function ProjectWorkspacePage() {
  const { projectId } = Route.useParams();
  const qc = useQueryClient();
  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });
  const summaryQuery = useQuery({
    queryKey: ["project-workspace-summary", projectId],
    queryFn: () => fetchProjectWorkspaceSummary(projectId),
  });
  const evidenceQuery = useQuery({
    queryKey: ["project-evidence", projectId],
    queryFn: () => fetchProjectEvidence(projectId),
  });
  const sourcesQuery = useQuery({
    queryKey: ["project-data-sources", projectId],
    queryFn: () => fetchProjectDataSources(projectId),
  });

  const invalidateWorkspace = () => {
    qc.invalidateQueries({ queryKey: ["project", projectId] });
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["project-workspace-summary", projectId] });
    qc.invalidateQueries({ queryKey: ["project-evidence", projectId] });
    qc.invalidateQueries({ queryKey: ["project-data-sources", projectId] });
  };

  if (projectQuery.isLoading) {
    return <PageLoader />;
  }

  if (projectQuery.error || !projectQuery.data) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <Card>
          <CardHeader>
            <CardTitle>Project tidak dapat dibuka</CardTitle>
            <CardDescription>
              Project tidak ditemukan atau akun ini tidak memiliki akses workspace.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline">
              <Link to="/projects">Kembali ke Projects</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const project = projectQuery.data;
  const summary = summaryQuery.data;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/projects">
            <ArrowLeft className="size-4" />
            Semua Project
          </Link>
        </Button>
        <Badge variant="outline">
          {PROJECT_LIFECYCLE_LABEL[project.lifecycle_status] ?? project.lifecycle_status}
        </Badge>
      </div>

      <ProjectHeader project={project} />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="Evidence"
          value={summaryQuery.isLoading ? "…" : String(summary?.evidenceCount ?? 0)}
          detail="file, link, atau context tersimpan"
          icon={<FileText className="size-4" />}
        />
        <MetricCard
          label="Data Sources"
          value={summaryQuery.isLoading ? "…" : `${summary?.readySourceCount ?? 0}/${summary?.sourceCount ?? 0}`}
          detail="access/connection tercatat"
          icon={<Database className="size-4" />}
        />
        <MetricCard
          label="Placement Orders"
          value={summaryQuery.isLoading ? "…" : String(summary?.placementOrderCount ?? 0)}
          detail="terkait dengan project ini"
          icon={<FolderKanban className="size-4" />}
        />
        <MetricCard
          label="AI Intelligence"
          value={summaryQuery.isLoading ? "…" : String(summary?.intelligenceRunCount ?? 0)}
          detail="grounded intelligence runs"
          icon={<Sparkles className="size-4" />}
        />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="evidence">Files &amp; Evidence</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <OverviewTab project={project} summary={summary} onSaved={invalidateWorkspace} />
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <DataSourcesTab
            project={project}
            rows={sourcesQuery.data ?? []}
            loading={sourcesQuery.isLoading}
            onSaved={invalidateWorkspace}
          />
        </TabsContent>

        <TabsContent value="evidence" className="space-y-4">
          <EvidenceTab
            project={project}
            rows={evidenceQuery.data ?? []}
            loading={evidenceQuery.isLoading}
            onChanged={invalidateWorkspace}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PageLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="size-7 animate-spin text-muted-foreground" />
    </div>
  );
}

function ProjectHeader({ project }: { project: ProjectRow }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <span>Project Workspace</span>
            <span>•</span>
            <span>{project.client_domain || "Website belum diisi"}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            {project.description ||
              "Lengkapi business context, data access, dan evidence sebelum masuk ke research dan audit."}
          </p>
        </div>
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lifecycle</p>
          <p className="mt-1 font-semibold">
            {PROJECT_LIFECYCLE_LABEL[project.lifecycle_status] ?? project.lifecycle_status}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-3 flex items-center justify-between text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
          {icon}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
      </CardContent>
    </Card>
  );
}

function OverviewTab({
  project,
  summary,
  onSaved,
}: {
  project: ProjectRow;
  summary: Awaited<ReturnType<typeof fetchProjectWorkspaceSummary>> | undefined;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProjectProfileInput>(() => toProfileForm(project));

  useEffect(() => {
    setForm(toProfileForm(project));
  }, [project]);

  const save = useMutation({
    mutationFn: () => updateProjectProfile(project.id, form),
    onSuccess: () => {
      toast.success("Project profile disimpan");
      onSaved();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan project"),
  });

  const nextActions = useMemo(() => {
    const actions: string[] = [];
    if (!project.industry || !project.target_market || !project.current_problem) {
      actions.push("Lengkapi business context agar research berikutnya punya konteks client yang cukup.");
    }
    if ((summary?.evidenceCount ?? 0) === 0) {
      actions.push("Tambahkan brief, dokumen, link, atau evidence yang sudah tersedia dari client.");
    }
    if ((summary?.sourceCount ?? 0) === 0) {
      actions.push("Catat data source dan akses yang tersedia untuk project ini.");
    }
    if ((summary?.intelligenceRunCount ?? 0) === 0) {
      actions.push("AI Client Intelligence belum pernah dijalankan; fitur generation akan diaktifkan pada langkah Wave 1 berikutnya.");
    }
    return actions.length > 0 ? actions : ["Project context sudah cukup untuk melanjutkan ke assessment berikutnya."];
  }, [project, summary]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Client &amp; Project Context</CardTitle>
          <CardDescription>
            Minimum create tetap sederhana; detail ini bisa dilengkapi bertahap setelah discovery.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project / Client Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Website">
              <Input
                value={form.client_domain ?? ""}
                onChange={(e) => setForm({ ...form, client_domain: e.target.value })}
                placeholder="client.com"
              />
            </Field>
            <Field label="Lifecycle">
              <Select
                value={form.lifecycle_status}
                onValueChange={(value) => setForm({ ...form, lifecycle_status: value })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_LIFECYCLES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {PROJECT_LIFECYCLE_LABEL[status]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Industry">
              <Input
                value={form.industry ?? ""}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
                placeholder="Contoh: Healthcare"
              />
            </Field>
            <Field label="Contact Person">
              <Input
                value={form.contact_person ?? ""}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              />
            </Field>
            <Field label="Budget Indication">
              <Input
                value={form.budget_indication ?? ""}
                onChange={(e) => setForm({ ...form, budget_indication: e.target.value })}
                placeholder="Manual indication only"
              />
            </Field>
          </div>

          <Field label="Target Market">
            <Input
              value={form.target_market ?? ""}
              onChange={(e) => setForm({ ...form, target_market: e.target.value })}
            />
          </Field>
          <Field label="Current Problem">
            <Textarea
              value={form.current_problem ?? ""}
              onChange={(e) => setForm({ ...form, current_problem: e.target.value })}
              rows={3}
            />
          </Field>
          <Field label="Objectives" hint="Pisahkan dengan koma atau baris baru.">
            <Textarea
              value={form.objectives.join("\n")}
              onChange={(e) => setForm({ ...form, objectives: splitList(e.target.value) })}
              rows={3}
            />
          </Field>
          <Field label="Known Competitors" hint="Pisahkan dengan koma atau baris baru.">
            <Textarea
              value={form.competitors.join("\n")}
              onChange={(e) => setForm({ ...form, competitors: splitList(e.target.value) })}
              rows={3}
            />
          </Field>
          <Field label="Project Description">
            <Textarea
              value={form.description ?? ""}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
            />
          </Field>
          <Field label="Discovery Notes">
            <Textarea
              value={form.discovery_notes ?? ""}
              onChange={(e) => setForm({ ...form, discovery_notes: e.target.value })}
              rows={5}
            />
          </Field>

          <Button onClick={() => save.mutate()} disabled={!form.name.trim() || save.isPending}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Simpan Project Context
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recommended Next Actions</CardTitle>
            <CardDescription>Ditentukan dari data Project yang benar-benar tersedia.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 text-sm">
              {nextActions.map((action, index) => (
                <li key={action} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span>{action}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Client Intelligence</CardTitle>
            <CardDescription>
              Tidak ada insight atau angka AI yang dibuat otomatis pada page load.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>Runs tersimpan: {summary?.intelligenceRunCount ?? 0}</p>
            <p>
              Generation akan menggunakan Project profile + evidence yang tersedia dan tetap memisahkan fakta dari reasoning.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function toProfileForm(project: ProjectRow): ProjectProfileInput {
  return {
    name: project.name,
    client_domain: project.client_domain,
    description: project.description,
    lifecycle_status: project.lifecycle_status || "prospect",
    industry: project.industry,
    objectives: project.objectives ?? [],
    target_market: project.target_market,
    current_problem: project.current_problem,
    contact_person: project.contact_person,
    budget_indication: project.budget_indication,
    competitors: project.competitors ?? [],
    discovery_notes: project.discovery_notes,
  };
}

function splitList(value: string): string[] {
  return value
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function DataSourcesTab({
  project,
  rows,
  loading,
  onSaved,
}: {
  project: ProjectRow;
  rows: ProjectDataSourceRow[];
  loading: boolean;
  onSaved: () => void;
}) {
  if (loading) return <InlineLoader label="Memuat data source…" />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Data Source Registry</h2>
        <p className="text-sm text-muted-foreground">
          Registry ini mencatat kesiapan/akses. Label “terhubung” tidak berarti API sync kecuali integrasinya memang sudah tersedia.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PROJECT_DATA_SOURCE_CATALOG.map((source) => (
          <DataSourceCard
            key={source.key}
            project={project}
            source={source}
            row={rows.find((item) => item.source_key === source.key)}
            onSaved={onSaved}
          />
        ))}
      </div>
    </div>
  );
}

function DataSourceCard({
  project,
  source,
  row,
  onSaved,
}: {
  project: ProjectRow;
  source: (typeof PROJECT_DATA_SOURCE_CATALOG)[number];
  row?: ProjectDataSourceRow;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(row?.status ?? "not_connected");
  const [notes, setNotes] = useState(row?.notes ?? "");

  useEffect(() => {
    setStatus(row?.status ?? "not_connected");
    setNotes(row?.notes ?? "");
  }, [row]);

  const save = useMutation({
    mutationFn: () =>
      upsertProjectDataSource(project, { sourceKey: source.key, status, notes }),
    onSuccess: () => {
      toast.success(`${source.label} diperbarui`);
      onSaved();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan data source"),
  });

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{source.label}</CardTitle>
            <CardDescription>{source.category}</CardDescription>
          </div>
          <Badge variant="secondary">{DATA_SOURCE_STATUS_LABEL[status] ?? status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{source.note}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {DATA_SOURCE_STATUS.map((value) => (
              <SelectItem key={value} value={value}>
                {DATA_SOURCE_STATUS_LABEL[value]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Account/property/access notes (jangan simpan password atau secret)."
        />
        <Button size="sm" variant="outline" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Simpan Registry
        </Button>
      </CardContent>
    </Card>
  );
}

function EvidenceTab({
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
            File disimpan privat. Extraction/parsing belum dijalankan pada langkah ini dan akan ditampilkan apa adanya sebagai stored evidence.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 lg:grid-cols-2">
          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2 font-medium">
              <UploadCloud className="size-4" /> Upload File
            </div>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            <p className="text-xs text-muted-foreground">Maksimal 50 MB. File tidak otomatis dianggap sudah diparsing.</p>
            <Button onClick={() => upload.mutate()} disabled={!file || upload.isPending}>
              {upload.isPending ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              Simpan File
            </Button>
          </div>

          <div className="space-y-3 rounded-lg border p-4">
            <div className="flex items-center gap-2 font-medium">
              <Link2 className="size-4" /> Add Link
            </div>
            <Input value={linkTitle} onChange={(e) => setLinkTitle(e.target.value)} placeholder="Judul / keterangan" />
            <Input value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="https://..." />
            <p className="text-xs text-muted-foreground">Link hanya diregistrasikan; kontennya belum otomatis di-crawl.</p>
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
          <CardDescription>{rows.length} item tersimpan untuk project ini.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <InlineLoader label="Memuat evidence…" />
          ) : rows.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Belum ada evidence. Tambahkan brief, laporan lama, spreadsheet, atau link yang relevan.
            </div>
          ) : (
            <div className="divide-y rounded-lg border">
              {rows.map((row) => (
                <EvidenceRow key={row.id} row={row} onChanged={onChanged} />
              ))}
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
          <Badge variant="outline">{row.source_type === "external_link" ? "Link" : "File"}</Badge>
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

function InlineLoader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin" /> {label}
    </div>
  );
}
