import { createFileRoute, useParams } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Loader2,
  ExternalLink,
  Globe,
  LayoutDashboard,
  Brain,
  HardDrive,
  Files,
  Edit2,
  Check,
  X,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/project/$projectId")({
  component: ProjectWorkspace,
});

function EditableField({
  label,
  value,
  fieldKey,
  projectId,
  isTextArea = false,
}: {
  label: string;
  value: string | null;
  fieldKey: string;
  projectId: string;
  isTextArea?: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (newValue: string) => {
      const { error } = await supabase
        .from("projects")
        .update({ [fieldKey]: newValue || null })
        .eq("id", projectId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", projectId] });
      setIsEditing(false);
      toast.success(`${label} diperbarui`);
    },
    onError: (e: Error) => toast.error(`Gagal update: ${e.message}`),
  });

  return (
    <div className="group rounded-md border border-transparent p-2 hover:border-border hover:bg-muted/30">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">{label}</label>
        {!isEditing && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={() => {
              setEditValue(value || "");
              setIsEditing(true);
            }}
          >
            <Edit2 className="h-3 w-3" />
          </Button>
        )}
      </div>
      {isEditing ? (
        <div className="mt-1 flex gap-2">
          {isTextArea ? (
            <Textarea
              className="min-h-[80px] text-sm"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            />
          ) : (
            <Input
              className="h-8 text-sm"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            />
          )}
          <div className="flex flex-col gap-1">
            <Button
              size="icon"
              className="h-6 w-6"
              onClick={() => mutation.mutate(editValue)}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-6 w-6"
              onClick={() => setIsEditing(false)}
              disabled={mutation.isPending}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-1 text-sm font-medium">
          {value ? value : <span className="text-muted-foreground italic">Belum diisi</span>}
        </div>
      )}
    </div>
  );
}

function ProjectWorkspace() {
  const { projectId } = useParams({ from: "/_authenticated/project/$projectId" });

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="mx-auto max-w-7xl p-8 text-center">
        <h2 className="text-xl font-bold">Project tidak ditemukan</h2>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      {/* Project Header / Hero */}
      <header className="relative overflow-hidden rounded-xl bg-teal-800 p-8 text-white shadow-md">
        {/* Subtle decorative background */}
        <div className="pointer-events-none absolute -right-20 -top-40 h-96 w-96 rounded-full bg-white opacity-5 mix-blend-overlay blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 right-20 h-80 w-80 rounded-full bg-teal-400 opacity-10 mix-blend-overlay blur-2xl" />

        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <Badge
                variant="secondary"
                className="bg-white/20 text-white hover:bg-white/30 capitalize"
              >
                {project.lifecycle_status || "prospect"}
              </Badge>
              <span className="text-sm text-teal-100">Project Workspace</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
            {project.client_domain && (
              <a
                href={
                  project.client_domain.startsWith("http")
                    ? project.client_domain
                    : `https://${project.client_domain}`
                }
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-teal-100 hover:text-white hover:underline"
              >
                <Globe className="h-4 w-4" />
                {project.client_domain}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" className="bg-white text-teal-900 hover:bg-teal-50">
              Run Audit
            </Button>
          </div>
        </div>
      </header>

      {/* Sub Navigation */}
      <Tabs defaultValue="overview" className="w-full">
        <div className="border-b">
          <TabsList className="h-12 w-full justify-start rounded-none bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="data-[state=active]:border-primary data-[state=active]:text-foreground relative h-12 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground"
            >
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="intelligence"
              className="data-[state=active]:border-primary data-[state=active]:text-foreground relative h-12 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground"
            >
              <Brain className="mr-2 h-4 w-4" />
              Intelligence
            </TabsTrigger>
            <TabsTrigger
              value="datasources"
              className="data-[state=active]:border-primary data-[state=active]:text-foreground relative h-12 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground"
            >
              <HardDrive className="mr-2 h-4 w-4" />
              Data Sources
            </TabsTrigger>
            <TabsTrigger
              value="evidence"
              className="data-[state=active]:border-primary data-[state=active]:text-foreground relative h-12 rounded-none border-b-2 border-transparent px-4 pb-3 pt-3 font-medium text-muted-foreground"
            >
              <Files className="mr-2 h-4 w-4" />
              Files & Evidence
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="mt-6 space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Business Context</CardTitle>
                <CardDescription>
                  Informasi fundamental klien untuk mendasari strategi SEO.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-2">
                <EditableField
                  label="Industry"
                  value={project.industry}
                  fieldKey="industry"
                  projectId={project.id}
                />
                <EditableField
                  label="Target Market"
                  value={project.target_market}
                  fieldKey="target_market"
                  projectId={project.id}
                />
                <EditableField
                  label="Current Problem"
                  value={project.current_problem}
                  fieldKey="current_problem"
                  projectId={project.id}
                  isTextArea
                />
                <EditableField
                  label="Budget Indication"
                  value={project.budget_indication}
                  fieldKey="budget_indication"
                  projectId={project.id}
                />
                <EditableField
                  label="Contact Person"
                  value={project.contact_person}
                  fieldKey="contact_person"
                  projectId={project.id}
                />
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Client Intelligence
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Belum ada analisa AI untuk project ini. Tambahkan file evidence atau jalankan
                    analisis untuk mendapatkan insight awal.
                  </p>
                  <Button variant="outline" className="w-full">
                    Jalankan Analisa
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Data & Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm font-medium">Google Search Console</span>
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Not Connected
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="text-sm font-medium">Google Analytics 4</span>
                      <Badge variant="outline" className="bg-muted text-muted-foreground">
                        Not Connected
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Client Intelligence</CardTitle>
              <CardDescription>
                Analisa konteks klien berdasarkan data dan dokumen yang tersedia.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed text-center">
                <Brain className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium mb-1">Fitur ini membutuhkan Evidence/Data</p>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  AI dapat otomatis menganalisa context klien (seperti Target Market & Competitor)
                  setelah Anda menambahkan dokumen pendukung.
                </p>
                <Button variant="outline" disabled>
                  <Brain className="mr-2 h-4 w-4" />
                  Jalankan Intelligence Run
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="datasources" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Sources</CardTitle>
              <CardDescription>
                Koneksikan sumber data pihak ketiga untuk memperkaya analisa SEO.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed text-center">
                <HardDrive className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium mb-1">Belum Ada Integrasi Aktif</p>
                <p className="text-sm text-muted-foreground">
                  Konektor GSC dan GA4 sedang dalam tahap pengembangan (Wave 2).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidence" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Files & Evidence</CardTitle>
              <CardDescription>
                Upload dokumen, brief PDF, screenshot, atau url referensi klien.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-md border border-dashed text-center">
                <Files className="mb-2 h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm font-medium mb-1">Kumpulkan Dokumen Project</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Tambahkan file untuk memperkaya konteks project dan dianalisa oleh AI.
                </p>
                <Button className="mt-2" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Tambah Evidence
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
