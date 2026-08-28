import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Database, Loader2, RefreshCw, Search, Zap } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { researchDomainsFn, type DomainResearchReport } from "@/lib/seo/domain-research.functions";

export const Route = createFileRoute("/_authenticated/domain-research")({
  head: () => ({
    meta: [
      { title: "Riset Domain — Ahrefs All-in-One" },
      {
        name: "description",
        content:
          "Riset DR, organic traffic, backlinks, dan referring domains untuk satu atau banyak domain dengan cache Supabase.",
      },
      { property: "og:title", content: "Riset Domain — Ahrefs All-in-One" },
      {
        property: "og:description",
        content: "Cek DR, traffic, backlinks, dan referring domains sekaligus dengan status cache.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DomainResearchPage,
});

function fmt(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 }).format(value);
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const ts = Date.parse(value);
  if (!Number.isFinite(ts)) return "—";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(ts);
}

function parseDomains(raw: string): string[] {
  return raw
    .split(/[\s,;\n]+/)
    .map((d) => d.trim())
    .filter(Boolean);
}

function DomainResearchPage() {
  const runResearch = useServerFn(researchDomainsFn);
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DomainResearchReport[]>([]);

  const domains = parseDomains(raw);

  async function handleRun(forceRefresh: boolean) {
    if (domains.length === 0) {
      toast.error("Masukkan minimal satu domain");
      return;
    }
    setLoading(true);
    try {
      const response = await runResearch({ data: { domains, country: "id", forceRefresh } });
      setResults(response);
      const failed = response.filter((r) => r.error).length;
      if (failed) toast.warning(`${failed} dari ${response.length} domain gagal diriset`);
      else toast.success(`${response.length} domain selesai diriset`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Riset domain gagal dijalankan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Riset Domain</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Cek DR, organic traffic, backlinks, dan referring domains. Data diambil dari cache bila masih
          segar (DR 30 hari, traffic 14 hari) sehingga tidak memanggil API berbayar tanpa perlu.
        </p>
      </header>

      <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="domains">Domain (satu atau banyak — pisahkan dengan baris baru atau koma)</Label>
          <Textarea
            id="domains"
            rows={4}
            placeholder={"contoh.com\ndomainlain.co.id"}
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handleRun(false);
            }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void handleRun(false)} disabled={loading || domains.length === 0}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            {loading ? "Meriset..." : "Riset Domain"}
          </Button>
          <Button
            variant="outline"
            onClick={() => void handleRun(true)}
            disabled={loading || domains.length === 0}
          >
            <RefreshCw className="size-4" />
            Paksa Refresh
          </Button>
          <span className="text-xs text-muted-foreground">
            {domains.length} domain terdeteksi (maks. 20 per eksekusi)
          </span>
        </div>
      </div>

      {results.length > 0 && (
        <section className="rounded-lg border">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Hasil Riset</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-4 py-2">Domain</th>
                  <th className="px-4 py-2">DR</th>
                  <th className="px-4 py-2">Organic Traffic</th>
                  <th className="px-4 py-2">Backlinks</th>
                  <th className="px-4 py-2">Referring Domains</th>
                  <th className="px-4 py-2">Terakhir Dicek</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r.normalizedDomain} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium break-all">
                      {r.normalizedDomain}
                      {r.error && (
                        <div className="text-xs font-normal text-destructive">{r.error}</div>
                      )}
                    </td>
                    <td className="px-4 py-2">{fmt(r.dr)}</td>
                    <td className="px-4 py-2">{fmt(r.traffic)}</td>
                    <td className="px-4 py-2">{fmt(r.backlinks)}</td>
                    <td className="px-4 py-2">{fmt(r.referringDomains)}</td>
                    <td className="px-4 py-2 text-xs">{fmtDate(r.lastCheckedAt)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={r.fullyCached ? "secondary" : "default"} className="gap-1">
                        {r.fullyCached ? (
                          <Database className="size-3" />
                        ) : (
                          <Zap className="size-3" />
                        )}
                        {r.fullyCached ? "Cache" : "Fresh"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t px-4 py-2 text-xs text-muted-foreground">
            Status &quot;Cache&quot; berarti seluruh metrik diambil dari Supabase tanpa memanggil Actor.
            &quot;Fresh&quot; berarti minimal satu metrik baru diambil dari Ahrefs.
          </p>
        </section>
      )}
    </div>
  );
}
