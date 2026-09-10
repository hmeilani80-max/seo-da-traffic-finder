import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  decideProjectFieldSuggestionFn,
  generateProjectIntelligenceFn,
  type ProjectIntelligenceOutput,
} from "@/lib/project-intelligence.functions";
import {
  fetchProjectFieldSuggestions,
  fetchProjectIntelligenceRuns,
  type ProjectFieldSuggestionRow,
} from "@/lib/project-intelligence";
import type { ProjectRow } from "@/lib/projects";

const SECTIONS: Array<{ key: keyof Omit<ProjectIntelligenceOutput, "field_suggestions">; label: string }> = [
  { key: "business_understanding", label: "Business Understanding" },
  { key: "client_objectives", label: "Client Objectives" },
  { key: "available_data_and_access", label: "Available Data & Access" },
  { key: "initial_findings", label: "Initial Findings" },
  { key: "missing_information", label: "Missing Information" },
  { key: "suggested_questions", label: "Suggested Questions" },
  { key: "recommended_next_actions", label: "Recommended Next Actions" },
];

const FIELD_LABELS: Record<string, string> = {
  industry: "Industry",
  objectives: "Objectives",
  target_market: "Target Market",
  current_problem: "Current Problem",
  competitors: "Known Competitors",
  discovery_notes: "Discovery Notes",
};

export function ProjectIntelligencePanel({ project }: { project: ProjectRow }) {
  const qc = useQueryClient();
  const generate = useServerFn(generateProjectIntelligenceFn);
  const decide = useServerFn(decideProjectFieldSuggestionFn);

  const runs = useQuery({
    queryKey: ["project-intelligence-runs", project.id],
    queryFn: () => fetchProjectIntelligenceRuns(project.id),
  });
  const suggestions = useQuery({
    queryKey: ["project-field-suggestions", project.id],
    queryFn: () => fetchProjectFieldSuggestions(project.id),
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["project-intelligence-runs", project.id] });
    qc.invalidateQueries({ queryKey: ["project-field-suggestions", project.id] });
    qc.invalidateQueries({ queryKey: ["project", project.id] });
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["project-workspace-summary", project.id] });
  };

  const generation = useMutation({
    mutationFn: () => generate({ data: { projectId: project.id } }),
    onSuccess: (result) => {
      refresh();
      if (result.error) toast.error(result.error);
      else toast.success("AI Client Intelligence selesai");
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Gagal menjalankan AI Intelligence"),
  });

  const latestRun = runs.data?.[0];
  const output = latestRun?.status === "ok" ? (latestRun.output as ProjectIntelligenceOutput) : null;
  const pendingSuggestions = (suggestions.data ?? []).filter((item) => item.status === "pending");

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5" /> AI Client Intelligence
            </CardTitle>
            <CardDescription className="mt-1 max-w-3xl">
              Menggunakan hanya Project profile, data-source registry, dan evidence text yang sudah tersedia. Tidak memanggil Ahrefs atau membuat metrik SEO pada page load.
            </CardDescription>
          </div>
          <Button onClick={() => generation.mutate()} disabled={generation.isPending}>
            {generation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {latestRun ? "Regenerate" : "Generate Intelligence"}
          </Button>
        </CardHeader>
        <CardContent>
          {runs.isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Memuat intelligence…
            </div>
          ) : !latestRun ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Belum ada AI Client Intelligence. Lengkapi Project Context dan Evidence, lalu jalankan secara eksplisit.
            </div>
          ) : latestRun.status !== "ok" ? (
            <div className="rounded-lg border p-4 text-sm">
              <div className="mb-2 flex items-center gap-2">
                <Badge variant="destructive">Failed</Badge>
                <span className="text-muted-foreground">{formatDate(latestRun.created_at)}</span>
              </div>
              <p>{latestRun.error || "AI run gagal tanpa detail error."}</p>
            </div>
          ) : output ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline">{latestRun.provider}</Badge>
                <span>{formatDate(latestRun.created_at)}</span>
                <span>•</span>
                <span>Output AI — bukan measured SEO metrics</span>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {SECTIONS.map((section) => {
                  const items = output[section.key] ?? [];
                  return (
                    <div key={section.key} className="rounded-lg border p-4">
                      <h3 className="mb-2 text-sm font-semibold">{section.label}</h3>
                      {items.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Tidak ada informasi yang cukup.</p>
                      ) : (
                        <ul className="space-y-2 text-sm">
                          {items.map((item) => (
                            <li key={item} className="flex gap-2">
                              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-foreground/50" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">AI Field Suggestions</CardTitle>
          <CardDescription>
            AI tidak dapat mengubah Project profile sendiri. Edit bila perlu, lalu Accept, atau Ignore.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {suggestions.isLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Memuat suggestions…
            </div>
          ) : pendingSuggestions.length === 0 ? (
            <p className="text-sm text-muted-foreground">Tidak ada pending field suggestion.</p>
          ) : (
            <div className="space-y-3">
              {pendingSuggestions.map((suggestion) => (
                <SuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onDecision={async (decision, editedValue) => {
                    const result = await decide({
                      data: {
                        suggestionId: suggestion.id,
                        decision,
                        ...(editedValue === undefined ? {} : { editedValue }),
                      },
                    });
                    if (result.error) throw new Error(result.error);
                    refresh();
                  }}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SuggestionCard({
  suggestion,
  onDecision,
}: {
  suggestion: ProjectFieldSuggestionRow;
  onDecision: (decision: "accept" | "ignore", editedValue?: string) => Promise<void>;
}) {
  const [value, setValue] = useState(suggestion.suggested_value);
  const [pending, setPending] = useState<"accept" | "ignore" | null>(null);
  const changed = useMemo(() => value !== suggestion.suggested_value, [value, suggestion.suggested_value]);

  async function decide(decision: "accept" | "ignore") {
    setPending(decision);
    try {
      if (decision === "accept") await onDecision(decision, value);
      else await onDecision(decision);
      toast.success(decision === "accept" ? "Suggestion diterapkan ke Project" : "Suggestion diabaikan");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan keputusan");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{FIELD_LABELS[suggestion.field] ?? suggestion.field}</p>
          {suggestion.rationale && <p className="mt-1 text-xs text-muted-foreground">{suggestion.rationale}</p>}
        </div>
        {changed && <Badge variant="secondary">Edited</Badge>}
      </div>
      <Textarea value={value} onChange={(event) => setValue(event.target.value)} rows={3} />
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => void decide("accept")} disabled={pending !== null || !value.trim()}>
          {pending === "accept" ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
          {changed ? "Accept Edited" : "Accept"}
        </Button>
        <Button size="sm" variant="outline" onClick={() => void decide("ignore")} disabled={pending !== null}>
          {pending === "ignore" ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
          Ignore
        </Button>
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Date(value).toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}
