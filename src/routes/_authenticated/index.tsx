import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Database, Loader2, Search, TrendingDown, ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DomainTable } from "@/components/DomainTable";
import { fetchAhrefsMetrics } from "@/lib/ahrefs.functions";
import {
  fetchLogs,
  fetchTable,
  findExisting,
  getApiKey,
  insertLog,
  insertRow,
  normalizeDomain,
  TABLE_META,
  type TableKey,
} from "@/lib/domains";

export const Route = createFileRoute("/")({
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

type HasilCek = { domain: string; tabel: TableKey | "error"; pesan: string };

function Dashboard() {
  const qc = useQueryClient();
  const [input, setInput] = useState("");
  const [hasil, setHasil] = useState<HasilCek[]>([]);
  const ahrefs = useServerFn(fetchAhrefsMetrics);

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

  const logs = useQuery({ queryKey: ["logs"], queryFn: fetchLogs });

  const proses = useMutation({
    mutationFn: async (raw: string) => {
      const apiKey = getApiKey();
      const domains = Array.from(
        new Set(
          raw
            .split(/[\n,;\s]+/)
            .map(normalizeDomain)
            .filter(Boolean),
        ),
      );
      if (domains.length === 0) throw new Error("Masukkan minimal satu domain");

      const out: HasilCek[] = [];
      for (const domain of domains) {
        const existing = await findExisting(domain);
        if (existing) {
          await insertRow("domain_sudah_pernah", { domain, dr: null, traffic: null,
            notes: `Terdeteksi sudah pernah ada di tabel ${TABLE_META[existing].label}` });
          await insertLog({ domain, hasil: "sudah_pernah", pesan: `Sudah ada di ${TABLE_META[existing].label}` });
          out.push({ domain, tabel: "domain_sudah_pernah", pesan: `Sudah pernah (${TABLE_META[existing].label})` });
          continue;
        }

        if (!apiKey) {
          await insertLog({ domain, hasil: "error", pesan: "API Key kosong" });
          out.push({ domain, tabel: "error", pesan: "Ahrefs API Key belum diisi di Settings" });
          continue;
        }

        const res = await ahrefs({ data: { domain, apiKey } });
        if (res.error) {
          await insertLog({ domain, hasil: "error", pesan: res.error });
          out.push({ domain, tabel: "error", pesan: res.error });
          continue;
        }

        const traffic = res.traffic ?? 0;
        const target: TableKey = traffic > 0 ? "sudah_dibeli" : "traffic_nol";
        await insertRow(target, { domain, dr: res.dr, traffic });
        await insertLog({ domain, hasil: target, dr: res.dr, traffic });
        out.push({
          domain,
          tabel: target,
          pesan: traffic > 0 ? "Traffic > 0 → Sudah Dibeli" : "Traffic 0",
        });
      }
      return out;
    },
    onSuccess: (out) => {
      setHasil(out);
      toast.success(`${out.length} domain selesai diproses`);
      qc.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Terjadi kesalahan"),
  });

  const c = counts.data ?? { domain_sudah_pernah: 0, traffic_nol: 0, sudah_dibeli: 0 };
  const total = c.domain_sudah_pernah + c.traffic_nol + c.sudah_dibeli;
  const chartData = [
    { name: "Sudah Pernah", value: c.domain_sudah_pernah, fill: "var(--chart-2)" },
    { name: "Traffic 0", value: c.traffic_nol, fill: "var(--chart-4)" },
    { name: "Sudah Dibeli", value: c.sudah_dibeli, fill: "var(--chart-3)" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard Riset Backlink</h1>
        <p className="text-sm text-muted-foreground">
          Cek domain rajabacklink.com untuk client arsjadrasjid.com — otomatis riset DR &amp;
          traffic lalu dirutekan ke tabel yang sesuai.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard icon={<Database className="size-4" />} label="Total Domain Dicek" value={total} />
        <StatCard icon={<Activity className="size-4" />} label="Domain Sudah Pernah" value={c.domain_sudah_pernah} />
        <StatCard icon={<TrendingDown className="size-4" />} label="Traffic 0" value={c.traffic_nol} />
        <StatCard icon={<ShoppingCart className="size-4" />} label="Sudah Dibeli" value={c.sudah_dibeli} />
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-3">
          <h2 className="text-base font-semibold">Cek Domain</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            Satu domain atau banyak sekaligus — satu domain per baris.
          </p>
          <Textarea
            rows={6}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={"contohdomain.com\ndomainlain.co.id"}
            className="font-mono text-sm"
          />
          <div className="mt-3 flex items-center gap-3">
            <Button onClick={() => proses.mutate(input)} disabled={proses.isPending}>
              {proses.isPending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              Cek &amp; Riset Domain
            </Button>
            <Link to="/settings" className="text-sm text-primary underline-offset-4 hover:underline">
              Atur Ahrefs API Key
            </Link>
          </div>

          {hasil.length > 0 && (
            <ul className="mt-4 space-y-1.5 text-sm">
              {hasil.map((h) => (
                <li
                  key={h.domain}
                  className="flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2"
                >
                  <span className="font-medium">{h.domain}</span>
                  <span
                    className={
                      h.tabel === "error" ? "text-destructive" : "text-muted-foreground"
                    }
                  >
                    {h.pesan}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border bg-card p-5 shadow-[var(--shadow-card)] lg:col-span-2">
          <h2 className="text-base font-semibold">Distribusi Kategori</h2>
          <div className="mt-4 h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} fontSize={12} />
                <Tooltip cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <h3 className="mt-4 text-sm font-semibold">Aktivitas Terakhir</h3>
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            {(logs.data ?? []).slice(0, 6).map((l) => (
              <li key={l.id} className="flex justify-between gap-2">
                <span className="truncate font-medium text-foreground">{l.domain}</span>
                <span>{l.hasil}</span>
                <span>{new Date(l.created_at).toLocaleString("id-ID")}</span>
              </li>
            ))}
            {(logs.data ?? []).length === 0 && <li>Belum ada aktivitas.</li>}
          </ul>
        </div>
      </section>

      <section>
        <Tabs defaultValue="sudah_dibeli">
          <TabsList>
            <TabsTrigger value="sudah_dibeli">Sudah Dibeli ({c.sudah_dibeli})</TabsTrigger>
            <TabsTrigger value="domain_sudah_pernah">
              Domain Sudah Pernah ({c.domain_sudah_pernah})
            </TabsTrigger>
            <TabsTrigger value="traffic_nol">Traffic 0 ({c.traffic_nol})</TabsTrigger>
          </TabsList>
          <TabsContent value="sudah_dibeli" className="mt-4">
            <DomainTable table="sudah_dibeli" />
          </TabsContent>
          <TabsContent value="domain_sudah_pernah" className="mt-4">
            <DomainTable table="domain_sudah_pernah" />
          </TabsContent>
          <TabsContent value="traffic_nol" className="mt-4">
            <DomainTable table="traffic_nol" />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        {label}
      </div>
      <p className="mt-2 text-3xl font-bold tracking-tight">{value}</p>
    </div>
  );
}
