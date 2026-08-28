import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Check,
  ExternalLink,
  Loader2,
  Search,
  Sparkles,
} from "lucide-react";
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

function formatNumber(value: number | null | undefined) {
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

function ScoreChip({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-md border bg-muted/40 px-2.5 py-2">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
        {label}
      </p>

      <p className="mt-0.5 text-sm font-semibold">
        {value}
        <span className="ml-0.5 text-xs font-normal text-muted-foreground">
          /100
        </span>
      </p>
    </div>
  );
}

function OverviewMetric({
  label,
  value,
}: {
  label: string;
  value: number | null | undefined;
}) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-[11px] text-muted-foreground">{label}</p>

      <p className="mt-1 text-base font-semibold">{formatNumber(value)}</p>
    </div>
  );
}

export function BacklinkSuggestionPanel({
  domain,
  sourceDr,
  onUse,
}: {
  domain: string;
  sourceDr: string;
  onUse: (
    suggestion: Pick<BacklinkSuggestion, "keyword" | "targetPage">,
  ) => void;
}) {
  const runSuggestions = useServerFn(suggestBacklinkPlacements);

  const [result, setResult] =
    useState<BacklinkSuggestionResult | null>(null);

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

      if (error) {
        throw error;
      }

      const parsedDr =
        sourceDr.trim() === "" ? null : Number(sourceDr);

      const response = await runSuggestions({
        data: {
          domain: normalizedDomain,

          sourceDr:
            parsedDr != null && Number.isFinite(parsedDr)
              ? parsedDr
              : null,

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

      if (data.error) {
        toast.error(data.error);
        return;
      }

      if (data.suggestions.length > 0) {
        toast.success(
          `${data.suggestions.length} saran backlink ditemukan`,
        );
      }
    },

    onError: (error: Error) => {
      toast.error(error.message || "Gagal mencari saran backlink");
    },
  });

  return (
    <div className="rounded-xl border bg-muted/20 p-4 sm:col-span-2 lg:col-span-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />

            <p className="text-sm font-semibold">
              Saran Keyword & Target Page
            </p>
          </div>

          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            OpenSEO menganalisa keyword domain sumber, peluang SEO
            arsjadrasjid.com, histori backlink, dan kekuatan DR untuk memilih
            kombinasi keyword + target page.
          </p>

          {normalizedDomain && (
            <p className="mt-2 text-xs">
              Source: <strong>{normalizedDomain}</strong>
              {" → "}
              Target: <strong>arsjadrasjid.com</strong>
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => mutation.mutate()}
          disabled={
            mutation.isPending || !normalizedDomain.includes(".")
          }
        >
          {mutation.isPending ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Search className="size-4" />
          )}

          {mutation.isPending
            ? "Menganalisa..."
            : "Cari Saran Backlink"}
        </Button>
      </div>

      {result?.error && (
        <div className="mt-4 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          {result.error}
        </div>
      )}

      {result && !result.error && result.targetOverview && (
        <div className="mt-4 rounded-lg border bg-card p-4">
          <div>
            <p className="text-sm font-semibold">
              OpenSEO Overview — arsjadrasjid.com
            </p>

            <p className="mt-1 text-[11px] text-muted-foreground">
              Gambaran umum performa SEO domain target.
            </p>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
            <OverviewMetric
              label="Organic Traffic"
              value={result.targetOverview.organicTraffic}
            />

            <OverviewMetric
              label="Organic Keywords"
              value={result.targetOverview.organicKeywords}
            />

            <OverviewMetric
              label="Backlinks"
              value={result.targetOverview.backlinks}
            />

            <OverviewMetric
              label="Referring Domains"
              value={result.targetOverview.referringDomains}
            />
          </div>
        </div>
      )}

      {result &&
        !result.error &&
        result.suggestions.length > 0 && (
          <div className="mt-4">
            <div className="mb-3">
              <p className="text-sm font-semibold">
                Top Recommendation
              </p>

              <p className="text-[11px] text-muted-foreground">
                Score dihitung dari 35% relevansi topik, 30% SEO opportunity,
                20% backlink diversity, dan 15% link strength fit.
              </p>
            </div>

            <div className="grid gap-3 lg:grid-cols-3">
              {result.suggestions.map((item, index) => (
                <div
                  key={`${item.keyword}-${item.targetPage}`}
                  className="flex flex-col rounded-xl border bg-card p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    {index === 0 && <Badge>Recommended</Badge>}

                    {index === 1 && (
                      <Badge variant="secondary">
                        Alternative #2
                      </Badge>
                    )}

                    {index === 2 && (
                      <Badge variant="secondary">
                        Alternative #3
                      </Badge>
                    )}

                    <Badge variant="outline">
                      Score {item.score}/100
                    </Badge>
                  </div>

                  <div className="mt-4">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Keyword / Anchor
                    </p>

                    <p className="mt-1 font-semibold leading-snug">
                      {item.keyword}
                    </p>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Target Page
                    </p>

                    <a
                      href={item.targetPage}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 inline-flex max-w-full items-center gap-1 text-xs text-primary hover:underline"
                    >
                      <span className="truncate">
                        {shortTargetPage(item.targetPage)}
                      </span>

                      <ExternalLink className="size-3 shrink-0" />
                    </a>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-[10px] text-muted-foreground">
                        Google Position
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatNumber(item.rank)}
                      </p>
                    </div>

                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-[10px] text-muted-foreground">
                        Search Volume
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatNumber(item.searchVolume)}
                      </p>
                    </div>

                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-[10px] text-muted-foreground">
                        Keyword Difficulty
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatNumber(item.keywordDifficulty)}
                      </p>
                    </div>

                    <div className="rounded-md bg-muted/40 p-2">
                      <p className="text-[10px] text-muted-foreground">
                        Estimated Traffic
                      </p>

                      <p className="mt-1 font-semibold">
                        {formatNumber(item.trafficEstimate)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    <ScoreChip
                      label="Relevansi"
                      value={item.topicalRelevance}
                    />

                    <ScoreChip
                      label="SEO Opportunity"
                      value={item.seoOpportunity}
                    />

                    <ScoreChip
                      label="Diversity"
                      value={item.backlinkDiversity}
                    />

                    <ScoreChip
                      label="Link Strength"
                      value={item.linkStrengthFit}
                    />
                  </div>

                  <div className="mt-4 flex-1 rounded-md border bg-muted/20 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Kenapa dipilih
                    </p>

                    <p className="mt-1 text-xs leading-relaxed">
                      {item.reason}
                    </p>
                  </div>

                  <Button
                    type="button"
                    size="sm"
                    className="mt-4 w-full"
                    onClick={() => {
                      onUse({
                        keyword: item.keyword,
                        targetPage: item.targetPage,
                      });

                      toast.success(
                        "Keyword dan target page diterapkan",
                      );
                    }}
                  >
                    <Check className="size-4" />
                    Gunakan Rekomendasi
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

      {result &&
        !result.error &&
        result.suggestions.length === 0 && (
          <div className="mt-4 rounded-md border p-4 text-sm text-muted-foreground">
            Tidak ada rekomendasi yang memenuhi kriteria untuk domain ini.
          </div>
        )}

      {result && !result.error && (
        <div className="mt-4 border-t pt-3">
          <p className="text-[11px] text-muted-foreground">
            Evidence:{" "}
            <strong className="text-foreground">
              {result.sourceKeywordsFound}
            </strong>{" "}
            ranked keyword domain sumber ·{" "}
            <strong className="text-foreground">
              {result.targetKeywordsFound}
            </strong>{" "}
            ranked keyword arsjadrasjid.com dianalisa. Hasil tetap dapat diedit
            manual sebelum disimpan.
          </p>
        </div>
      )}
    </div>
  );
}
