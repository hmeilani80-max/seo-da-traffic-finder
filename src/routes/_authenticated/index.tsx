import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Database, FolderKanban, Globe, KeyRound, Sparkles } from "lucide-react";

import { useRealtimeDomains } from "@/hooks/useRealtimeDomains";
import {
  fetchPlacementOrders,
  PLACEMENT_STATUS_LABEL,
  type PlacementOrderRow,
} from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Backlink Manager" },
      {
        name: "description",
        content: "Ringkasan manajemen backlink: domain, proyek, placement order, dan riset SEO.",
      },
      { property: "og:title", content: "Dashboard — Backlink Manager" },
      {
        property: "og:description",
        content: "Ringkasan manajemen backlink: domain, proyek, placement order, dan riset SEO.",
      },
    ],
  }),
  component: DashboardHome,
});

const FEATURES = [
  {
    to: "/projects",
    icon: FolderKanban,
    title: "Projects",
    description:
      "Kelola proyek, tambahkan context klien, kumpulkan evidence, dan gunakan AI Client Intelligence.",
  },
  {
    to: "/domains",
    icon: Database,
    title: "Domain Saya (Legacy)",
    description:
      "Cek domain massal, riset DR & traffic otomatis via Apify, dan kelola tabel sudah dibeli / sudah pernah.",
  },
] as const;

function DashboardHome() {
  useRealtimeDomains();

  const ordersQuery = useQuery({
    queryKey: ["dashboard-recent-orders"],
    queryFn: async () => {
      const orders = await fetchPlacementOrders();
      return orders.slice(0, 5);
    },
  });

  const recentOrders = ordersQuery.data ?? [];
  const loading = ordersQuery.isLoading;

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          seluruh aktivitas riset dan pembelian backlink kamu.
        </p>
      </header>

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
                <p className="mt-1 text-sm text-muted-foreground">{f.description}</p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-base font-semibold">Placement Order Terbaru</h2>
          <Link to="/projects" className="text-sm font-medium text-primary hover:underline">
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
              {recentOrders.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    {loading ? "Memuat…" : "Belum ada placement order."}
                  </td>
                </tr>
              ) : (
                recentOrders.map((o: PlacementOrderRow) => (
                  <tr key={o.id} className="border-b last:border-0">
                    <td className="px-4 py-3 font-medium">{o.source_domain}</td>
                    <td className="px-4 py-3 text-muted-foreground">{o.keyword ?? "—"}</td>
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
