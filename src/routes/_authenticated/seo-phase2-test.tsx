import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { FlaskConical, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { runSeoPhase2Test, type Phase2TestResult } from "@/lib/seo/phase2-test.functions";

export const Route = createFileRoute("/_authenticated/seo-phase2-test")({
  head: () => ({
    meta: [
      { title: "Uji Provider Ahrefs All-in-One — Phase 2" },
      {
        name: "description",
        content:
          "Utility internal sementara untuk menguji satu domain dan satu keyword lewat provider Ahrefs All-in-One.",
      },
      { property: "og:title", content: "Uji Provider Ahrefs All-in-One — Phase 2" },
      {
        property: "og:description",
        content: "Verifikasi DR, traffic, search volume, KD, rank, dan ranking URL dari satu Actor.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Phase2TestPage,
});

function Phase2TestPage() {
  const runTest = useServerFn(runSeoPhase2Test);
  const [domain, setDomain] = useState("arsjadrasjid.com");
  const [keyword, setKeyword] = useState("AI generatif");
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Phase2TestResult | null>(null);

  async function handleRun() {
    setRunning(true);
    setResult(null);
    try {
      const response = await runTest({ data: { domain, keyword, country: "id" } });
      setResult(response);
      const failed = response.steps.filter((s) => s.status === "gagal").length;
      if (failed) toast.warning(`${failed} dari ${response.steps.length} searchType gagal`);
      else toast.success("Test selesai");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test gagal dijalankan");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Uji Provider Ahrefs All-in-One (Phase 2)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Utility internal sementara. Memanggil Actor pro100chok/ahrefs-seo-tools untuk satu domain dan
          satu keyword. Tidak menulis ke tabel operasional — hanya cache SEO dan log riset.
        </p>
      </header>

      <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="space-y-1.5">
          <Label htmlFor="domain">Domain</Label>
          <Input id="domain" value={domain} onChange={(e) => setDomain(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="keyword">Keyword</Label>
          <Input id="keyword" value={keyword} onChange={(e) => setKeyword(e.target.value)} />
        </div>
        <Button onClick={() => void handleRun()} disabled={running || !domain.trim() || !keyword.trim()}>
          {running ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
          {running ? "Menjalankan..." : "Jalankan Test"}
        </Button>
      </div>

      {result && (
        <div className="space-y-6">
          <section className="rounded-lg border">
            <h2 className="border-b px-4 py-3 text-sm font-semibold">Field terverifikasi</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="px-4 py-2">Field</th>
                    <th className="px-4 py-2">Nilai</th>
                    <th className="px-4 py-2">searchType sumber</th>
                    <th className="px-4 py-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {result.fields.map((f) => (
                    <tr key={f.field} className="border-b last:border-0">
                      <td className="px-4 py-2 font-medium">{f.field}</td>
                      <td className="px-4 py-2 break-all">{f.value ?? "—"}</td>
                      <td className="px-4 py-2 font-mono text-xs">{f.searchType ?? "—"}</td>
                      <td className="px-4 py-2 text-xs">{f.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border">
            <h2 className="border-b px-4 py-3 text-sm font-semibold">Eksekusi per searchType</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-xs text-muted-foreground">
                  <tr className="border-b">
                    <th className="px-4 py-2">searchType</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">Item</th>
                    <th className="px-4 py-2">Durasi</th>
                    <th className="px-4 py-2">Error</th>
                  </tr>
                </thead>
                <tbody>
                  {result.steps.map((s) => (
                    <tr key={s.searchType} className="border-b last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{s.searchType}</td>
                      <td className="px-4 py-2">{s.status}</td>
                      <td className="px-4 py-2">{s.itemCount}</td>
                      <td className="px-4 py-2">{(s.durationMs / 1000).toFixed(1)}s</td>
                      <td className="px-4 py-2 text-xs text-destructive">{s.error ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border p-4">
            <h2 className="text-sm font-semibold">Output ternormalisasi</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Cache ditulis: {result.cacheWritten.length ? result.cacheWritten.join(", ") : "tidak ada"}
            </p>
            <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
              {JSON.stringify(result.normalized, null, 2)}
            </pre>
          </section>
        </div>
      )}
    </div>
  );
}
