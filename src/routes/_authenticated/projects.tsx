import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderKanban, Loader2, Plus, BarChart2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createProject, fetchProjects } from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — SEO Operating System" },
      { name: "description", content: "Daftar project klien." },
    ],
  }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const projects = useQuery({ queryKey: ["projects-list"], queryFn: fetchProjects });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Workspace klien untuk Discovery, Audit, dan Planning.
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Project
        </Button>
      </header>

      {projects.isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : projects.data?.length === 0 ? (
        <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/20 text-center">
          <FolderKanban className="mb-4 h-10 w-10 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold">Belum ada project</h3>
          <p className="mb-4 text-sm text-muted-foreground">
            Mulai dengan membuat project baru untuk klien Anda.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>Create Project</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.data?.map((project) => (
            <Link
              key={project.id}
              to="/project/$projectId"
              params={{ projectId: project.id }}
              className="group flex flex-col rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/50"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{project.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {project.client_domain || "Belum ada domain"}
                  </p>
                </div>
                <Badge variant="secondary" className="bg-primary/10 text-primary capitalize">
                  {project.lifecycle_status || "prospect"}
                </Badge>
              </div>

              <div className="mt-auto pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BarChart2 className="h-3 w-3" />
                  SEO Workspace
                </span>
                <span>{new Date(project.created_at).toLocaleDateString("id-ID")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateProjectDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
}

function CreateProjectDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [clientDomain, setClientDomain] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () => createProject({ name, client_domain: clientDomain, description }),
    onSuccess: (newProject) => {
      qc.invalidateQueries({ queryKey: ["projects-list"] });
      toast.success("Project dibuat");
      onOpenChange(false);
      setName("");
      setClientDomain("");
      setDescription("");
      if (newProject?.id) {
        navigate({ to: "/project/$projectId", params: { projectId: newProject.id } });
      }
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal membuat project"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Project digunakan sebagai workspace untuk mengelola SEO klien.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="prj-name">Nama Project *</Label>
            <Input
              id="prj-name"
              placeholder="Contoh: Toko ABC"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prj-domain">Domain Klien</Label>
            <Input
              id="prj-domain"
              placeholder="contoh.com"
              value={clientDomain}
              onChange={(e) => setClientDomain(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="prj-desc">Deskripsi (Opsional)</Label>
            <Textarea
              id="prj-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button disabled={!name.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Buat Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
