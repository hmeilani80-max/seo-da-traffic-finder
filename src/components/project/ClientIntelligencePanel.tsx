import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { runProjectIntelligence } from "@/lib/project-intelligence.functions";
import {
  FIELD_LABEL,
  acceptSuggestion,
  fetchFieldSuggestions,
  fetchIntelligenceRuns,
  ignoreSuggestion,
  type FieldSuggestionRow,
} from "@/lib/project-intelligence";

const SECTIONS: { key: string; title: string }[] = [
  { key: "business_understanding", title: "Pemahaman Bisnis" },
  { key: "client_objectives", title: "Objective Klien" },
  { key: "available_data_access", title: "Data & Akses Tersedia" },
  { key: "initial_findings", title: "Temuan Awal" },
  { key: "missing_information", title: "Informasi yang Belum Ada" },
  { key: "discovery_questions", title: "Pertanyaan Discovery" },
  { key: "recommended_next_actions", title: "Rekomendasi Langkah Berikut" },
];

function renderValue(value: unknown) {
  if (Array.isArray(value)) {
    return (
      <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
        {value.map((v, i) => (
          <li key={i}>{String(v)}</li>
        ))}
      </ul>
    );
  }
  if (typeof value === "string" && value.trim()) {
    return <p className="text-sm text-muted-foreground">{value}</p>;
  }
  return <p className="text-sm text-muted-foreground">Belum tersedia.</p>;
}

export function ClientIntelligencePanel({ projectId }: { projectId: string }) {
  const qc = useQueryClient();
  const [prompt, setPrompt] = useState("");
  const runIntelligence = useServerFn(runProjectIntelligence);

  const runs = useQuery({
    queryKey: ["intelligence-runs", projectId],
    queryFn: () => fetchIntelligenceRuns(projectId),
  });
  const suggestions = useQuery({
    queryKey: ["field-suggestions", projectId],
    queryFn: () => fetchFieldSuggestions(projectId),
  });

  const runMutation = useMutation({
    mutationFn: () =>
      runIntelligence({ data: { projectId, ...(prompt.trim() ? { prompt: prompt.trim() } : {}) } }),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ["intelligence-runs", projectId] });
      qc.invalidateQueries({ queryKey: ["field-suggestions", projectId] });
      if (result.error) toast.error(result.error);
      else toast.success("Analisis AI selesai. Tinjau hasilnya sebelum dipakai.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal menjalankan AI"),
  });

  const latest = runs.data?.[0];
  const output = (latest?.output ?? {}) as Record<string, unknown>;
  const pending = (suggestions.data ?? []).filter((s) => s.status === "pending");

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold">
              <Brain className="size-5 text-primary" /> AI Client Intelligence
            </h2>
            <p className="text-sm text-muted-foreground">
              AI hanya menalar dari profil proyek dan evidence yang benar-benar ada. AI tidak
              menghasilkan metrik SEO dan tidak mengubah data proyek tanpa persetujuan Anda.
            </p>
          </div>
          <Button onClick={() => runMutation.mutate()} disabled={runMutation.isPending}>
            {runMutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Jalankan Analisis
          </Button>
        </header>

        <div className="space-y-1.5">
          <Label htmlFor="ai-prompt">Fokus analisis (opsional)</Label>
          <Textarea
            id="ai-prompt"
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Contoh: fokus pada kesiapan data dan pertanyaan untuk meeting berikutnya"
          />
        </div>

        {latest?.error && (
          <p className="rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {latest.error}
          </p>
        )}
      </section>

      {latest && !latest.error && (
        <section className="grid gap-4 lg:grid-cols-2">
          {SECTIONS.map((section) => (
            <div key={section.key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h3 className="mb-2 text-sm font-semibold">{section.title}</h3>
              {renderValue(output[section.key])}
            </div>
          ))}
        </section>
      )}

      <section className="space-y-3 rounded-2xl border border-border bg-card p-5 shadow-sm">
        <header>
          <h2 className="text-lg font-semibold">Usulan Isian Proyek</h2>
          <p className="text-sm text-muted-foreground">
            Usulan AI hanya diterapkan setelah Anda menyetujuinya. Anda dapat menyunting nilainya
            terlebih dahulu.
          </p>
        </header>

        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tidak ada usulan yang menunggu.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((s) => (
              <SuggestionItem key={s.id} projectId={projectId} suggestion={s} />
            ))}
          </ul>
        )}
      </section>

      {(runs.data ?? []).length > 0 && (
        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold">Riwayat Analisis</h2>
          <ul className="divide-y divide-border text-sm">
            {(runs.data ?? []).map((run) => (
              <li key={run.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-muted-foreground">
                  {new Date(run.created_at).toLocaleString("id-ID")} · {run.provider}
                  {run.model ? ` (${run.model})` : ""}
                </span>
                <Badge variant={run.status === "ok" ? "secondary" : "destructive"}>
                  {run.status === "ok" ? "Berhasil" : "Gagal"}
                </Badge>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SuggestionItem({
  projectId,
  suggestion,
}: {
  projectId: string;
  suggestion: FieldSuggestionRow;
}) {
  const qc = useQueryClient();
  const [value, setValue] = useState(suggestion.suggested_value);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["field-suggestions", projectId] });
    qc.invalidateQueries({ queryKey: ["project", projectId] });
  };

  const accept = useMutation({
    mutationFn: () => acceptSuggestion(projectId, suggestion, value),
    onSuccess: () => {
      invalidate();
      toast.success("Usulan diterapkan ke profil proyek");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal menerapkan"),
  });

  const ignore = useMutation({
    mutationFn: () => ignoreSuggestion(suggestion),
    onSuccess: () => {
      invalidate();
      toast.success("Usulan diabaikan");
    },
  });

  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{FIELD_LABEL[suggestion.field] ?? suggestion.field}</Badge>
        <span className="text-xs text-muted-foreground">usulan AI</span>
      </div>
      <Input className="mt-2" value={value} onChange={(e) => setValue(e.target.value)} />
      {suggestion.rationale && (
        <p className="mt-1.5 text-xs text-muted-foreground">{suggestion.rationale}</p>
      )}
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={() => accept.mutate()} disabled={accept.isPending}>
          <Check className="mr-1.5 size-3.5" /> Terima
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => ignore.mutate()}
          disabled={ignore.isPending}
        >
          <X className="mr-1.5 size-3.5" /> Abaikan
        </Button>
      </div>
    </li>
  );
}
