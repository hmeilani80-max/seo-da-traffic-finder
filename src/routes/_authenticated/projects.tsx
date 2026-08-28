import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FolderPlus, Loader2, Plus, Trash2 } from "lucide-react";
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
      { title: "Proyek & Placement Order — Manajemen Backlink" },
      {
        name: "description",
        content:
          "Kelola proyek klien, buat placement order backlink, dan atur penugasan order draft ke proyek yang sesuai.",
      },
      { property: "og:title", content: "Proyek & Placement Order — Manajemen Backlink" },
      {
        property: "og:description",
        content: "Dashboard proyek, draft placement order, dan penugasan proyek.",
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
    for (const o of orderList) {
      if (!o.project_id) continue;
      map.set(o.project_id, (map.get(o.project_id) ?? 0) + 1);
    }
    return map;
  }, [orderList]);

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Proyek &amp; Placement Order</h1>
        <p className="text-sm text-muted-foreground">
          Kelola proyek klien dan pesanan penempatan backlink. Order tanpa proyek otomatis
          masuk ke <strong>Draft / Belum Terkategori</strong>.
        </p>
      </header>

      <NewProjectForm onCreated={invalidate} />

      {recentProjects.length > 0 && (
        <section className="space-y-2">
          <Label>Proyek Terakhir (pilih cepat)</Label>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={activeProjectId === null ? "default" : "outline"}
              onClick={() => setActiveProjectId(null)}
            >
              Draft
            </Button>
            {recentProjects.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={activeProjectId === p.id ? "default" : "outline"}
                onClick={() => setActiveProjectId(p.id)}
              >
                {p.name}
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
        <h2 className="text-lg font-semibold">Dashboard Proyek</h2>
        {projects.isLoading ? (
          <p className="text-sm text-muted-foreground">Memuat proyek…</p>
        ) : projectList.length === 0 ? (
          <p className="text-sm text-muted-foreground">Belum ada proyek.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {projectList.map((p) => (
              <div key={p.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.client_domain || "tanpa domain klien"}
                    </p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label={`Hapus proyek ${p.name}`}
                    onClick={async () => {
                      if (!confirm(`Hapus proyek "${p.name}"? Order-nya akan menjadi Draft.`)) return;
                      try {
                        await deleteProject(p.id);
                        invalidate();
                        toast.success("Proyek dihapus");
                      } catch (e) {
                        toast.error(e instanceof Error ? e.message : "Gagal menghapus proyek");
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <Badge variant="secondary">{countByProject.get(p.id) ?? 0} order</Badge>
                  <span className="text-xs text-muted-foreground">
                    dibuat {fmtDate(p.created_at)}
                  </span>
                </div>
                {p.description && (
                  <p className="mt-2 text-xs text-muted-foreground">{p.description}</p>
                )}
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
    mutationFn: () =>
      createProject({ name, client_domain: clientDomain, description }),
    onSuccess: () => {
      setName("");
      setClientDomain("");
      setDescription("");
      onCreated();
      toast.success("Proyek dibuat");
    },
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Gagal membuat proyek"),
  });

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
        <FolderPlus className="h-4 w-4" /> Proyek Baru
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="project-name">Nama Proyek</Label>
          <Input
            id="project-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Kampanye Q3"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="project-domain">Domain Klien</Label>
          <Input
            id="project-domain"
            value={clientDomain}
            onChange={(e) => setClientDomain(e.target.value)}
            placeholder="arsjadrasjid.com"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="project-desc">Deskripsi</Label>
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
        {mutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
        Simpan Proyek
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
        project_id:
          effectiveProject === DRAFT_VALUE || !effectiveProject ? null : effectiveProject,
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
    onError: (e: unknown) =>
      toast.error(e instanceof Error ? e.message : "Gagal membuat order"),
  });

  return (
    <section className="rounded-lg border p-4">
      <h2 className="mb-3 text-lg font-semibold">Placement Order Baru</h2>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1">
          <Label htmlFor="po-domain">Domain Sumber *</Label>
          <Input
            id="po-domain"
            value={sourceDomain}
            onChange={(e) => setSourceDomain(e.target.value)}
            placeholder="contoh.com"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="po-target">URL Target</Label>
          <Input
            id="po-target"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="https://klien.com/halaman"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="po-keyword">Keyword</Label>
          <Input
            id="po-keyword"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="po-anchor">Anchor Text</Label>
          <Input
            id="po-anchor"
            value={anchorText}
            onChange={(e) => setAnchorText(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="po-price">Harga</Label>
          <Input
            id="po-price"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label>Status</Label>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PLACEMENT_STATUS.map((s) => (
                <SelectItem key={s} value={s}>
                  {PLACEMENT_STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Proyek</Label>
          <Select
            value={effectiveProject ?? DRAFT_VALUE}
            onValueChange={setProjectId}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DRAFT_VALUE}>Draft (tanpa proyek)</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="po-notes">Catatan</Label>
          <Textarea
            id="po-notes"
            rows={1}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>
      </div>
      <Button
        className="mt-3"
        disabled={!sourceDomain.trim() || mutation.isPending}
        onClick={() => mutation.mutate()}
      >
        {mutation.isPending ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Plus className="mr-2 h-4 w-4" />
        )}
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
                <th className="p-2">Proyek</th>
                <th className="p-2">Dibuat</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((o) => (
                <tr key={o.id} className="border-t align-middle">
                  <td className="p-2 font-medium">{o.source_domain}</td>
                  <td className="p-2">{o.keyword || "—"}</td>
                  <td className="max-w-[220px] truncate p-2">{o.target_url || "—"}</td>
                  <td className="p-2">
                    <Select
                      value={o.status}
                      onValueChange={async (v) => {
                        try {
                          await updatePlacementStatus(o.id, v);
                          onChanged();
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Gagal ubah status");
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLACEMENT_STATUS.map((s) => (
                          <SelectItem key={s} value={s}>
                            {PLACEMENT_STATUS_LABEL[s]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Select
                      value={o.project_id ?? DRAFT_VALUE}
                      onValueChange={async (v) => {
                        try {
                          await assignPlacementProject(o.id, v === DRAFT_VALUE ? null : v);
                          onChanged();
                          toast.success("Proyek diperbarui");
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Gagal assign proyek");
                        }
                      }}
                    >
                      <SelectTrigger className="h-8 w-[170px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={DRAFT_VALUE}>Draft</SelectItem>
                        {projects.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2 text-muted-foreground">{fmtDate(o.created_at)}</td>
                  <td className="p-2 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={`Hapus order ${o.source_domain}`}
                      onClick={async () => {
                        if (!confirm(`Hapus order ${o.source_domain}?`)) return;
                        try {
                          await deletePlacementOrder(o.id);
                          onChanged();
                          toast.success("Order dihapus");
                        } catch (e) {
                          toast.error(e instanceof Error ? e.message : "Gagal menghapus");
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
