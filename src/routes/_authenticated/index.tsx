import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainTable } from "@/components/DomainTable";
import { TambahDomainDibeli } from "@/components/TambahDomainDibeli";
import { useRealtimeDomains } from "@/hooks/useRealtimeDomains";
import {
  fetchSearchHistory,
  fetchTable,
  normalizeSearchQuery,
  saveSearchQuery,
} from "@/lib/domains";

export const Route = createFileRoute("/_authenticated/")({
  head: () => ({
    meta: [
      { title: "Dashboard Riset Backlink — Manajemen Domain" },
      {
        name: "description",
        content:
          "Tool internal untuk cek, riset, dan mengelola pembelian backlink domain dengan data DR dan traffic dari Ahrefs.",
      },
      { property: "og:title", content: "Dashboard Riset Backlink — Manajemen Domain" },
      {
        property: "og:description",
        content:
          "Cek domain massal, riset DR & traffic otomatis, dan kelola riwayat pembelian backlink.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  useRealtimeDomains();
  const [searchQuery, setSearchQuery] = useState("");

  const counts = useQuery({
    queryKey: ["ringkasan"],
    queryFn: async () => {
      const [a, b, c] = await Promise.all([
        fetchTable("domain_sudah_pernah"),
        fetchTable("traffic_nol"),
        fetchTable("sudah_dibeli"),
      ]);
      return {
        domain_sudah_pernah: a.length,
        traffic_nol: b.length,
        sudah_dibeli: c.length,
      };
    },
  });

  const searchHistory = useQuery({
    queryKey: ["search-history"],
    queryFn: fetchSearchHistory,
  });

  useEffect(() => {
    const normalized = normalizeSearchQuery(searchQuery);
    if (normalized.length < 2) return;

    const timer = window.setTimeout(async () => {
      try {
        await saveSearchQuery(searchQuery);
        await searchHistory.refetch();
      } catch {
        // Pencarian tetap berjalan walaupun pencatatan riwayat gagal.
      }
    }, 600);

    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const c = counts.data ?? { domain_sudah_pernah: 0, traffic_nol: 0, sudah_dibeli: 0 };
  const normalizedCurrent = normalizeSearchQuery(searchQuery);
  const history = searchHistory.data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Riset Backlink</h1>
        <p className="text-sm text-muted-foreground">
          Cek domain rajabacklink.com untuk client arsjadrasjid.com — otomatis riset DR &amp;
          traffic lalu dirutekan ke tabel yang sesuai.
        </p>
      </header>

      <TambahDomainDibeli />

      <section>
        <div className="mb-4 rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Pencarian Domain</h2>
              <p className="text-sm text-muted-foreground">
                Search berlaku untuk semua tabel dan setiap query disimpan ke database.
              </p>
            </div>
            <div className="relative w-full max-w-sm">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari di semua tabel..."
                className="pl-8"
                aria-label="Cari di semua tabel"
              />
            </div>
          </div>

          {normalizedCurrent && (
            <div className="mt-3 rounded-md bg-muted/50 px-3 py-2 text-sm">
              <span className="font-medium">Query aktif:</span> {searchQuery}
              {history.some(
                (item) =>
                  item.normalized_query === normalizedCurrent ||
                  item.normalized_query.includes(normalizedCurrent) ||
                  normalizedCurrent.includes(item.normalized_query),
              ) && (
                <span className="ml-2 font-medium text-primary">• Pernah dicari / query terkait ditemukan</span>
              )}
            </div>
          )}
        </div>

        <Tabs defaultValue="sudah_dibeli">
          <TabsList>
            <TabsTrigger value="sudah_dibeli">Sudah Dibeli ({c.sudah_dibeli})</TabsTrigger>
            <TabsTrigger value="domain_sudah_pernah">
              Domain Sudah Pernah ({c.domain_sudah_pernah})
            </TabsTrigger>
            <TabsTrigger value="traffic_nol">Traffic 0 ({c.traffic_nol})</TabsTrigger>
          </TabsList>
          <TabsContent value="sudah_dibeli" className="mt-4">
            <DomainTable table="sudah_dibeli" searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="domain_sudah_pernah" className="mt-4">
            <DomainTable table="domain_sudah_pernah" searchQuery={searchQuery} />
          </TabsContent>
          <TabsContent value="traffic_nol" className="mt-4">
            <DomainTable table="traffic_nol" searchQuery={searchQuery} />
          </TabsContent>
        </Tabs>
      </section>

      <section className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold">Tabel Riwayat Search</h2>
          <p className="text-sm text-muted-foreground">
            Query yang sama, merupakan bagian dari query lain, atau mengandung query sebelumnya akan ditandai.
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Query</th>
                <th className="px-4 py-3 text-left font-medium">Jumlah Dicari</th>
                <th className="px-4 py-3 text-left font-medium">Terakhir Dicari</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Belum ada riwayat pencarian.
                  </td>
                </tr>
              ) : (
                history.map((item) => {
                  const isRelated =
                    normalizedCurrent.length > 0 &&
                    (item.normalized_query === normalizedCurrent ||
                      item.normalized_query.includes(normalizedCurrent) ||
                      normalizedCurrent.includes(item.normalized_query));

                  return (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">{item.query}</td>
                      <td className="px-4 py-3">{item.search_count}×</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(item.last_searched_at).toLocaleString("id-ID")}
                      </td>
                      <td className="px-4 py-3">
                        {isRelated ? "✓ Sama / mengandung karakter query aktif" : "Tersimpan"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
