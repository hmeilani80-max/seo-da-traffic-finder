import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainTable } from "@/components/DomainTable";
import { TambahDomainDibeli } from "@/components/TambahDomainDibeli";
import { useRealtimeDomains } from "@/hooks/useRealtimeDomains";
import { fetchTable } from "@/lib/domains";

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

  const c = counts.data ?? { domain_sudah_pernah: 0, traffic_nol: 0, sudah_dibeli: 0 };

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
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold">Data Domain</h2>
            <p className="text-sm text-muted-foreground">Satu pencarian berlaku untuk semua tabel.</p>
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
    </div>
  );
}
