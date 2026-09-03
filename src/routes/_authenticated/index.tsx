import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  Database,
  FolderKanban,
  Globe,
  KeyRound,
  Sparkles,
} from "lucide-react";

import { useRealtimeDomains } from "@/hooks/useRealtimeDomains";
import { fetchTable } from "@/lib/domains";
import {
  fetchPlacementOrders,
  fetchProjects,
  PLACEMENT_STATUS_LABEL,
} from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Backlink Manager" },
      {
        name: "description",
        content:
          "Ringkasan manajemen backlink: domain, proyek, placement order, dan riset SEO.",
      },
      { property: "og:title", content: "Dashboard — Backlink Manager" },
      {
        property: "og:description",
        content:
          "Ringkasan manajemen backlink: domain, proyek, placement order, dan riset SEO.",
      },
    ],
  }),
  component: DashboardHome,
});

const FEATURES = [
  {
    to: "/domains",
    icon: Database,
    title: "Domain Saya",
    description:
      "Cek domain massal, riset DR & traffic otomatis via Apify, dan kelola tabel sudah dibeli / sudah pernah / traffic 0.",
  },
  {
    to: "/projects",
    icon: FolderKanban,
    title: "Proyek & Placement",
    description:
      "Kelola proyek client, buat placement order, dan pantau status draft, dipesan, tayang, atau batal.",
  },
  {
    to: "/backlink-recommendation",
    icon: Sparkles,
    title: "Rekomendasi Backlink",
    description:
      "Pipeline AI: profil domain → kandidat keyword → metrik & rank Ahrefs → Top 5 rekomendasi placement.",
  },
  {
    to: "/domain-research",
    icon: Globe,
    title: "Riset Domain",
    description:
      "Riset satu atau banyak domain: DR, organic traffic, backlink, dan referring domains dengan cache 30 hari.",
  },
  {
    to: "/keyword-research",
    icon: KeyRound,
    title: "Riset Keyword",
    description:
      "Generate ide keyword dari seed, lalu ambil search volume, KD, traffic potential, dan CPC untuk shortlist.",
  },
] as const;

function StatCard({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading: boolean;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">
        {loading ? "…" : value.toLocaleString("id-ID")}
      </p>
    </div>
  );
}

function DashboardHome() {
  useRealtimeDomains();

  const stats = useQuery({
    queryKey: ["dashboard-home"],
    queryFn: async () => {
      const [dibeli, pernah, nol, projects, orders] = await Promise.all([
        fetchTable("sudah_dibeli"),
        fetchTable("domain_sudah_pernah"),
        fetchTable("traffic_nol"),
        fetchProjects(),
        fetchPlacementOrders(),
      ]);
      return {
        dibeli: dibeli.length,
        pernah: pernah.length,
        nol: nol.length,
        projects: projects.length,
        orders: orders.length,
        recentOrders: orders.slice(0, 5),
      };
    },
  });

  const s = stats.data;
  const loading = stats.isLoading;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Ringkasan seluruh aktivitas riset dan pembelian backlink kamu.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="Domain Dibeli" value={s?.dibeli ?? 0} loading={loading} />
        <StatCard label="Domain Sudah Pernah" value={s?.pernah ?? 0} loading={loading} />
        <StatCard label="Traffic 0" value={s?.nol ?? 0} loading={loading} />
        <StatCard label="Proyek" value={s?.projects ?? 0} loading={loading} />
        <StatCard label="Placement Order" value={s?.orders ?? 0} loading={loading} />
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold">Menu Utama</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <Link
                key={f.to}
                to={f.to}
                className="group rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] transition-colors hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <span className="grid size-10 place-items-center rounded-md bg-primary/10 text-primary">
                    <Icon className="size-5" />
                  </span>
                  <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </div>
                <h3 className="mt-3 font-semibold">{f.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {f.description}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold">Placement Order Terbaru</h2>
          <Link
            to="/projects"
            className="text-sm font-medium text-primary hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Domain</th>
                <th className="px-4 py-3 text-left font-medium">Keyword</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {!s || s.recentOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {loading ? "Memuat…" : "Belum ada placement order."}
                  </td>
                </tr>
              ) : (
                s.recentOrders.map((o) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{o.source_domain}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {o.keyword ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                        {PLACEMENT_STATUS_LABEL[o.status] ?? o.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(o.created_at).toLocaleDateString("id-ID")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
