import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Check, ExternalLink, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  suggestBacklinkPlacements,
  type BacklinkSuggestion,
  type BacklinkSuggestionResult,
} from "@/lib/backlink-suggestions.functions";
import { normalizeDomain } from "@/lib/domains";

function formatNumber(value: number | null) {
  return value == null ? "—" : value.toLocaleString("id-ID");
}

function shortTargetPage(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname === "/" ? "/" : parsed.pathname;
  } catch {
    return url;
  }
}

function ScoreChip({ label, value }: { label: string; value: number }) {
  return (
    <span className="rounded-md bg-muted px-2 py-1 text-[11px] text-muted-foreground">
      {label} <strong className="text-foreground">{value}</strong>
    </span>
  );
}

export function BacklinkSuggestionPanel({
  domain,
  sourceDr,
  onUse,
}: {
  domain: string;
  sourceDr: string;
  onUse: (suggestion: Pick<BacklinkSuggestion, "keyword" | "targetPage">) => void;
}) {
  const runSuggestions = useServerFn(suggestBacklinkPlacements);
  const [result, setResult] = useState<BacklinkSuggestionResult | null>(null);
  const normalizedDomain = normalizeDomain(domain);

  useEffect(() => {
    setResult(null);
  }, [normalizedDomain]);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!normalizedDomain || !normalizedDomain.includes(".")) {
        throw new Error("Isi domain sumber terlebih dahulu.");
      }

      const { data: history, error } = await supabase
        .from("sudah_dibeli")
        .select("keyword, target_page")
        .limit(500);
      if (error) throw error;

      const parsedDr = sourceDr.trim() === "" ? null : Number(sourceDr);
      const response = await runSuggestions({
        data: {
          domain: normalizedDomain,
          sourceDr: Number.isFinite(parsedDr) ? parsedDr : null,
          history: (history ?? []).map((item) => ({
            keyword: item.keyword,
            targetPage: item.target_page,
          })),
        },
      });

      return response;
    },
    onSuccess: (data) => {
      setResult(data);
      if (data.error) toast.error(data.error);
      else if (data.suggestions.length > 0)
        toast.success(`${data.suggestions.length} saran backlink ditemukan`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Gagal mencari saran backlink");
    },
  });

  return (
    <div className="rounded-lg border bg-muted/20 p-3 sm:col-span-2 lg:col-span-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <p className="text-sm font-semibold">Saran Keyword &amp; Target Page</p>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            OpenSEO membandingkan topik domain sumber dengan peluang SEO target, lalu
            mengurangi rekomendasi yang terlalu sering dipakai di histori backlink.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !normalizedDomain.includes(".")}
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          {mutation.isPending ? "Menganalisa..." : "Cari Saran Backlink"}
        </Button>
      </div>

      {result?.error && (
        <div className="mt-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {result.error}
        </div>
      )}

      {result && !result.error && result.suggestions.length > 0 && (
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          {result.suggestions.map((item, index) => (
            <div key={`${item.keyword}-${item.targetPage}`} className="rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {index === 0 && <Badge>Recommended</Badge>}
                    <Badge variant="outline">Score {item.score}</Badge>
                  </div>
                  <p className="mt-2 font-semibold leading-snug">{item.keyword}</p>
                  <a
                    href={item.targetPage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <span className="truncate">{shortTargetPage(item.targetPage)}</span>
                    <ExternalLink className="size-3 shrink-0" />
                  </a>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div>
                  <p className="text-muted-foreground">Posisi</p>
                  <p className="font-medium">{formatNumber(item.rank)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Volume</p>
                  <p className="font-medium">{formatNumber(item.searchVolume)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">KD</p>
                  <p className="font-medium">{formatNumber(item.keywordDifficulty)}</p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <ScoreChip label="Relevansi" value={item.topicalRelevance} />
                <ScoreChip label="Opportunity" value={item.seoOpportunity} />
                <ScoreChip label="Diversity" value={item.backlinkDiversity} />
                <ScoreChip label="Link fit" value={item.linkStrengthFit} />
              </div>

              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{item.reason}</p>

              <Button
                type="button"
                size="sm"
                className="mt-3 w-full"
                onClick={() => {
                  onUse({ keyword: item.keyword, targetPage: item.targetPage });
                  toast.success("Keyword dan target page diterapkan");
                }}
              >
                <Check className="size-4" />
                Gunakan
              </Button>
            </div>
          ))}
        </div>
      )}

      {result && !result.error && (
        <p className="mt-3 text-[11px] text-muted-foreground">
          Evidence: {result.sourceKeywordsFound} keyword domain sumber · {result.targetKeywordsFound}{" "}
          keyword target dianalisa. Saran tetap bisa diedit manual sebelum disimpan.
        </p>
      )}
    </div>
  );
}
