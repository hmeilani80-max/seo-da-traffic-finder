import { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PROJECT_LIFECYCLES,
  PROJECT_LIFECYCLE_LABEL,
  updateProjectProfile,
  type ProjectProfileInput,
  type ProjectRow,
} from "@/lib/projects";
import type { ProjectWorkspaceSummary } from "@/lib/project-workspace";

export function ProjectOverviewPanel({
  project,
  summary,
  onSaved,
}: {
  project: ProjectRow;
  summary?: ProjectWorkspaceSummary;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ProjectProfileInput>(() => toProfileForm(project));

  useEffect(() => setForm(toProfileForm(project)), [project]);

  const save = useMutation({
    mutationFn: () => updateProjectProfile(project.id, form),
    onSuccess: () => {
      toast.success("Project profile disimpan");
      onSaved();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan Project"),
  });

  const nextActions = useMemo(() => {
    const actions: string[] = [];
    if (!project.industry || !project.target_market || !project.current_problem) {
      actions.push("Lengkapi business context agar research berikutnya punya konteks client yang cukup.");
    }
    if ((summary?.evidenceCount ?? 0) === 0) {
      actions.push("Tambahkan brief, dokumen, link, atau evidence yang tersedia dari client.");
    }
    if ((summary?.sourceCount ?? 0) === 0) {
      actions.push("Catat data source dan akses yang tersedia untuk Project ini.");
    }
    if ((summary?.intelligenceRunCount ?? 0) === 0) {
      actions.push("Jalankan AI Client Intelligence setelah context/evidence cukup.");
    }
    return actions.length ? actions : ["Project context sudah cukup untuk melanjutkan ke assessment berikutnya."];
  }, [project, summary]);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Client & Project Context</CardTitle>
          <CardDescription>Minimum create tetap sederhana; detail dapat dilengkapi bertahap.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project / Client Name">
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Website">
              <Input value={form.client_domain ?? ""} onChange={(e) => setForm({ ...form, client_domain: e.target.value })} placeholder="client.com" />
            </Field>
            <Field label="Lifecycle">
              <Select value={form.lifecycle_status} onValueChange={(value) => setForm({ ...form, lifecycle_status: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROJECT_LIFECYCLES.map((status) => (
                    <SelectItem key={status} value={status}>{PROJECT_LIFECYCLE_LABEL[status]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Industry">
              <Input value={form.industry ?? ""} onChange={(e) => setForm({ ...form, industry: e.target.value })} />
            </Field>
            <Field label="Contact Person">
              <Input value={form.contact_person ?? ""} onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
            </Field>
            <Field label="Budget Indication">
              <Input value={form.budget_indication ?? ""} onChange={(e) => setForm({ ...form, budget_indication: e.target.value })} />
            </Field>
          </div>

          <Field label="Target Market">
            <Input value={form.target_market ?? ""} onChange={(e) => setForm({ ...form, target_market: e.target.value })} />
          </Field>
          <Field label="Current Problem">
            <Textarea value={form.current_problem ?? ""} onChange={(e) => setForm({ ...form, current_problem: e.target.value })} rows={3} />
          </Field>
          <Field label="Objectives" hint="Pisahkan dengan koma atau baris baru.">
            <Textarea value={form.objectives.join("\n")} onChange={(e) => setForm({ ...form, objectives: splitList(e.target.value) })} rows={3} />
          </Field>
          <Field label="Known Competitors" hint="Pisahkan dengan koma atau baris baru.">
            <Textarea value={form.competitors.join("\n")} onChange={(e) => setForm({ ...form, competitors: splitList(e.target.value) })} rows={3} />
          </Field>
          <Field label="Project Description">
            <Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
          </Field>
          <Field label="Discovery Notes">
            <Textarea value={form.discovery_notes ?? ""} onChange={(e) => setForm({ ...form, discovery_notes: e.target.value })} rows={5} />
          </Field>

          <Button onClick={() => save.mutate()} disabled={!form.name.trim() || save.isPending}>
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Simpan Project Context
          </Button>
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Recommended Next Actions</CardTitle>
          <CardDescription>Deterministik dari data yang benar-benar tersedia.</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-3 text-sm">
            {nextActions.map((action, index) => (
              <li key={action} className="flex gap-3">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">{index + 1}</span>
                <span>{action}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>
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
  return value.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean);
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
