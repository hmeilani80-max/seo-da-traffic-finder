import { createFileRoute, Link, Outlet, useParams, useRouterState } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react";
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
import {
  LIFECYCLE,
  LIFECYCLE_LABEL,
  LIFECYCLE_TONE,
  fetchProject,
  setProjectLifecycle,
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

const TABS = [
  { to: "/projects/$projectId", label: "Overview", exact: true },
  { to: "/projects/$projectId/intelligence", label: "Intelligence" },
  { to: "/projects/$projectId/data-sources", label: "Sumber Data" },
  { to: "/projects/$projectId/files", label: "File & Evidence" },
] as const;

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

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <Link
        to="/projects"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Semua Proyek
      </Link>

      {/* Hero */}
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

      {/* Local nav */}
      <nav className="flex flex-wrap gap-1 rounded-2xl border border-border bg-card p-1">
        {TABS.map((tab) => {
          const href = tab.to.replace("$projectId", projectId);
          const active = tab.exact ? pathname === href : pathname.startsWith(href);
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

      <Outlet />
    </div>
  );
}
