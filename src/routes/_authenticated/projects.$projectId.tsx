import { createFileRoute, Link, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Brain,
  Database,
  ExternalLink,
  FileText,
  Loader2,
  Target,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectProfileDialog } from "@/components/project/ProjectProfileDialog";
import { cn } from "@/lib/utils";
import { fetchEvidence } from "@/lib/evidence";
import { fetchProjectDataSources } from "@/lib/data-sources";
import { fetchIntelligenceRuns } from "@/lib/project-intelligence";
import {
  LIFECYCLE,
  LIFECYCLE_LABEL,
  LIFECYCLE_TONE,
  fetchProject,
  setProjectLifecycle,
  type ProjectFull,
} from "@/lib/project-profile";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Workspace Proyek — SEO Operating System" },
      {
        name: "description",
        content:
          "Workspace proyek klien: konteks bisnis, sumber data, bukti pendukung, dan analisis AI dalam satu tempat.",
      },
      { property: "og:title", content: "Workspace Proyek — SEO Operating System" },
      {
        property: "og:description",
        content: "Konteks klien, evidence, sumber data, dan AI Client Intelligence.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectWorkspaceLayout,
});

const TABS: { to: string; label: string; exact?: boolean }[] = [
  { to: "/projects/$projectId", label: "Overview", exact: true },
  { to: "/projects/$projectId/intelligence", label: "Intelligence" },
  { to: "/projects/$projectId/data-sources", label: "Sumber Data" },
  { to: "/projects/$projectId/files", label: "File & Evidence" },
];

function ProjectWorkspaceLayout() {
  const { projectId } = useParams({ from: "/_authenticated/projects/$projectId" });
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();

  const projectQuery = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });

  const lifecycleMutation = useMutation({
    mutationFn: (value: string) => setProjectLifecycle(projectId, value),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      qc.invalidateQueries({ queryKey: ["projects-full"] });
      toast.success("Status proyek diperbarui");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal memperbarui"),
  });

  if (projectQuery.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const project = projectQuery.data;
  if (!project) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-medium">Proyek tidak ditemukan</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Proyek mungkin telah dihapus atau berada di workspace lain.
        </p>
        <Button asChild className="mt-4" variant="outline">
          <Link to="/projects">Kembali ke daftar proyek</Link>
        </Button>
      </div>
    );
  }

  const overviewPath = `/projects/${projectId}`;
  const isOverview = pathname === overviewPath || pathname === `${overviewPath}/`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Semua Proyek
      </Link>

      <section className="relative overflow-hidden rounded-3xl bg-brand-teal px-6 py-7 text-brand-teal-foreground sm:px-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-10 top-1/2 hidden h-64 w-72 -translate-y-1/2 md:block"
        >
          <div className="absolute right-16 top-4 size-28 rounded-3xl bg-white/10" />
          <div className="absolute right-2 top-16 size-40 rounded-full bg-white/10" />
          <div className="absolute bottom-4 right-24 flex h-20 items-end gap-1.5 rounded-2xl bg-white/15 p-3">
            {[38, 60, 28, 72, 46].map((h, i) => (
              <span key={i} className="w-3 rounded-full bg-white/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>

        <div className="relative max-w-2xl">
          <p className="text-xs uppercase tracking-wider text-brand-teal-foreground/70">
            Workspace Proyek
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">{project.name}</h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            {project.client_domain ? (
              <a
                href={`https://${project.client_domain}`}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 hover:bg-white/25"
              >
                {project.client_domain} <ExternalLink className="size-3.5" />
              </a>
            ) : (
              <span className="rounded-full bg-white/15 px-3 py-1">Domain belum ditentukan</span>
            )}
            <Badge variant="outline" className={cn("border-0", LIFECYCLE_TONE[project.lifecycle_status])}>
              {LIFECYCLE_LABEL[project.lifecycle_status] ?? project.lifecycle_status}
            </Badge>
            {project.industry && (
              <span className="rounded-full bg-white/15 px-3 py-1">{project.industry}</span>
            )}
          </div>

          {project.objectives.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {project.objectives.map((o) => (
                <span key={o} className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs">
                  {o}
                </span>
              ))}
            </div>
          )}

          <div className="mt-5 flex flex-wrap items-center gap-2">
            <ProjectProfileDialog project={project} />
            <Select
              value={project.lifecycle_status}
              onValueChange={(v) => lifecycleMutation.mutate(v)}
            >
              <SelectTrigger className="w-48 border-white/30 bg-white/15 text-brand-teal-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LIFECYCLE.map((s) => (
                  <SelectItem key={s} value={s}>
                    {LIFECYCLE_LABEL[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <nav className="flex flex-wrap gap-1 rounded-2xl border border-border bg-card p-1">
        {TABS.map((tab) => {
          const href = tab.to.replace("$projectId", projectId);
          const active = tab.exact ? isOverview : pathname.startsWith(href);
          return (
            <Link
              key={tab.label}
              to={tab.to}
              params={{ projectId }}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {isOverview ? <ProjectOverview project={project} /> : <Outlet />}
    </div>
  );
}

function ProjectOverview({ project }: { project: ProjectFull }) {
  const evidence = useQuery({
    queryKey: ["evidence", project.id],
    queryFn: () => fetchEvidence(project.id),
    enabled: Boolean(project.workspace_id),
  });
  const sources = useQuery({
    queryKey: ["project-data-sources", project.id],
    queryFn: () => fetchProjectDataSources(project.id),
    enabled: Boolean(project.workspace_id),
  });
  const intelligence = useQuery({
    queryKey: ["intelligence-runs", project.id],
    queryFn: () => fetchIntelligenceRuns(project.id),
    enabled: Boolean(project.workspace_id),
  });

  const evidenceRows = evidence.data ?? [];
  const sourceRows = sources.data ?? [];
  const latestIntelligence = intelligence.data?.[0];
  const availableSources = sourceRows.filter((row) => row.status !== "not_connected").length;

  const nextActions: { label: string; to: string }[] = [];
  if (!project.client_domain || !project.industry || !project.target_market || !project.current_problem) {
    nextActions.push({ label: "Lengkapi profil & konteks bisnis", to: `/projects/${project.id}` });
  }
  if (project.objectives.length === 0) {
    nextActions.push({ label: "Tentukan objective utama", to: `/projects/${project.id}` });
  }
  if (sourceRows.length === 0) {
    nextActions.push({ label: "Catat sumber data & akses yang tersedia", to: `/projects/${project.id}/data-sources` });
  }
  if (evidenceRows.length === 0) {
    nextActions.push({ label: "Tambahkan file, link, atau evidence manual", to: `/projects/${project.id}/files` });
  }
  if (!latestIntelligence) {
    nextActions.push({ label: "Jalankan AI Client Intelligence", to: `/projects/${project.id}/intelligence` });
  }

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <OverviewKpi
          icon={Target}
          label="Objective"
          value={project.objectives.length ? `${project.objectives.length} tercatat` : "Belum diisi"}
          className="bg-kpi-peach"
        />
        <OverviewKpi
          icon={Database}
          label="Sumber Data"
          value={sourceRows.length ? `${availableSources}/${sourceRows.length} tersedia` : "Belum dicatat"}
          className="bg-kpi-aqua"
        />
        <OverviewKpi
          icon={FileText}
          label="Evidence"
          value={evidenceRows.length ? `${evidenceRows.length} item` : "Belum ada"}
          className="bg-kpi-lime"
        />
        <OverviewKpi
          icon={Brain}
          label="AI Intelligence"
          value={latestIntelligence ? "Analisis tersedia" : "Belum dijalankan"}
          className="bg-kpi-cream"
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold">Konteks Client & Bisnis</h2>
              <p className="text-sm text-muted-foreground">Informasi discovery yang sudah dikonfirmasi.</p>
            </div>
            <ProjectProfileDialog project={project} />
          </div>

          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <ContextItem label="Industri" value={project.industry} />
            <ContextItem label="Target Market" value={project.target_market} />
            <ContextItem label="Kontak Person" value={project.contact_person} />
            <ContextItem label="Indikasi Budget" value={project.budget_indication} />
            <div className="sm:col-span-2">
              <ContextItem label="Masalah / Pain Point" value={project.current_problem} />
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Objective</p>
              {project.objectives.length ? (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {project.objectives.map((objective) => (
                    <Badge key={objective} variant="secondary">{objective}</Badge>
                  ))}
                </div>
              ) : (
                <p className="mt-1 text-sm text-muted-foreground">Belum tersedia</p>
              )}
            </div>
          </dl>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="font-semibold">Next Actions</h2>
          <p className="text-sm text-muted-foreground">Berdasarkan kelengkapan Project saat ini.</p>
          {nextActions.length === 0 ? (
            <p className="mt-4 rounded-xl bg-kpi-lime px-4 py-3 text-sm">
              Fondasi Project sudah lengkap. Lanjutkan ke assessment SEO berikutnya.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {nextActions.slice(0, 5).map((action) => (
                <Link
                  key={`${action.to}-${action.label}`}
                  to={action.to}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border px-3 py-2.5 text-sm transition-colors hover:bg-muted/60"
                >
                  <span>{action.label}</span>
                  <ArrowRight className="size-4 shrink-0 text-primary" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">Evidence Terbaru</h2>
            <Link to={`/projects/${project.id}/files`} className="text-sm font-medium text-primary hover:underline">
              Lihat semua
            </Link>
          </div>
          {evidenceRows.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">Belum ada evidence yang disimpan.</p>
          ) : (
            <div className="mt-3 divide-y divide-border">
              {evidenceRows.slice(0, 4).map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{row.title ?? row.original_filename ?? "Evidence"}</p>
                    <p className="text-xs text-muted-foreground">{row.source_type} · {row.processing_status}</p>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(row.created_at).toLocaleDateString("id-ID")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-semibold">AI Client Intelligence</h2>
            <Link to={`/projects/${project.id}/intelligence`} className="text-sm font-medium text-primary hover:underline">
              Buka Intelligence
            </Link>
          </div>
          {latestIntelligence ? (
            <div className="mt-4">
              <Badge variant={latestIntelligence.status === "ok" ? "secondary" : "destructive"}>
                {latestIntelligence.status === "ok" ? "Analisis tersedia" : "Analisis gagal"}
              </Badge>
              <p className="mt-2 text-sm text-muted-foreground">
                Terakhir dijalankan {new Date(latestIntelligence.created_at).toLocaleString("id-ID")}
                {latestIntelligence.provider ? ` · ${latestIntelligence.provider}` : ""}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                AI hanya menalar data Project dan evidence yang tersedia; metrik SEO tidak dibuat atau ditebak.
              </p>
            </div>
          ) : (
            <div className="mt-4 rounded-xl border border-dashed border-border p-4">
              <p className="text-sm font-medium">Belum ada analisis AI.</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Tambahkan konteks/evidence terlebih dahulu, lalu jalankan analisis saat diperlukan.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function OverviewKpi({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof Target;
  label: string;
  value: string;
  className: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-foreground/70">{label}</p>
        <Icon className="size-4 text-foreground/60" />
      </div>
      <p className="mt-2 text-lg font-bold">{value}</p>
    </div>
  );
}

function ContextItem({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value?.trim() || "Belum tersedia"}</dd>
    </div>
  );
}
