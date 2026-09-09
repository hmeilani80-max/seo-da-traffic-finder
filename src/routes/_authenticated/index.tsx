import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Database,
  FolderKanban,
  Globe,
  KeyRound,
  Link2,
  ListChecks,
  Plus,
  Sparkles,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRealtimeDomains } from "@/hooks/useRealtimeDomains";
import { fetchBacklinks, fetchPlacementOrders, PLACEMENT_STATUS_LABEL } from "@/lib/projects";
import {
  fetchProjectList,
  LIFECYCLE_LABEL,
  LIFECYCLE_TONE,
} from "@/lib/project-profile";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — SEO Operating System" },
      {
        name: "description",
        content: "Dashboard internal SEO Operating System untuk proyek, riset, backlink, dan delivery SEO.",
      },
      { property: "og:title", content: "Dashboard — SEO Operating System" },
      {
        property: "og:description",
        content: "Satu workspace internal untuk menjalankan lifecycle pekerjaan SEO.",
      },
    ],
  }),
  component: DashboardHome,
});

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 19) return "Selamat sore";
  return "Selamat malam";
}

function DashboardHome() {
  useRealtimeDomains();

  const overview = useQuery({
    queryKey: ["seo-os-dashboard"],
    queryFn: async () => {
      const [projects, orders, backlinks] = await Promise.all([
        fetchProjectList(),
        fetchPlacementOrders(),
        fetchBacklinks(),
      ]);
      return { projects, orders, backlinks };
    },
  });

  const projects = overview.data?.projects ?? [];
  const orders = overview.data?.orders ?? [];
  const backlinks = overview.data?.backlinks ?? [];
  const activeProjects = projects.filter((p) => p.lifecycle_status === "active").length;
  const prospects = projects.filter((p) => p.lifecycle_status === "prospect").length;
  const openOrders = orders.filter((o) => !["tayang", "batal"].includes(o.status)).length;
  const recentProjects = projects.slice(0, 5);
  const recentOrders = orders.slice(0, 5);

  return (
    <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl bg-brand-teal px-6 py-8 text-brand-teal-foreground sm:px-8 lg:min-h-64">
        <div className="relative z-10 max-w-2xl">
          <p className="text-sm font-medium text-brand-teal-foreground/75">{greeting()}, SEO Team</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            SEO System
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-brand-teal-foreground/80 sm:text-base">
            Kelola calon client, project context, evidence, research, backlink, dan pekerjaan SEO
            dalam satu workspace internal.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button asChild>
              <Link to="/projects">
                <Plus className="mr-2 size-4" /> Buat / Buka Proyek
              </Link>
            </Button>
            <a
              href="#seo-tools"
              className="inline-flex h-9 items-center justify-center rounded-md border border-white/25 bg-white/10 px-4 text-sm font-medium text-white transition-colors hover:bg-white/20"
            >
              Buka SEO Tools
            </a>
          </div>
        </div>

        <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] lg:block">
          <div className="absolute right-10 top-8 h-40 w-60 rounded-3xl border border-white/15 bg-white/10 p-5 shadow-2xl">
            <div className="flex items-center justify-between text-xs text-white/75">
              <span>SEO Project Health</span>
              <Sparkles className="size-4" />
            </div>
            <div className="mt-6 flex h-20 items-end gap-3">
              {[40, 64, 48, 82, 70, 92].map((height, index) => (
                <span
                  key={index}
                  className="flex-1 rounded-t-lg bg-white/70"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
          </div>
          <div className="absolute bottom-7 right-56 rounded-2xl bg-white px-4 py-3 text-foreground shadow-xl">
            <p className="text-[11px] text-muted-foreground">Project Context</p>
            <p className="mt-1 text-sm font-semibold">Data → Insight → Action</p>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Total Proyek"
          value={String(projects.length)}
          detail={`${activeProjects} aktif`}
          icon={FolderKanban}
          className="bg-kpi-peach"
        />
        <KpiCard
          label="Prospek"
          value={String(prospects)}
          detail="Project tahap awal"
          icon={Sparkles}
          className="bg-kpi-aqua"
        />
        <KpiCard
          label="Placement Berjalan"
          value={String(openOrders)}
          detail={`${orders.length} total order`}
          icon={ListChecks}
          className="bg-kpi-lime"
        />
        <KpiCard
          label="Backlink Tercatat"
          value={String(backlinks.length)}
          detail="Data aktual tersimpan"
          icon={Link2}
          className="bg-kpi-cream"
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold">Proyek Terbaru</h2>
              <p className="text-xs text-muted-foreground">Project context yang terakhir diperbarui.</p>
            </div>
            <Link to="/projects" className="text-sm font-medium text-primary hover:underline">
              Lihat semua
            </Link>
          </div>
          {recentProjects.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-sm font-medium">Belum ada Project</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Buat calon client/project pertama untuk memulai workflow.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentProjects.map((project) => (
                <Link
                  key={project.id}
                  to="/projects/$projectId"
                  params={{ projectId: project.id }}
                  className="group flex items-center justify-between gap-4 px-5 py-3.5 transition-colors hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{project.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {project.client_domain ?? "Domain belum ditentukan"}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge
                      variant="outline"
                      className={cn("hidden sm:inline-flex", LIFECYCLE_TONE[project.lifecycle_status])}
                    >
                      {LIFECYCLE_LABEL[project.lifecycle_status] ?? project.lifecycle_status}
                    </Badge>
                    <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div>
              <h2 className="font-semibold">Placement Order Terbaru</h2>
              <p className="text-xs text-muted-foreground">Aktivitas off-page/backlink yang tersimpan.</p>
            </div>
            <Link to="/projects/placements" className="text-sm font-medium text-primary hover:underline">
              Kelola
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/30 text-xs text-muted-foreground">
                <tr>
                  <th className="px-5 py-3 text-left font-medium">Source Domain</th>
                  <th className="px-4 py-3 text-left font-medium">Keyword</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-8 text-center text-muted-foreground">
                      {overview.isLoading ? "Memuat…" : "Belum ada placement order."}
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((order) => (
                    <tr key={order.id} className="border-b border-border last:border-0">
                      <td className="max-w-48 truncate px-5 py-3 font-medium">{order.source_domain}</td>
                      <td className="max-w-40 truncate px-4 py-3 text-muted-foreground">
                        {order.keyword ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {PLACEMENT_STATUS_LABEL[order.status] ?? order.status}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section id="seo-tools" className="space-y-3">
        <div>
          <h2 className="font-semibold">SEO Tools</h2>
          <p className="text-xs text-muted-foreground">
            Existing tools tetap tersedia dan tidak diubah oleh Project Workspace.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <ToolCard
            to="/domain-research"
            title="Riset Domain"
            description="DR, traffic, backlink & referring domain."
            icon={Globe}
          />
          <ToolCard
            to="/keyword-research"
            title="Riset Keyword"
            description="Keyword ideas, volume, KD, CPC & opportunity."
            icon={KeyRound}
          />
          <ToolCard
            to="/backlink-recommendation"
            title="Rekomendasi Backlink"
            description="Keyword, target page & placement reasoning."
            icon={Sparkles}
          />
          <ToolCard
            to="/domains"
            title="Domain Saya"
            description="Historical domain & backlink operational data."
            icon={Database}
          />
        </div>
      </section>
    </div>
  );
}

function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  className,
}: {
  label: string;
  value: string;
  detail: string;
  icon: typeof FolderKanban;
  className: string;
}) {
  return (
    <div className={cn("rounded-2xl border border-border p-4", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-medium text-foreground/70">{label}</p>
        <span className="grid size-9 place-items-center rounded-xl bg-white/55">
          <Icon className="size-4 text-foreground/65" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums">{value}</p>
      <p className="mt-1 text-xs text-foreground/60">{detail}</p>
    </div>
  );
}

function ToolCard({
  to,
  title,
  description,
  icon: Icon,
}: {
  to: "/domain-research" | "/keyword-research" | "/backlink-recommendation" | "/domains";
  title: string;
  description: string;
  icon: typeof Globe;
}) {
  return (
    <Link
      to={to}
      className="group rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-muted text-primary">
          <Icon className="size-5" />
        </span>
        <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <h3 className="mt-3 text-sm font-semibold">{title}</h3>
      <p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p>
    </Link>
  );
}
