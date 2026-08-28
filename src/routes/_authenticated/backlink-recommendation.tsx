import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  recommendBacklinkPlacementsFn,
  type BacklinkCandidate,
  type BacklinkRecommendationResult,
} from "@/lib/seo/backlink-recommendation.functions";
import { createPlacementOrder, fetchProjects } from "@/lib/projects";

export const Route = createFileRoute("/_authenticated/backlink-recommendation")({
  head: () => ({
    meta: [
      { title: "Rekomendasi Backlink AI — Keyword & Halaman Target" },
      {
        name: "description",
        content:
          "Pipeline profil domain, kandidat semantik OpenAI, metrik keyword dan rank dari Ahrefs, lalu Top 5 rekomendasi penempatan backlink.",
      },
      { property: "og:title", content: "Rekomendasi Backlink AI" },
      {
        property: "og:description",
        content: "Top 5 rekomendasi keyword + halaman target berbasis data Ahrefs dan penalaran OpenAI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BacklinkRecommendationPage,
});

const DRAFT_VALUE = "__draft__";

function fmt(value: number | null) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("id-ID", { maximumFractionDigits: 2 }).format(value);
}

function BacklinkRecommendationPage() {
  const run = useServerFn(recommendBacklinkPlacementsFn);
  const qc = useQueryClient();
  const projects = useQuery({ queryKey: ["projects"], queryFn: fetchProjects });

  const [sourceDomain, setSourceDomain] = useState("");
  const [targetDomain, setTargetDomain] = useState("");
  const [projectId, setProjectId] = useState<string>(DRAFT_VALUE);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  const [result, setResult] = useState<BacklinkRecommendationResult | null>(null);

  async function handleRun() {
    if (!sourceDomain.trim() || !targetDomain.trim()) {
      toast.error("Domain sumber dan domain target wajib diisi.");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const data = await run({ data: { sourceDomain, targetDomain, country: "id" } });
      setResult(data);
      if (data.error) toast.error(data.error);
      else toast.success(`${data.recommendations.length} rekomendasi teratas siap`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menjalankan rekomendasi");
    } finally {
      setLoading(false);
    }
  }

  async function choose(candidate: BacklinkCandidate) {
    if (!result) return;
    setSaving(candidate.keyword);
    try {
      await createPlacementOrder({
        project_id: projectId === DRAFT_VALUE ? null : projectId,
        source_domain: result.sourceDomain,
        target_url: candidate.targetUrl,
        keyword: candidate.keyword,
        anchor_text: candidate.anchorText,
        status: "draft",
        dr: result.sourceProfile?.dr ?? null,
        traffic: result.sourceProfile?.traffic ?? null,
        search_volume: candidate.searchVolume,
        notes: candidate.reason || null,
      });
      qc.invalidateQueries({ queryKey: ["placement_orders"] });
      toast.success("Rekomendasi dipilih dan disimpan sebagai placement order draft");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan order");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Rekomendasi Backlink</h1>
        <p className="text-sm text-muted-foreground">
          Profil domain → kandidat semantik AI → metrik keyword &amp; rank dari Ahrefs (cache-first)
          → Top 5. Tidak ada data yang ditulis otomatis; kamu yang memilih rekomendasi.
        </p>
      </header>

      <section className="grid gap-3 rounded-lg border p-4 sm:grid-cols-4">
        <div className="space-y-1">
          <Label htmlFor="src">Domain Sumber (backlink)</Label>
          <Input
            id="src"
            value={sourceDomain}
            onChange={(e) => setSourceDomain(e.target.value)}
            placeholder="contoh.com"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tgt">Domain Target (klien)</Label>
          <Input
            id="tgt"
            value={targetDomain}
            onChange={(e) => setTargetDomain(e.target.value)}
            placeholder="arsjadrasjid.com"
            onKeyDown={(e) => {
              if (e.key === "Enter") handleRun();
            }}
          />
        </div>
        <div className="space-y-1">
          <Label>Simpan ke Proyek</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={DRAFT_VALUE}>Draft (tanpa proyek)</SelectItem>
              {(projects.data ?? []).map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-end">
          <Button className="w-full" onClick={handleRun} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Buat Rekomendasi
          </Button>
        </div>
      </section>

      {result && (
        <>
          <section className="grid gap-3 sm:grid-cols-2">
            <ProfileCard title="Domain Sumber" profile={result.sourceProfile} />
            <ProfileCard title="Domain Target" profile={result.targetProfile} />
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold">
              Top {result.recommendations.length} Rekomendasi
            </h2>
            {result.recommendations.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {result.error ?? "Tidak ada rekomendasi."}
              </p>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-left">
                    <tr>
                      <th className="p-2">Keyword</th>
                      <th className="p-2">URL Target</th>
                      <th className="p-2">Volume</th>
                      <th className="p-2">KD</th>
                      <th className="p-2">CPC</th>
                      <th className="p-2">Posisi</th>
                      <th className="p-2">Skor</th>
                      <th className="p-2">Alasan</th>
                      <th className="p-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {result.recommendations.map((c) => (
                      <tr key={`${c.keyword}-${c.targetUrl}`} className="border-t align-top">
                        <td className="p-2 font-medium">
                          {c.keyword}
                          {c.repeated && (
                            <Badge variant="destructive" className="ml-2">
                              pernah dipakai
                            </Badge>
                          )}
                        </td>
                        <td className="max-w-[220px] truncate p-2">{c.targetUrl}</td>
                        <td className="p-2">{fmt(c.searchVolume)}</td>
                        <td className="p-2">{fmt(c.keywordDifficulty)}</td>
                        <td className="p-2">{fmt(c.cpc)}</td>
                        <td className="p-2">{fmt(c.currentPosition)}</td>
                        <td className="p-2">{fmt(c.score)}</td>
                        <td className="max-w-[280px] p-2 text-muted-foreground">{c.reason}</td>
                        <td className="p-2">
                          <Button
                            size="sm"
                            disabled={saving === c.keyword}
                            onClick={() => choose(c)}
                          >
                            {saving === c.keyword ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : null}
                            Pilih
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {result.candidates.length} kandidat dievaluasi • {result.previousPlacementCount}{" "}
              kombinasi keyword + URL historis dipakai sebagai penalti.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function ProfileCard({
  title,
  profile,
}: {
  title: string;
  profile: BacklinkRecommendationResult["sourceProfile"];
}) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground">{profile?.normalizedDomain ?? "—"}</p>
      <div className="mt-2 grid grid-cols-4 gap-2 text-sm">
        <Metric label="DR" value={profile?.dr ?? null} />
        <Metric label="Traffic" value={profile?.traffic ?? null} />
        <Metric label="Backlinks" value={profile?.backlinks ?? null} />
        <Metric label="Ref. Domain" value={profile?.referringDomains ?? null} />
      </div>
      {profile?.error && <p className="mt-2 text-xs text-destructive">{profile.error}</p>}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium">{fmt(value)}</p>
    </div>
  );
}
