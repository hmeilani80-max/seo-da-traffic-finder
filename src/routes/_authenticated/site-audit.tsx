import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  Brain,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileWarning,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  analyzeAuditFn,
  createTaskFromFindingFn,
  getAuditDetailFn,
  listProjectAuditsFn,
  runSiteAuditFn,
  type AuditAnalysisOutput,
  type AuditFinding,
  type AuditFindingStatus,
} from "@/lib/seo/audit/audit.functions";
import { fetchProjects } from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/site-audit")({
  head: () => ({
    meta: [
      { title: "Site Audit — SEO Operating System" },
      {
        name: "description",
        content: "Comprehensive factual Site Audit per Project, AI analysis terpisah, dan Audit to Task.",
      },
    ],
  }),
  component: SiteAuditPage,
});

const STATUS_LABEL: Record<AuditFindingStatus, string> = {
  passed: "Passed",
  urgent: "Urgent",
  issue: "Issue",
  warning: "Warning",
  not_found: "Not Found",
  unable_to_verify: "Unable to Verify",
};

const STATUS_ORDER: AuditFindingStatus[] = [
  "urgent",
  "issue",
  "warning",
  "not_found",
  "unable_to_verify",
  "passed",
];

function findingBadge(status: AuditFindingStatus) {
  if (status === "urgent") return <Badge variant="destructive">Urgent</Badge>;
  if (status === "passed") return <Badge>Passed</Badge>;
  if (status === "issue") return <Badge variant="destructive" className="bg-orange-600">Issue</Badge>;
  return <Badge variant="outline">{STATUS_LABEL[status]}</Badge>;
}

function summaryNumber(summary: Record<string, unknown> | undefined, key: string) {
  const value = summary?.[key];
  return typeof value === "number" ? value : 0;
}

function SiteAuditPage() {
  const qc = useQueryClient();
  const listAudits = useServerFn(listProjectAuditsFn);
  const getAuditDetail = useServerFn(getAuditDetailFn);
  const runAudit = useServerFn(runSiteAuditFn);
  const analyzeAudit = useServerFn(analyzeAuditFn);
  const createTask = useServerFn(createTaskFromFindingFn);

  const [projectId, setProjectId] = useState("");
  const [auditId, setAuditId] = useState("");
  const [filter, setFilter] = useState<AuditFindingStatus | "all">("all");

  const projects = useQuery({
    queryKey: ["projects-list"],
    queryFn: fetchProjects,
  });

  useEffect(() => {
    if (!projectId && projects.data?.[0]?.id) setProjectId(projects.data[0].id);
  }, [projectId, projects.data]);

  const selectedProject = projects.data?.find((project) => project.id === projectId);

  const audits = useQuery({
    queryKey: ["site-audits", projectId],
    queryFn: () => listAudits({ data: { projectId } }),
    enabled: Boolean(projectId),
  });

  useEffect(() => {
    if (!projectId) {
      setAuditId("");
      return;
    }
    const rows = audits.data ?? [];
    if (!rows.length) {
      setAuditId("");
      return;
    }
    if (!rows.some((row) => row.id === auditId)) setAuditId(rows[0].id);
  }, [auditId, audits.data, projectId]);

  const detail = useQuery({
    queryKey: ["site-audit-detail", auditId],
    queryFn: () => getAuditDetail({ data: { auditId } }),
    enabled: Boolean(auditId),
  });

  const runMutation = useMutation({
    mutationFn: () => runAudit({ data: { projectId } }),
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ["site-audits", projectId] });
      setAuditId(result.auditId);
      toast.success(
        result.status === "partial"
          ? "Audit selesai dengan sebagian data yang tidak dapat diverifikasi"
          : "Comprehensive Site Audit selesai",
      );
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const analyzeMutation = useMutation({
    mutationFn: () => analyzeAudit({ data: { auditId } }),
    onSuccess: async (result) => {
      await qc.invalidateQueries({ queryKey: ["site-audit-detail", auditId] });
      if (result.error) toast.error(result.error);
      else toast.success("AI Audit Analyst selesai");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const taskMutation = useMutation({
    mutationFn: (findingId: string) => createTask({ data: { findingId } }),
    onSuccess: (result) =>
      toast.success(result.alreadyExists ? "Task untuk finding ini sudah ada" : "Finding ditambahkan ke Tasks"),
    onError: (error: Error) => toast.error(error.message),
  });

  const findings = detail.data?.findings ?? [];
  const filteredFindings = useMemo(
    () => (filter === "all" ? findings : findings.filter((item) => item.status === filter)),
    [filter, findings],
  );
  const latestAnalysis = detail.data?.analyses?.[0];
  const analysis = latestAnalysis?.output as AuditAnalysisOutput | undefined;
  const analysisByFinding = useMemo(
    () => new Map((analysis?.issueAnalyses ?? []).map((item) => [item.findingId, item])),
    [analysis],
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <ClipboardCheck className="h-4 w-4" />
            Wave 2 · Project-aware factual audit
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Comprehensive Site Audit</h1>
          <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
            Menjalankan semua pemeriksaan yang didukung pada satu Project. Fakta crawl disimpan
            terpisah dari analisis AI, dan setiap finding bermasalah dapat diubah menjadi Task.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => runMutation.mutate()}
          disabled={!projectId || !selectedProject?.client_domain || runMutation.isPending}
        >
          {runMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {runMutation.isPending ? "Menjalankan audit..." : "Run Comprehensive Audit"}
        </Button>
      </header>

      <Card>
        <CardContent className="grid gap-4 pt-6 md:grid-cols-[1fr_1.5fr]">
          <div className="space-y-2">
            <Label>Project</Label>
            <Select
              value={projectId}
              onValueChange={(value) => {
                setProjectId(value);
                setAuditId("");
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Project" />
              </SelectTrigger>
              <SelectContent>
                {(projects.data ?? []).map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="rounded-lg border bg-muted/20 p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Target Website</p>
            <p className="mt-1 font-medium">{selectedProject?.client_domain || "Website belum diisi pada Project"}</p>
            {!selectedProject?.client_domain && projectId && (
              <p className="mt-1 text-xs text-destructive">Isi domain Project terlebih dahulu sebelum menjalankan audit.</p>
            )}
          </div>
        </CardContent>
      </Card>

      {audits.data?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Audit History</CardTitle>
            <CardDescription>Pilih run untuk melihat factual findings dan AI analysis-nya.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {audits.data.map((audit) => (
                <Button
                  key={audit.id}
                  variant={audit.id === auditId ? "default" : "outline"}
                  onClick={() => setAuditId(audit.id)}
                  className="h-auto flex-col items-start py-2"
                >
                  <span>{new Date(audit.created_at).toLocaleString("id-ID")}</span>
                  <span className="text-xs opacity-80">{audit.status}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : projectId && !audits.isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Belum ada audit untuk Project ini. Klik <strong>Run Comprehensive Audit</strong> untuk memulai.
          </CardContent>
        </Card>
      ) : null}

      {detail.isLoading && auditId && (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin" /></div>
      )}

      {detail.data?.audit && (
        <>
          <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <Metric label="Urgent" value={summaryNumber(detail.data.audit.summary, "urgent")} icon={<ShieldAlert className="h-4 w-4" />} />
            <Metric label="Issue" value={summaryNumber(detail.data.audit.summary, "issue")} icon={<FileWarning className="h-4 w-4" />} />
            <Metric label="Warning" value={summaryNumber(detail.data.audit.summary, "warning")} icon={<AlertTriangle className="h-4 w-4" />} />
            <Metric label="Not Found" value={summaryNumber(detail.data.audit.summary, "not_found")} icon={<FileWarning className="h-4 w-4" />} />
            <Metric label="Unable" value={summaryNumber(detail.data.audit.summary, "unable_to_verify")} icon={<AlertTriangle className="h-4 w-4" />} />
            <Metric label="Passed" value={summaryNumber(detail.data.audit.summary, "passed")} icon={<CheckCircle2 className="h-4 w-4" />} />
          </section>

          {detail.data.audit.status === "partial" && (
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
              Sebagian crawl tidak dapat diverifikasi. Findings yang berhasil tetap disimpan; data yang gagal tidak menghapus hasil lainnya.
            </div>
          )}

          <Card>
            <CardHeader className="flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2"><Brain className="h-5 w-5" />AI Audit Analyst</CardTitle>
                <CardDescription>
                  Dipanggil hanya saat tombol ditekan. AI membaca factual findings; AI tidak menghasilkan metrik atau fakta crawl.
                </CardDescription>
              </div>
              <Button
                variant="outline"
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending || findings.length === 0}
              >
                {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                {latestAnalysis ? "Analyze Again" : "Analyze with AI"}
              </Button>
            </CardHeader>
            <CardContent>
              {latestAnalysis?.status === "ok" && analysis ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-semibold">Executive Summary</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{analysis.executiveSummary}</p>
                  </div>
                  {!!analysis.nextActions?.length && (
                    <div>
                      <p className="text-sm font-semibold">Recommended Next Actions</p>
                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                        {analysis.nextActions.map((item) => <li key={item}>{item}</li>)}
                      </ol>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">Provider: {latestAnalysis.provider}</p>
                </div>
              ) : latestAnalysis?.error ? (
                <p className="text-sm text-destructive">{latestAnalysis.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">Belum ada AI analysis untuk audit ini.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Factual Findings</CardTitle>
                  <CardDescription>{findings.length} checks tersimpan dengan evidence dan source.</CardDescription>
                </div>
                <Select value={filter} onValueChange={(value) => setFilter(value as AuditFindingStatus | "all")}>
                  <SelectTrigger className="w-[190px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Status</SelectItem>
                    {STATUS_ORDER.map((status) => (
                      <SelectItem key={status} value={status}>{STATUS_LABEL[status]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredFindings.map((item) => (
                <FindingCard
                  key={item.id}
                  finding={item}
                  analysis={analysisByFinding.get(item.id)}
                  creatingTask={taskMutation.isPending && taskMutation.variables === item.id}
                  onCreateTask={() => taskMutation.mutate(item.id)}
                />
              ))}
              {!filteredFindings.length && (
                <p className="py-8 text-center text-sm text-muted-foreground">Tidak ada finding pada filter ini.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, icon }: { label: string; value: number; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between text-muted-foreground">{icon}<span className="text-xs">{label}</span></div>
        <p className="mt-2 text-2xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  );
}

function FindingCard({
  finding,
  analysis,
  creatingTask,
  onCreateTask,
}: {
  finding: AuditFinding;
  analysis?: AuditAnalysisOutput["issueAnalyses"][number];
  creatingTask: boolean;
  onCreateTask: () => void;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {findingBadge(finding.status)}
            <Badge variant="outline">{finding.category}</Badge>
            <span className="text-xs text-muted-foreground">{finding.check_key}</span>
          </div>
          <h3 className="mt-2 font-semibold">{finding.title}</h3>
          {finding.url && (
            <a href={finding.url} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-1 truncate text-xs text-primary hover:underline">
              {finding.url}<ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          )}
        </div>
        {finding.status !== "passed" && (
          <Button size="sm" variant="outline" onClick={onCreateTask} disabled={creatingTask}>
            {creatingTask ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
            Buat Task
          </Button>
        )}
      </div>

      <details className="mt-3 rounded-md bg-muted/30 p-3">
        <summary className="cursor-pointer text-xs font-medium">Lihat factual evidence</summary>
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words text-xs text-muted-foreground">
          {JSON.stringify(finding.evidence, null, 2)}
        </pre>
        <p className="mt-2 text-xs text-muted-foreground">Source: {finding.source_type}</p>
      </details>

      {analysis && (
        <div className="mt-3 rounded-md border bg-background p-3 text-sm">
          <div className="mb-2 flex items-center gap-2"><Brain className="h-4 w-4" /><strong>AI analysis · {analysis.priority}</strong></div>
          <p><strong>Why it matters:</strong> {analysis.whyItMatters}</p>
          <p className="mt-2"><strong>How to fix:</strong> {analysis.howToFix}</p>
          {analysis.suggestedFix && <p className="mt-2"><strong>Suggested fix:</strong> {analysis.suggestedFix}</p>}
        </div>
      )}
    </div>
  );
}
