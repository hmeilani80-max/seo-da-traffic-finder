import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { Database, Lightbulb, Loader2, Search, Zap } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SEO_COUNTRIES, SEO_LANGUAGES } from "@/lib/seo/types";
import {
  generateKeywordIdeasFn,
  researchKeywordsFn,
  type KeywordIdea,
  type KeywordMetricsResult,
} from "@/lib/seo/keyword-research.functions";

export const Route = createFileRoute("/_authenticated/keyword-research")({
  head: () => ({
    meta: [
      { title: "Riset Keyword — Ahrefs All-in-One" },
      {
        name: "description",
        content:
          "Cari ide keyword dari satu seed, pilih shortlist, lalu ambil Search Volume, KD, Traffic Potential, dan CPC dengan cache Supabase.",
      },
      { property: "og:title", content: "Riset Keyword — Ahrefs All-in-One" },
      {
        property: "og:description",
        content: "Seed keyword → ide keyword → shortlist → metrik keyword hemat biaya.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: KeywordResearchPage,
});

const MAX_SHORTLIST = 25;

function fmt(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
}

function KeywordResearchPage() {
  const runIdeas = useServerFn(generateKeywordIdeasFn);
  const runMetrics = useServerFn(researchKeywordsFn);

  const [seed, setSeed] = useState("");
  const [country, setCountry] = useState("id");
  const [language, setLanguage] = useState("id");
  const [ideas, setIdeas] = useState<KeywordIdea[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<KeywordMetricsResult[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);

  function toggle(keyword: string) {
    setSelected((prev) =>
      prev.includes(keyword)
        ? prev.filter((k) => k !== keyword)
        : prev.length >= MAX_SHORTLIST
          ? prev
          : [...prev, keyword],
    );
  }

  async function handleIdeas() {
    if (!seed.trim()) {
      toast.error("Masukkan seed keyword terlebih dahulu");
      return;
    }
    setLoadingIdeas(true);
    try {
      const res = await runIdeas({ data: { seed, country, language, limit: 50 } });
      setIdeas(res.ideas);
      setSelected([]);
      setMetrics([]);
      if (res.error) toast.error(res.error);
      else if (res.ideas.length === 0) toast.warning("Tidak ada ide keyword ditemukan");
      else toast.success(`${res.ideas.length} ide keyword ditemukan`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil ide keyword");
    } finally {
      setLoadingIdeas(false);
    }
  }

  async function handleMetrics() {
    if (selected.length === 0) {
      toast.error("Pilih minimal satu keyword pada shortlist");
      return;
    }
    setLoadingMetrics(true);
    try {
      const res = await runMetrics({ data: { keywords: selected, country, language } });
      setMetrics(res);
      const failed = res.filter((r) => r.error).length;
      if (failed) toast.warning(`${failed} dari ${res.length} keyword gagal diambil metriknya`);
      else toast.success(`Metrik untuk ${res.length} keyword selesai`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal mengambil metrik keyword");
    } finally {
      setLoadingMetrics(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Riset Keyword</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Alur: seed keyword → ide keyword → shortlist → metrik keyword. Metrik hanya diambil untuk
          keyword yang Anda pilih, dan cache 30 hari dipakai lebih dulu agar hemat biaya. Cache
          dipisahkan per kombinasi negara dan bahasa.
        </p>
      </header>

      <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
        <div className="space-y-1.5">
          <Label htmlFor="seed">Seed keyword</Label>
          <Input
            id="seed"
            placeholder="contoh: jasa backlink"
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleIdeas();
            }}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="country">Negara / Lokasi</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger id="country">
                <SelectValue placeholder="Pilih negara" />
              </SelectTrigger>
              <SelectContent>
                {SEO_COUNTRIES.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.label} ({c.code.toUpperCase()})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="language">Bahasa</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger id="language">
                <SelectValue placeholder="Pilih bahasa" />
              </SelectTrigger>
              <SelectContent>
                {SEO_LANGUAGES.map((l) => (
                  <SelectItem key={l.code} value={l.code}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button onClick={() => void handleIdeas()} disabled={loadingIdeas || !seed.trim()}>
          {loadingIdeas ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Lightbulb className="size-4" />
          )}
          {loadingIdeas ? "Mencari ide..." : "Cari Ide Keyword"}
        </Button>
      </div>

      {ideas.length > 0 && (
        <section className="rounded-lg border">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
            <h2 className="text-sm font-semibold">
              Ide Keyword ({ideas.length}) — dipilih {selected.length}/{MAX_SHORTLIST}
            </h2>
            <Button
              size="sm"
              onClick={() => void handleMetrics()}
              disabled={loadingMetrics || selected.length === 0}
            >
              {loadingMetrics ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Search className="size-4" />
              )}
              {loadingMetrics ? "Mengambil metrik..." : "Ambil Metrik Shortlist"}
            </Button>
          </div>
          <ul className="max-h-80 divide-y overflow-y-auto">
            {ideas.map((idea) => (
              <li key={idea.normalizedKeyword} className="flex items-center gap-3 px-4 py-2 text-sm">
                <Checkbox
                  id={`kw-${idea.normalizedKeyword}`}
                  checked={selected.includes(idea.keyword)}
                  onCheckedChange={() => toggle(idea.keyword)}
                />
                <Label htmlFor={`kw-${idea.normalizedKeyword}`} className="flex-1 font-normal">
                  {idea.keyword}
                </Label>
                {idea.searchVolume !== null && (
                  <span className="text-xs text-muted-foreground">Vol {fmt(idea.searchVolume)}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {metrics.length > 0 && (
        <section className="rounded-lg border">
          <h2 className="border-b px-4 py-3 text-sm font-semibold">Metrik Keyword</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-muted-foreground">
                <tr className="border-b">
                  <th className="px-4 py-2">Keyword</th>
                  <th className="px-4 py-2">Negara / Bahasa</th>
                  <th className="px-4 py-2">Search Volume</th>
                  <th className="px-4 py-2">KD</th>
                  <th className="px-4 py-2">Traffic Potential</th>
                  <th className="px-4 py-2">CPC (USD)</th>
                  <th className="px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {metrics.map((m) => (
                  <tr key={m.normalizedKeyword} className="border-b last:border-0">
                    <td className="px-4 py-2 font-medium">
                      {m.keyword}
                      {m.error && <div className="text-xs font-normal text-destructive">{m.error}</div>}
                    </td>
                    <td className="px-4 py-2 uppercase">
                      {m.country} / {m.language}
                    </td>
                    <td className="px-4 py-2">{fmt(m.searchVolume)}</td>
                    <td className="px-4 py-2">{fmt(m.keywordDifficulty)}</td>
                    <td className="px-4 py-2">{fmt(m.trafficPotential)}</td>
                    <td className="px-4 py-2">{fmt(m.cpc)}</td>
                    <td className="px-4 py-2">
                      <Badge variant={m.source === "cache" ? "secondary" : "default"} className="gap-1">
                        {m.source === "cache" ? (
                          <Database className="size-3" />
                        ) : (
                          <Zap className="size-3" />
                        )}
                        {m.source === "cache" ? "Cache" : "Fresh"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
