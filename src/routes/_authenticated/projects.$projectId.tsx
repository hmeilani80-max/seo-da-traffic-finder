import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Database, FileSpreadsheet, FileText, FolderKanban, Loader2, Sparkles } from "lucide-react";

import { ProjectDataSourcesPanel } from "@/components/project/ProjectDataSourcesPanel";
import { ProjectEvidencePanel } from "@/components/project/ProjectEvidencePanel";
import { ProjectImportPanel } from "@/components/project/ProjectImportPanel";
import { ProjectIntelligencePanel } from "@/components/project/ProjectIntelligencePanel";
import { ProjectOverviewPanel } from "@/components/project/ProjectOverviewPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PROJECT_LIFECYCLE_LABEL, fetchProject } from "@/lib/projects";
import {
  fetchProjectDataSources,
  fetchProjectEvidence,
  fetchProjectWorkspaceSummary,
} from "@/lib/project-workspace";

export const Route = createFileRoute("/_authenticated/projects/$projectId")({
  head: () => ({
    meta: [
      { title: "Project Workspace — SEO Operating System" },
      {
        name: "description",
        content: "Kelola context client, data source, evidence, structured import, dan AI Client Intelligence.",
      },
    ],
  }),
  component: ProjectWorkspacePage,
});

function ProjectWorkspacePage() {
  const { projectId } = Route.useParams();
  const qc = useQueryClient();

  const project = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => fetchProject(projectId),
  });
  const summary = useQuery({
    queryKey: ["project-workspace-summary", projectId],
    queryFn: () => fetchProjectWorkspaceSummary(projectId),
  });
  const evidence = useQuery({
    queryKey: ["project-evidence", projectId],
    queryFn: () => fetchProjectEvidence(projectId),
  });
  const sources = useQuery({
    queryKey: ["project-data-sources", projectId],
    queryFn: () => fetchProjectDataSources(projectId),
  });

  const refreshWorkspace = () => {
    qc.invalidateQueries({ queryKey: ["project", projectId] });
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["project-workspace-summary", projectId] });
    qc.invalidateQueries({ queryKey: ["project-evidence", projectId] });
    qc.invalidateQueries({ queryKey: ["project-data-sources", projectId] });
  };

  if (project.isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="size-7 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (project.error || !project.data) {
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

  const row = project.data;
  const stats = summary.data;

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
          {PROJECT_LIFECYCLE_LABEL[row.lifecycle_status] ?? row.lifecycle_status}
        </Badge>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>Project Workspace</span>
              <span>•</span>
              <span>{row.client_domain || "Website belum diisi"}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{row.name}</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              {row.description || "Lengkapi business context, data access, dan evidence sebelum masuk ke research dan audit."}
            </p>
          </div>
          <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Lifecycle</p>
            <p className="mt-1 font-semibold">
              {PROJECT_LIFECYCLE_LABEL[row.lifecycle_status] ?? row.lifecycle_status}
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Evidence" value={summary.isLoading ? "…" : String(stats?.evidenceCount ?? 0)} detail="source context tersimpan" icon={<FileText className="size-4" />} />
        <Metric label="Data Sources" value={summary.isLoading ? "…" : `${stats?.readySourceCount ?? 0}/${stats?.sourceCount ?? 0}`} detail="access/connection tercatat" icon={<Database className="size-4" />} />
        <Metric label="Placement Orders" value={summary.isLoading ? "…" : String(stats?.placementOrderCount ?? 0)} detail="terkait Project ini" icon={<FolderKanban className="size-4" />} />
        <Metric label="AI Intelligence" value={summary.isLoading ? "…" : String(stats?.intelligenceRunCount ?? 0)} detail="grounded intelligence runs" icon={<Sparkles className="size-4" />} />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="sources">Data Sources</TabsTrigger>
          <TabsTrigger value="evidence">Files & Evidence</TabsTrigger>
          <TabsTrigger value="intelligence">AI Intelligence</TabsTrigger>
          <TabsTrigger value="import">Structured Import</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <ProjectOverviewPanel
            project={row}
            {...(stats === undefined ? {} : { summary: stats })}
            onSaved={refreshWorkspace}
          />
        </TabsContent>
        <TabsContent value="sources">
          <ProjectDataSourcesPanel
            project={row}
            rows={sources.data ?? []}
            loading={sources.isLoading}
            onSaved={refreshWorkspace}
          />
        </TabsContent>
        <TabsContent value="evidence">
          <ProjectEvidencePanel
            project={row}
            rows={evidence.data ?? []}
            loading={evidence.isLoading}
            onChanged={refreshWorkspace}
          />
        </TabsContent>
        <TabsContent value="intelligence">
          <ProjectIntelligencePanel project={row} />
        </TabsContent>
        <TabsContent value="import">
          <ProjectImportPanel project={row} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Metric({
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
