import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainTable } from "@/components/DomainTable";
import { DomainSearchResearch } from "@/components/DomainSearchResearch";
import { TambahDomainDibeli } from "@/components/TambahDomainDibeli";
import { useRealtimeDomains } from "@/hooks/useRealtimeDomains";
import {
  fetchSearchHistory,
  fetchTable,
  getSearchMatchType,
  normalizeSearchQuery,
  type SearchMatchType,
  type TableKey,
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
      {
        property: "og:title",
        content: "Dashboard Riset Backlink — Manajemen Domain",
      },
      {
        property: "og:description",
        content:
          "Cek domain massal, riset DR & traffic otomatis, dan kelola riwayat pembelian backlink.",
      },
    ],
  }),
  component: Dashboard,
});

function matchLabel(matchType: SearchMatchType) {
  switch (matchType) {
    case "sama":
      return "✓ Sama";

    case "mengandung":
      return "↳ Mengandung query aktif";

    case "terkandung":
      return "↳ Terkandung dalam query aktif";

    default:
      return "Tersimpan";
  }
}

function Dashboard() {
  useRealtimeDomains();

  const [activeTab, setActiveTab] = useState<TableKey>("sudah_dibeli");
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




  const c = counts.data ?? {
    domain_sudah_pernah: 0,
    traffic_nol: 0,
    sudah_dibeli: 0,
  };

  const normalizedCurrent = normalizeSearchQuery(searchQuery);
  const history = searchHistory.data ?? [];

  const relatedHistory = history.filter(
    (item) =>
      normalizedCurrent.length > 0 &&
      getSearchMatchType(searchQuery, item.query) !== "tidak_terkait",
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          Dashboard Riset Backlink
        </h1>

        <p className="text-sm text-muted-foreground">
          Cek domain rajabacklink.com untuk client arsjadrasjid.com — otomatis
          riset DR &amp; traffic lalu dirutekan ke tabel yang sesuai.
        </p>

        <nav className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link to="/projects" className="rounded-md border px-3 py-1 hover:bg-muted">
            Proyek &amp; Placement
          </Link>
          <Link
            to="/backlink-recommendation"
            className="rounded-md border px-3 py-1 hover:bg-muted"
          >
            Rekomendasi Backlink
          </Link>
          <Link to="/domain-research" className="rounded-md border px-3 py-1 hover:bg-muted">
            Riset Domain
          </Link>
          <Link to="/keyword-research" className="rounded-md border px-3 py-1 hover:bg-muted">
            Riset Keyword
          </Link>
        </nav>
      </header>


      <TambahDomainDibeli />

      <section>
        <DomainSearchResearch
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          onFound={setActiveTab}
        />

        {normalizedCurrent && relatedHistory.length > 0 && (
          <div className="mb-4 rounded-md bg-muted/50 px-3 py-2 text-sm">
            <span className="font-medium">Query aktif:</span> {searchQuery}
            <span className="ml-2 font-medium text-primary">
              • {relatedHistory.length} query terkait ditemukan
            </span>
          </div>
        )}

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TableKey)}>

          <TabsList>
            <TabsTrigger value="sudah_dibeli">
              Sudah Dibeli ({c.sudah_dibeli})
            </TabsTrigger>

            <TabsTrigger value="domain_sudah_pernah">
              Domain Sudah Pernah ({c.domain_sudah_pernah})
            </TabsTrigger>

            <TabsTrigger value="traffic_nol">
              Traffic 0 ({c.traffic_nol})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sudah_dibeli" className="mt-4">
            <DomainTable
              table="sudah_dibeli"
              searchQuery={searchQuery}
            />
          </TabsContent>

          <TabsContent value="domain_sudah_pernah" className="mt-4">
            <DomainTable
              table="domain_sudah_pernah"
              searchQuery={searchQuery}
            />
          </TabsContent>

          <TabsContent value="traffic_nol" className="mt-4">
            <DomainTable
              table="traffic_nol"
              searchQuery={searchQuery}
            />
          </TabsContent>
        </Tabs>
      </section>

      <section className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
        <div className="border-b p-4">
          <h2 className="text-base font-semibold">
            Tabel Riwayat Search
          </h2>

          <p className="text-sm text-muted-foreground">
            Riwayat pencarian dicocokkan dengan query aktif berdasarkan query
            yang sama atau saling mengandung.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/30">
              <tr>
                <th className="px-4 py-3 text-left font-medium">
                  Query
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Jumlah Dicari
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Terakhir Dicari
                </th>

                <th className="px-4 py-3 text-left font-medium">
                  Status
                </th>
              </tr>
            </thead>

            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    Belum ada riwayat pencarian.
                  </td>
                </tr>
              ) : (
                history.map((item) => {
                  const matchType = getSearchMatchType(
                    searchQuery,
                    item.query,
                  );

                  const isRelated =
                    matchType !== "tidak_terkait";

                  return (
                    <tr
                      key={item.id}
                      className={`border-b last:border-0 ${
                        isRelated ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium">
                        {item.query}
                      </td>

                      <td className="px-4 py-3">
                        {item.search_count}×
                      </td>

                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(
                          item.last_searched_at,
                        ).toLocaleString("id-ID")}
                      </td>

                      <td
                        className={`px-4 py-3 ${
                          isRelated
                            ? "font-medium text-primary"
                            : "text-muted-foreground"
                        }`}
                      >
                        {matchLabel(matchType)}
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
