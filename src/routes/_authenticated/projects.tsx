import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, FolderPlus, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  PLACEMENT_STATUS,
  PLACEMENT_STATUS_LABEL,
  PROJECT_LIFECYCLE_LABEL,
  assignPlacementProject,
  createPlacementOrder,
  createProject,
  deletePlacementOrder,
  deleteProject,
  fetchPlacementOrders,
  fetchProjects,
  updatePlacementStatus,
  type PlacementOrderRow,
  type ProjectRow,
} from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/projects")({
  head: () => ({
    meta: [
      { title: "Projects — SEO Operating System" },
      {
        name: "description",
        content:
          "Kelola Project client, buka Project Workspace, dan pertahankan placement order workflow yang sudah berjalan.",
      },
      { property: "og:title", content: "Projects — SEO Operating System" },
      {
        property: "og:description",
        content: "Project workspace dan placement order dalam satu alur kerja.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectsPage,
});

const DRAFT_VALUE = "__draft__";

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("id-ID");
}

function ProjectsPage() {
  const qc = useQueryClient();
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });
  const orders = useQuery({ queryKey: ["placement_orders"], queryFn: fetchPlacementOrders });
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["projects"] });
    qc.invalidateQueries({ queryKey: ["placement_orders"] });
  };

  const projectList = projects.data ?? [];
  const orderList = orders.data ?? [];
  const recentProjects = useMemo(() => projectList.slice(0, 5), [projectList]);
  const draftOrders = orderList.filter((o) => o.project_id === null);

  const countByProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const order of orderList) {
      if (!order.project_id) continue;
      map.set(order.project_id, (map.get(order.project_id) ?? 0) + 1);
    }
    return map;
  }, [orderList]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
        <p className="text-sm text-muted-foreground">
          Project menjadi workspace utama client. Placement Order lama tetap tersedia dan tidak diubah.
        </p>
      </header>

      <NewProjectForm onCreated={invalidate} />

      {recentProjects.length > 0 && (
        <section className="space-y-2">
          <Label>Project Terakhir (pilih untuk Placement Order)</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={activeProjectId === null ? "default" : "outline"}
              onClick={() => setActiveProjectId(null)}
            >
              Draft
            </Button>
            {recentProjects.map((project) => (
              <Button
                key={project.id}
                size="sm"
                variant={activeProjectId === project.id ? "default" : "outline"}
                onClick={() => setActiveProjectId(project.id)}
              >
                {project.name}
              </Button>
            ))}
          </div>
        </section>
      )}

      <PlacementOrderForm
        projects={projectList}
        activeProjectId={activeProjectId}
        onCreated={invalidate}
      />

      <section className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Project Workspace</h2>
          <p className="text-sm text-muted-foreground">
            Buka workspace untuk melengkapi business context, data source, dan evidence.
          </p>
        </div>
        {projects.isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat project…</p>
        ) : projectList.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada project.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projectList.map((project) => (
              <div key={project.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-medium">{project.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {project.client_domain || "website belum diisi"}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Hapus project ${project.name}`}
                    onClick={async () => {
                      if (!confirm(`Hapus project "${project.name}"? Order-nya akan menjadi Draft.`)) return;
                      try {
                        await deleteProject(project.id);
                        invalidate();
                        toast.success("Project dihapus");
                      } catch (error) {
                        toast.error(error instanceof Error ? error.message : "Gagal menghapus project");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{countByProject.get(project.id) ?? 0} order</Badge>
                  <Badge variant="outline">
                    {PROJECT_LIFECYCLE_LABEL[project.lifecycle_status] ?? project.lifecycle_status ?? "Prospect"}
                  </Badge>
                  <span className="text-xs text-muted-foreground">dibuat {fmtDate(project.created_at)}</span>
                </div>

                {project.description && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">{project.description}</p>
                )}

                <Button asChild size="sm" variant="outline" className="mt-4 w-full">
                  <Link to="/projects/$projectId" params={{ projectId: project.id }}>
                    Buka Workspace
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            ))}
          </div>
        )}
      </section>

      <OrderTable
        title={`Draft / Belum Terkategori (${draftOrders.length})`}
        rows={draftOrders}
        projects={projectList}
        onChanged={invalidate}
      />

      <OrderTable
        title={`Semua Placement Order (${orderList.length})`}
        rows={orderList}
        projects={projectList}
        onChanged={invalidate}
      />
    </div>
  );
}

function NewProjectForm({ onCreated }: { onCreated: () => void }) {
  const [name, setName] = useState("");
  const [clientDomain, setClientDomain] = useState("");
  const [description, setDescription] = useState("");

  const mutation = useMutation({
    mutationFn: () => createProject({ name, client_domain: clientDomain, description }),
    onSuccess: () => {
      setName("");
      setClientDomain("");
      setDescription("");
      onCreated();
      toast.success("Project dibuat");
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Gagal membuat project"),
  });

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <FolderPlus className="h-4 w-4" /> Project Baru
      </h2>
      <p className="mb-4 text-sm text-muted-foreground">
        Cukup nama client/project dan website bila sudah diketahui. Context lain dapat dilengkapi di workspace.
      </p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="project-name">Nama Project / Client</Label>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama client"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="project-domain">Website</Label>
          <Input
            id="project-domain"
            value={clientDomain}
            onChange={(e) => setClientDomain(e.target.value)}
            placeholder="client.com"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="project-desc">Deskripsi Singkat</Label>
          <Textarea
            id="project-desc"
            rows={1}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opsional"
          />
        </div>
      </div>
      <Button
        className="mt-3"
        disabled={!name.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Simpan Project
      </Button>
    </section>
  );
}

function PlacementOrderForm({
  projects,
  activeProjectId,
  onCreated,
}: {
  projects: ProjectRow[];
  activeProjectId: string | null;
  onCreated: () => void;
}) {
  const [sourceDomain, setSourceDomain] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [keyword, setKeyword] = useState("");
  const [anchorText, setAnchorText] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<string>("draft");
  const [projectId, setProjectId] = useState<string>(activeProjectId ?? DRAFT_VALUE);
  const [notes, setNotes] = useState("");
  const effectiveProject = activeProjectId ?? projectId;

  const mutation = useMutation({
    mutationFn: () =>
      createPlacementOrder({
        project_id: effectiveProject === DRAFT_VALUE || !effectiveProject ? null : effectiveProject,
        source_domain: sourceDomain,
        target_url: targetUrl,
        keyword,
        anchor_text: anchorText,
        status,
        price: price.trim() ? Number(price) : null,
        notes,
      }),
    onSuccess: () => {
      setSourceDomain("");
      setTargetUrl("");
      setKeyword("");
      setAnchorText("");
      setPrice("");
      setNotes("");
      onCreated();
      toast.success("Placement order dibuat");
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Gagal membuat order"),
  });

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-lg font-semibold">Placement Order Baru</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="po-domain">Domain Sumber *</Label>
          <Input id="po-domain" value={sourceDomain} onChange={(e) => setSourceDomain(e.target.value)} placeholder="contoh.com" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="po-target">URL Target</Label>
          <Input id="po-target" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} placeholder="https://client.com/halaman" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="po-keyword">Keyword</Label>
          <Input id="po-keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="po-anchor">Anchor Text</Label>
          <Input id="po-anchor" value={anchorText} onChange={(e) => setAnchorText(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="po-price">Harga</Label>
          <Input id="po-price" type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {PLACEMENT_STATUS.map((value) => (
                <SelectItem key={value} value={value}>{PLACEMENT_STATUS_LABEL[value]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Project</Label>
          <Select value={effectiveProject ?? DRAFT_VALUE} onValueChange={setProjectId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={DRAFT_VALUE}>Draft (tanpa project)</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="po-notes">Catatan</Label>
          <Textarea id="po-notes" rows={1} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </div>
      </div>
      <Button className="mt-3" disabled={!sourceDomain.trim() || mutation.isPending} onClick={() => mutation.mutate()}>
        {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
        Simpan Order
      </Button>
    </section>
  );
}

function OrderTable({
  title,
  rows,
  projects,
  onChanged,
}: {
  title: string;
  rows: PlacementOrderRow[];
  projects: ProjectRow[];
  onChanged: () => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Belum ada order.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="p-2">Domain Sumber</th>
                <th className="p-2">Keyword</th>
                <th className="p-2">URL Target</th>
                <th className="p-2">Status</th>
                <th className="p-2">Project</th>
                <th className="p-2">Dibuat</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr key={order.id} className="border-t align-middle">
                  <td className="p-2 font-medium">{order.source_domain}</td>
                  <td className="p-2">{order.keyword || "—"}</td>
                  <td className="max-w-[220px] truncate p-2">{order.target_url || "—"}</td>
                  <td className="p-2">
                    <Select
                      value={order.status}
                      onValueChange={async (value) => {
                        try {
                          await updatePlacementStatus(order.id, value);
                          onChanged();
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Gagal ubah status");
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[130px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {PLACEMENT_STATUS.map((value) => (
                          <SelectItem key={value} value={value}>{PLACEMENT_STATUS_LABEL[value]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Select
                      value={order.project_id ?? DRAFT_VALUE}
                      onValueChange={async (value) => {
                        try {
                          await assignPlacementProject(order.id, value === DRAFT_VALUE ? null : value);
                          onChanged();
                          toast.success("Project diperbarui");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Gagal assign project");
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[170px]"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DRAFT_VALUE}>Draft</SelectItem>
                        {projects.map((project) => (
                          <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2 text-muted-foreground">{fmtDate(order.created_at)}</td>
                  <td className="p-2 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Hapus order ${order.source_domain}`}
                      onClick={async () => {
                        if (!confirm(`Hapus order ${order.source_domain}?`)) return;
                        try {
                          await deletePlacementOrder(order.id);
                          onChanged();
                          toast.success("Order dihapus");
                        } catch (error) {
                          toast.error(error instanceof Error ? error.message : "Gagal menghapus order");
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
