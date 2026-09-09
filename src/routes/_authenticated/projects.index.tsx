import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ListChecks, Loader2, Plus, Search } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { joinDefaultWorkspace } from "@/lib/workspace.functions";
import {
  LIFECYCLE,
  LIFECYCLE_LABEL,
  LIFECYCLE_TONE,
  createProjectMinimal,
  fetchProjectList,
  type ProjectFull,
} from "@/lib/project-profile";

export const Route = createFileRoute("/_authenticated/projects/")({
  head: () => ({
    meta: [
      { title: "Proyek Klien — SEO Operating System" },
      {
        name: "description",
        content:
          "Daftar proyek klien internal: status lifecycle prospek hingga aktif, domain utama, objective, dan tindakan berikutnya.",
      },
      { property: "og:title", content: "Proyek Klien — SEO Operating System" },
      {
        property: "og:description",
        content: "Kelola proyek klien SEO dari tahap prospek hingga aktif dalam satu workspace.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProjectListPage,
});

function fmtDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function nextAction(p: ProjectFull) {
  if (!p.client_domain) return "Lengkapi domain utama klien";
  if (p.objectives.length === 0) return "Tentukan objective klien";
  if (!p.industry || !p.target_market) return "Lengkapi konteks bisnis";
  if (!p.current_problem) return "Catat masalah / pain point";
  return "Jalankan AI Client Intelligence";
}

function ProjectListPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");

  const projects = useQuery({ queryKey: ["projects-full"], queryFn: fetchProjectList });
  const list = projects.data ?? [];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return list.filter((p) => {
      if (filter !== "all" && p.lifecycle_status !== filter) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) || (p.client_domain ?? "").toLowerCase().includes(q)
      );
    });
  }, [list, search, filter]);

  const counts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of list) map.set(p.lifecycle_status, (map.get(p.lifecycle_status) ?? 0) + 1);
    return map;
  }, [list]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Workspace Internal
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Proyek Klien</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Satu Proyek = satu klien = satu website utama. Proyek dapat dibuat sejak tahap prospek.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link to="/projects/placements">
              <ListChecks className="mr-2 size-4" /> Placement Order
            </Link>
          </Button>
          <CreateProjectDialog />
        </div>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(["prospect", "assessment", "proposal", "active"] as const).map((key, i) => (
          <div
            key={key}
            className={cn(
              "rounded-2xl border border-border p-4",
              ["bg-kpi-peach", "bg-kpi-aqua", "bg-kpi-cream", "bg-kpi-lime"][i],
            )}
          >
            <p className="text-xs font-medium text-foreground/70">{LIFECYCLE_LABEL[key]}</p>
            <p className="mt-1 text-2xl font-bold tabular-nums">{counts.get(key) ?? 0}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama klien atau domain…"
            className="pl-9"
          />
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua status</SelectItem>
            {LIFECYCLE.map((s) => (
              <SelectItem key={s} value={s}>
                {LIFECYCLE_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {projects.isLoading ? (
        <p className="text-sm text-muted-foreground">Memuat proyek…</p>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <p className="font-medium">Belum ada proyek yang cocok</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Buat proyek baru cukup dengan nama klien. Detail lain bisa dilengkapi bertahap.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <Link
              key={p.id}
              to="/projects/$projectId"
              params={{ projectId: p.id }}
              className="group rounded-2xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.client_domain ?? "domain belum ditentukan"}
                  </p>
                </div>
                <Badge
                  variant="outline"
                  className={cn("shrink-0", LIFECYCLE_TONE[p.lifecycle_status])}
                >
                  {LIFECYCLE_LABEL[p.lifecycle_status] ?? p.lifecycle_status}
                </Badge>
              </div>

              {p.objectives.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {p.objectives.slice(0, 3).map((o) => (
                    <span
                      key={o}
                      className="rounded-full bg-secondary px-2.5 py-0.5 text-[11px] text-secondary-foreground"
                    >
                      {o}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-4 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                Langkah berikut: <span className="text-foreground">{nextAction(p)}</span>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                <span>Diperbarui {fmtDate(p.updated_at)}</span>
                <span className="inline-flex items-center gap-1 text-primary">
                  Buka <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateProjectDialog() {
  const qc = useQueryClient();
  const ensureWorkspace = useServerFn(joinDefaultWorkspace);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [domain, setDomain] = useState("");

  const mutation = useMutation({
    mutationFn: async () => {
      const membership = await ensureWorkspace();
      if (!membership) {
        throw new Error(
          "Akun ini belum diberi akses ke workspace internal. Minta admin tim menambahkan akun Anda.",
        );
      }
      return createProjectMinimal({ name, client_domain: domain });
    },
    onSuccess: () => {
      setName("");
      setDomain("");
      setOpen(false);
      qc.invalidateQueries({ queryKey: ["projects-full"] });
      qc.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Proyek dibuat. Lengkapi detailnya kapan saja.");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal membuat proyek"),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 size-4" /> Proyek Baru
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Proyek Baru</DialogTitle>
          <DialogDescription>
            Cukup isi nama klien. Domain dan detail lain bisa dilengkapi belakangan.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="np-name">Nama Proyek / Klien</Label>
            <Input
              id="np-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="PT Contoh Sejahtera"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="np-domain">Website Utama (opsional)</Label>
            <Input
              id="np-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="contoh.com"
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
          >
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Buat Proyek
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
