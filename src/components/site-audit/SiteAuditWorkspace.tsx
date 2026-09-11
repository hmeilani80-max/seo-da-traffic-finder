import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CheckCircle2,
  ExternalLink,
  FileSearch,
  FileWarning,
  Globe,
  Info,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Sparkles,
  Wrench,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { createReviewedTaskFromFindingFn } from "@/lib/seo/audit/audit-task.functions";
import {
  analyzeAuditFn,
  getAuditDetailFn,
  listProjectAuditsFn,
  runSiteAuditFn,
  type AuditAnalysisOutput,
  type AuditFinding,
  type AuditFindingStatus,
} from "@/lib/seo/audit/audit.functions";
import { fetchProjects, type ProjectRow } from "@/lib/projects";

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

const STATUS_RANK = new Map(STATUS_ORDER.map((status, index) => [status, index]));

const LIFECYCLE_LABEL: Record<string, string> = {
  prospect: "Prospect",
  proposal: "Proposal",
  deal: "Deal",
  active: "Active",
  paused: "Paused",
  completed: "Completed",
  lost: "Lost",
};

const TASK_PRIORITY = ["low", "medium", "high", "urgent"] as const;
type TaskPriority = (typeof TASK_PRIORITY)[number];

type FindingGroup = {
  key: string;
  title: string;
  category: string;
  status: AuditFindingStatus;
  findings: AuditFinding[];
  urls: string[];
  sourceTypes: string[];
};

type TaskDraft = {
  group: FindingGroup;
  title: string;
  priority: TaskPriority;
};

function numericValue(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "number" ? value : 0;
}

function sentenceCase(value: string) {
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function severityBadge(status: AuditFindingStatus) {
  if (status === "urgent") {
    return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" />Urgent</Badge>;
  }
  if (status === "issue") {
    return <Badge className="gap-1 bg-orange-600 hover:bg-orange-600"><AlertTriangle className="h-3 w-3" />Issue</Badge>;
  }
  if (status === "warning") {
    return <Badge variant="secondary" className="gap-1 border border-amber-200 bg-amber-50 text-amber-800"><AlertTriangle className="h-3 w-3" />Warning</Badge>;
  }
  if (status === "passed") {
    return <Badge variant="secondary" className="gap-1 border border-emerald-200 bg-emerald-50 text-emerald-800"><CheckCircle2 className="h-3 w-3" />Passed</Badge>;
  }
  if (status === "not_found") {
    return <Badge variant="outline" className="gap-1"><Search className="h-3 w-3" />Not Found</Badge>;
  }
  return <Badge variant="outline" className="gap-1"><Info className="h-3 w-3" />Unable to Verify</Badge>;
}

function defaultTaskPriority(status: AuditFindingStatus): TaskPriority {
  if (status === "urgent") return "urgent";
  if (status === "issue") return "high";
  return "medium";
}

function groupFindings(findings: AuditFinding[]): FindingGroup[] {
  const grouped = new Map<string, FindingGroup>();

  for (const finding of findings) {
    const key = `${finding.status}|${finding.category}|${finding.title}`;
    const current = grouped.get(key);
    if (current) {
      current.findings.push(finding);
      if (finding.url && !current.urls.includes(finding.url)) current.urls.push(finding.url);
      if (!current.sourceTypes.includes(finding.source_type)) current.sourceTypes.push(finding.source_type);
      continue;
    }

    grouped.set(key, {
      key,
      title: finding.title,
      category: finding.category,
      status: finding.status,
      findings: [finding],
      urls: finding.url ? [finding.url] : [],
      sourceTypes: [finding.source_type],
    });
  }

  return [...grouped.values()].sort((left, right) => {
    const statusDiff = (STATUS_RANK.get(left.status) ?? 99) - (STATUS_RANK.get(right.status) ?? 99);
    if (statusDiff !== 0) return statusDiff;
    return left.title.localeCompare(right.title);
  });
}

function ProjectHero({ project, onRun, running }: { project?: ProjectRow; onRun: () => void; running: boolean }) {
  const lifecycle = project?.lifecycle_status || project?.status || "prospect";
  const lifecycleLabel = LIFECYCLE_LABEL[lifecycle] ?? sentenceCase(lifecycle);

  return (
    <header className="relative overflow-hidden rounded-2xl border border-teal-900 bg-teal-800 p-6 text-white shadow-md sm:p-8">
      <div className="pointer-events-none absolute -right-24 -top-44 h-[30rem] w-[30rem] rounded-full bg-white/10 blur-3xl" />
      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-teal-200">Projects / {project?.name || "Select Project"}</p>
          <h1 className="mt-2 truncate text-3xl font-bold tracking-tight sm:text-4xl">{project?.name || "Site Audit"}</h1>
          <div className="mt-5 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-teal-900/50 px-3 py-1.5 font-medium">
              <Globe className="h-4 w-4 text-teal-300" />
              {project?.client_domain || "Website not available"}
            </span>
            <span className="rounded-lg border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-wide">
              {lifecycleLabel}
            </span>
            {(project?.objectives ?? []).slice(0, 2).map((objective) => (
              <span key={objective} className="rounded-lg border border-teal-600/60 bg-teal-700/60 px-3 py-1.5 text-teal-50">
                {objective}
              </span>
            ))}
          </div>
        </div>
        <Button
          size="lg"
          onClick={onRun}
          disabled={!project?.client_domain || running}
          className="shrink-0 bg-orange-600 text-white hover:bg-orange-700"
        >
          {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {running ? "Running Audit..." : "Run Comprehensive Audit"}
        </Button>
      </div>
    </header>
  );
}

export function SiteAuditWorkspace({ initialProjectId }: { initialProjectId?: string }) {
  const qc = useQueryClient();
  const listAudits = useServerFn(listProjectAuditsFn);
  const getAuditDetail = useServerFn(getAuditDetailFn);
  const runAudit = useServerFn(runSiteAuditFn);
  const analyzeAudit = useServerFn(analyzeAuditFn);
  const createTask = useServerFn(createReviewedTaskFromFindingFn);

  const [projectId, setProjectId] = useState(initialProjectId ?? "");
  const [auditId, setAuditId] = useState("");
  const [statusFilter, setStatusFilter] = useState<AuditFindingStatus | "all">("all");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [selectedGroup, setSelectedGroup] = useState<FindingGroup | null>(null);
  const [taskDraft, setTaskDraft] = useState<TaskDraft | null>(null);

  const projects = useQuery({
    queryKey: ["projects-list"],
    queryFn: fetchProjects,
  });

  useEffect(() => {
    if (initialProjectId && projects.data?.some((project) => project.id === initialProjectId)) {
      setProjectId(initialProjectId);
      return;
    }
    if (!projectId && projects.data?.[0]?.id) setProjectId(projects.data[0].id);
  }, [initialProjectId, projectId, projects.data]);

  const selectedProject = projects.data?.find((project) => project.id === projectId);

  const audits = useQuery({
    queryKey: ["site-audits", projectId],
    queryFn: () => listAudits({ data: { projectId } }),
    enabled: Boolean(projectId),
  });

  useEffect(() => {
    const rows = audits.data ?? [];
    if (!projectId || !rows.length) {
      setAuditId("");
      return;
    }
    if (!rows.some((audit) => audit.id === auditId)) setAuditId(rows[0].id);
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
      setStatusFilter("all");
      setCategoryFilter("All");
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
      else toast.success("AI Audit Analysis selesai");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const taskMutation = useMutation({
    mutationFn: (draft: TaskDraft) =>
      createTask({
        data: {
          findingIds: draft.group.findings.map((finding) => finding.id),
          title: draft.title,
          priority: draft.priority,
        },
      }),
    onSuccess: (result) => {
      toast.success(result.alreadyExists ? "Task untuk finding ini sudah ada" : "Finding ditambahkan ke Tasks");
      setTaskDraft(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const findings = detail.data?.findings ?? [];
  const groups = useMemo(() => groupFindings(findings), [findings]);
  const categories = useMemo(
    () => ["All", ...[...new Set(groups.map((group) => group.category))].sort()],
    [groups],
  );
  const filteredGroups = useMemo(
    () =>
      groups.filter(
        (group) =>
          (categoryFilter === "All" || group.category === categoryFilter) &&
          (statusFilter === "all" || group.status === statusFilter),
      ),
    [categoryFilter, groups, statusFilter],
  );

  const latestAnalysis = detail.data?.analyses?.[0];
  const analysis = latestAnalysis?.output as AuditAnalysisOutput | undefined;
  const analysisByFinding = useMemo(
    () => new Map((analysis?.issueAnalyses ?? []).map((item) => [item.findingId, item])),
    [analysis],
  );
  const selectedGroupAnalysis = selectedGroup
    ? selectedGroup.findings.map((finding) => analysisByFinding.get(finding.id)).find(Boolean)
    : undefined;

  const passedChecks = summaryCount(detail.data?.audit.summary, "passed");
  const totalChecks = findings.length;
  const healthScore = totalChecks ? Math.round((passedChecks / totalChecks) * 100) : null;
  const sourceSummary = detail.data?.audit.source_summary;
  const pagesAttempted = numericValue(sourceSummary, "pages_attempted");
  const pagesSucceeded = numericValue(sourceSummary, "pages_succeeded");

  return (
    <div className="mx-auto max-w-[1400px] space-y-6 px-4 py-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Research & Intelligence</p>
          <h1 className="text-2xl font-bold tracking-tight">Site Audit</h1>
        </div>
        <div className="w-full sm:w-[280px]">
          <Label className="mb-1.5 block text-xs text-muted-foreground">Active Project</Label>
          <Select
            value={projectId}
            onValueChange={(value) => {
              setProjectId(value);
              setAuditId("");
              setSelectedGroup(null);
              setStatusFilter("all");
              setCategoryFilter("All");
            }}
          >
            <SelectTrigger><SelectValue placeholder="Select Project" /></SelectTrigger>
            <SelectContent>
              {(projects.data ?? []).map((project) => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <ProjectHero project={selectedProject} onRun={() => runMutation.mutate()} running={runMutation.isPending} />

      {selectedProject && !selectedProject.client_domain && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Primary website belum tersedia pada Project. Isi domain Project sebelum menjalankan Site Audit.
        </div>
      )}

      {runMutation.isPending && (
        <Card>
          <CardContent className="flex flex-col items-center py-14 text-center">
            <div className="mb-5 h-14 w-14 animate-spin rounded-full border-4 border-orange-100 border-t-orange-600" />
            <h2 className="text-xl font-semibold">Running Comprehensive Audit</h2>
            <p className="mt-2 max-w-xl text-sm text-muted-foreground">
              Checking crawlability, sitemap, robots.txt, technical signals, and supported on-page checks. Results are saved as each audit run completes.
            </p>
            <div className="mt-6 h-2 w-full max-w-lg overflow-hidden rounded-full bg-muted">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-orange-600" />
            </div>
          </CardContent>
        </Card>
      )}

      {!runMutation.isPending && projectId && !audits.isLoading && !audits.data?.length && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-orange-100 bg-orange-50 text-orange-600">
              <FileSearch className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold">No audit has been run yet</h2>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Run a comprehensive audit to identify supported technical and on-page findings across the primary website.
            </p>
            <Button
              className="mt-6 bg-orange-600 text-white hover:bg-orange-700"
              onClick={() => runMutation.mutate()}
              disabled={!selectedProject?.client_domain}
            >
              <Search className="h-4 w-4" />Run Comprehensive Audit
            </Button>
          </CardContent>
        </Card>
      )}

      {!!audits.data?.length && (
        <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Audit Run</p>
            <p className="mt-1 text-sm text-muted-foreground">Review the latest run or switch to a previous factual audit.</p>
          </div>
          <Select value={auditId} onValueChange={setAuditId}>
            <SelectTrigger className="w-full sm:w-[310px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {audits.data.map((audit) => (
                <SelectItem key={audit.id} value={audit.id}>
                  {new Date(audit.created_at).toLocaleString("id-ID")} · {sentenceCase(audit.status)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {detail.isLoading && auditId && (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin" /></div>
      )}

      {detail.data?.audit && !runMutation.isPending && (
        <>
          {detail.data.audit.status === "partial" && (
            <div className="flex flex-col gap-4 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-950 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5 text-amber-600" />Partial Audit Result</p>
                <p className="mt-1 text-sm">
                  {pagesSucceeded || 0} of {pagesAttempted || 0} attempted pages were successfully crawled. Successful findings remain preserved.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCategoryFilter("All");
                    setStatusFilter("unable_to_verify");
                  }}
                >
                  View Unable to Verify
                </Button>
                <Button className="bg-orange-600 text-white hover:bg-orange-700" onClick={() => runMutation.mutate()}>
                  <RefreshCw className="h-4 w-4" />Run New Audit
                </Button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Site Audit Overview</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Last audit: {new Date(detail.data.audit.created_at).toLocaleString("id-ID")}
                {pagesAttempted ? ` · ${pagesSucceeded}/${pagesAttempted} pages crawled` : ""}
              </p>
            </div>
            <Button variant="outline" onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
              <RefreshCw className="h-4 w-4" />Run New Audit
            </Button>
          </div>

          <section className="grid gap-4 lg:grid-cols-6">
            <Card className="lg:col-span-2">
              <CardContent className="flex h-full items-center gap-5 pt-6">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[10px] border-orange-100 bg-orange-50">
                  <span className="text-3xl font-bold text-orange-700">{healthScore ?? "—"}</span>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Site Health</p>
                  <p className="mt-1 text-lg font-semibold">{healthScore === null ? "Not Available" : healthScore >= 85 ? "Healthy" : healthScore >= 60 ? "Needs Attention" : "Needs Review"}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {healthScore === null ? "No factual checks available." : `${passedChecks} of ${totalChecks} factual checks passed.`}
                  </p>
                </div>
              </CardContent>
            </Card>
            <SummaryMetric label="Urgent" value={summaryCount(detail.data.audit.summary, "urgent")} tone="red" icon={<ShieldAlert className="h-4 w-4" />} />
            <SummaryMetric label="Issues" value={summaryCount(detail.data.audit.summary, "issue")} tone="orange" icon={<FileWarning className="h-4 w-4" />} />
            <SummaryMetric label="Warnings" value={summaryCount(detail.data.audit.summary, "warning")} tone="amber" icon={<AlertTriangle className="h-4 w-4" />} />
            <Card>
              <CardContent className="space-y-3 pt-5">
                <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Passed</span><CheckCircle2 className="h-4 w-4 text-emerald-600" /></div>
                <p className="text-2xl font-semibold text-emerald-700">{passedChecks}</p>
                <div className="grid grid-cols-2 gap-2 border-t pt-3 text-xs">
                  <div><p className="text-muted-foreground">Not Found</p><p className="font-semibold">{summaryCount(detail.data.audit.summary, "not_found")}</p></div>
                  <div><p className="text-muted-foreground">Unable to Verify</p><p className="font-semibold">{summaryCount(detail.data.audit.summary, "unable_to_verify")}</p></div>
                </div>
              </CardContent>
            </Card>
          </section>

          <Card>
            <CardHeader className="gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-violet-600" />AI Audit Analysis</CardTitle>
                <CardDescription>AI reasoning is separate from factual crawl data and runs only when explicitly requested.</CardDescription>
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
              {analyzeMutation.isPending ? (
                <div className="flex items-center gap-3 rounded-lg border border-violet-100 bg-violet-50 p-4 text-sm text-violet-900">
                  <Loader2 className="h-4 w-4 animate-spin" />Analyzing factual findings and preparing recommendations...
                </div>
              ) : latestAnalysis?.status === "ok" && analysis ? (
                <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-violet-700">AI Recommendation</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">{analysis.executiveSummary}</p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Recommended Next Actions</p>
                    {analysis.nextActions?.length ? (
                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
                        {analysis.nextActions.slice(0, 5).map((item) => <li key={item}>{item}</li>)}
                      </ol>
                    ) : <p className="mt-2 text-sm text-muted-foreground">No recommendation available.</p>}
                  </div>
                </div>
              ) : latestAnalysis?.error ? (
                <p className="text-sm text-destructive">{latestAnalysis.error}</p>
              ) : (
                <div className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">
                  Factual audit data is ready. Run AI analysis only when you want prioritization and remediation guidance.
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader className="border-b bg-muted/20">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <CardTitle>Audit Findings</CardTitle>
                  <CardDescription>{groups.length} grouped findings from {findings.length} factual checks.</CardDescription>
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                  <div className="flex max-w-full gap-2 overflow-x-auto pb-1">
                    {categories.map((category) => {
                      const count = category === "All" ? groups.length : groups.filter((group) => group.category === category).length;
                      return (
                        <Button
                          key={category}
                          size="sm"
                          variant={categoryFilter === category ? "secondary" : "ghost"}
                          className="shrink-0 rounded-full"
                          onClick={() => setCategoryFilter(category)}
                        >
                          {category}<span className="text-xs text-muted-foreground">{count}</span>
                        </Button>
                      );
                    })}
                  </div>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as AuditFindingStatus | "all")}>
                    <SelectTrigger className="w-full lg:w-[190px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      {STATUS_ORDER.map((status) => <SelectItem key={status} value={status}>{STATUS_LABEL[status]}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[280px] px-5">Finding</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Affected URLs</TableHead>
                    <TableHead className="pr-5 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGroups.map((group) => (
                    <TableRow key={group.key}>
                      <TableCell className="px-5 py-4">
                        <p className="font-semibold">{group.title}</p>
                        <p className="mt-1 text-xs text-muted-foreground">Source: {group.sourceTypes.map(sentenceCase).join(", ")}</p>
                      </TableCell>
                      <TableCell>{severityBadge(group.status)}</TableCell>
                      <TableCell><Badge variant="outline">{group.category}</Badge></TableCell>
                      <TableCell className="text-right font-medium">{group.urls.length || group.findings.length}</TableCell>
                      <TableCell className="pr-5 text-right">
                        <Button size="sm" variant="ghost" className="text-orange-700 hover:text-orange-800" onClick={() => setSelectedGroup(group)}>
                          View Details <ArrowRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!filteredGroups.length && (
                    <TableRow><TableCell colSpan={5} className="h-28 text-center text-muted-foreground">No findings match the current filters.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}

      <Sheet open={Boolean(selectedGroup)} onOpenChange={(open) => !open && setSelectedGroup(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
          {selectedGroup && (
            <div className="flex min-h-full flex-col">
              <SheetHeader className="pr-8">
                <div className="flex flex-wrap items-center gap-2">{severityBadge(selectedGroup.status)}<Badge variant="outline">{selectedGroup.category}</Badge></div>
                <SheetTitle className="pt-2 text-2xl">{selectedGroup.title}</SheetTitle>
                <SheetDescription>{selectedGroup.findings.length} factual check{selectedGroup.findings.length === 1 ? "" : "s"} in this finding group.</SheetDescription>
              </SheetHeader>

              <div className="mt-7 flex-1 space-y-6">
                <section className="rounded-xl border bg-muted/20 p-5">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-muted-foreground"><FileSearch className="h-4 w-4" />Factual Data</p>
                  <div className="mt-4 space-y-3">
                    {selectedGroup.findings.slice(0, 4).map((finding) => (
                      <div key={finding.id} className="rounded-lg border bg-background p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                          <span className="font-semibold">{finding.check_key}</span>
                          <span className="text-muted-foreground">Source: {sentenceCase(finding.source_type)}</span>
                        </div>
                        <div className="mt-3 grid gap-2 text-sm">
                          {Object.entries(finding.evidence ?? {}).slice(0, 8).map(([key, value]) => (
                            <div key={key} className="grid grid-cols-[130px_1fr] gap-3 border-t pt-2 first:border-0 first:pt-0">
                              <span className="text-muted-foreground">{sentenceCase(key)}</span>
                              <span className="break-words font-medium">{typeof value === "string" ? value : JSON.stringify(value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="overflow-hidden rounded-xl border">
                  <div className="flex items-center justify-between border-b bg-muted/30 px-4 py-3">
                    <p className="text-sm font-semibold">Affected URLs</p>
                    <Badge variant="secondary">{selectedGroup.urls.length || selectedGroup.findings.length}</Badge>
                  </div>
                  <div className="divide-y">
                    {selectedGroup.urls.slice(0, 6).map((url) => (
                      <a key={url} href={url} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-muted/30">
                        <span className="min-w-0 truncate">{url}</span><ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      </a>
                    ))}
                    {!selectedGroup.urls.length && <p className="px-4 py-4 text-sm text-muted-foreground">No page-level URL is associated with this site-wide check.</p>}
                    {selectedGroup.urls.length > 6 && <p className="bg-muted/20 px-4 py-3 text-center text-xs text-muted-foreground">+ {selectedGroup.urls.length - 6} more affected URLs</p>}
                  </div>
                </section>

                <section className="rounded-xl border border-violet-200 bg-violet-50/40 p-5">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-violet-800"><Sparkles className="h-4 w-4" />AI Recommendation</p>
                  {selectedGroupAnalysis ? (
                    <div className="mt-4 space-y-4 text-sm">
                      <div><p className="font-semibold">Why it matters</p><p className="mt-1 text-muted-foreground">{selectedGroupAnalysis.whyItMatters}</p></div>
                      <div><p className="font-semibold">How to fix</p><p className="mt-1 text-muted-foreground">{selectedGroupAnalysis.howToFix}</p></div>
                      {selectedGroupAnalysis.suggestedFix && <div className="rounded-lg border border-violet-100 bg-white/70 p-4"><p className="text-xs font-bold uppercase tracking-wide text-violet-800">Suggested Fix / Draft</p><p className="mt-2 text-sm text-violet-950">{selectedGroupAnalysis.suggestedFix}</p></div>}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-sm text-violet-900">AI analysis is optional and never replaces the factual evidence above.</p>
                      <Button className="mt-4" variant="outline" onClick={() => analyzeMutation.mutate()} disabled={analyzeMutation.isPending}>
                        {analyzeMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                        Analyze with AI
                      </Button>
                    </div>
                  )}
                </section>
              </div>

              <SheetFooter className="mt-6 border-t pt-5">
                {selectedGroup.status !== "passed" && (
                  <Button
                    className="bg-orange-600 text-white hover:bg-orange-700"
                    onClick={() => setTaskDraft({ group: selectedGroup, title: `Fix: ${selectedGroup.title}`, priority: defaultTaskPriority(selectedGroup.status) })}
                  >
                    <Wrench className="h-4 w-4" />Create Task
                  </Button>
                )}
              </SheetFooter>
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={Boolean(taskDraft)} onOpenChange={(open) => !open && setTaskDraft(null)}>
        <DialogContent>
          {taskDraft && (
            <>
              <DialogHeader>
                <DialogTitle>Create Task</DialogTitle>
                <DialogDescription>Review the task before saving. Source context from the audit finding group will be preserved.</DialogDescription>
              </DialogHeader>
              <div className="space-y-5 py-2">
                <div className="space-y-2">
                  <Label>Task Title</Label>
                  <Input value={taskDraft.title} onChange={(event) => setTaskDraft({ ...taskDraft, title: event.target.value })} />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Input value={selectedProject?.name || ""} disabled />
                  </div>
                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={taskDraft.priority} onValueChange={(priority) => setTaskDraft({ ...taskDraft, priority: priority as TaskPriority })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TASK_PRIORITY.map((priority) => <SelectItem key={priority} value={priority}>{sentenceCase(priority)}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4 text-sm">
                  <p className="font-semibold">Source Context</p>
                  <div className="mt-2 space-y-1 text-muted-foreground">
                    <p>Site Audit → {taskDraft.group.title}</p>
                    <p>→ {taskDraft.group.findings.length} factual checks</p>
                    <p>→ {taskDraft.group.urls.length} affected URLs</p>
                    <p>→ {taskDraft.group.sourceTypes.map(sentenceCase).join(", ")}</p>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTaskDraft(null)} disabled={taskMutation.isPending}>Cancel</Button>
                <Button
                  className="bg-orange-600 text-white hover:bg-orange-700"
                  onClick={() => taskMutation.mutate(taskDraft)}
                  disabled={taskMutation.isPending || !taskDraft.title.trim()}
                >
                  {taskMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wrench className="h-4 w-4" />}
                  Save Task
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function summaryCount(summary: Record<string, unknown> | undefined, key: string) {
  return numericValue(summary, key);
}

function SummaryMetric({ label, value, tone, icon }: { label: string; value: number; tone: "red" | "orange" | "amber"; icon: React.ReactNode }) {
  const toneClass = {
    red: "border-red-100 bg-red-50 text-red-900",
    orange: "border-orange-100 bg-orange-50 text-orange-900",
    amber: "border-amber-100 bg-amber-50 text-amber-900",
  }[tone];
  const valueClass = { red: "text-red-700", orange: "text-orange-700", amber: "text-amber-700" }[tone];

  return (
    <Card className={toneClass}>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide opacity-80"><span>{label}</span>{icon}</div>
        <p className={`mt-4 text-3xl font-bold ${valueClass}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
