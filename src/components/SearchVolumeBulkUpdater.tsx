import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  researchKeywordVolumeViaApify,
  type ApifyKeywordVolumeResult,
} from "@/lib/apify-keyword-volume.functions";
import { fetchTable, type DomainRow } from "@/lib/domains";

export function SearchVolumeBulkUpdater() {
  const runVolume = useServerFn(researchKeywordVolumeViaApify);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ApifyKeywordVolumeResult | null>(null);

  const { data = [] } = useQuery({
    queryKey: ["table", "sudah_dibeli"],
    queryFn: () => fetchTable("sudah_dibeli"),
  });

  const candidates = useMemo(
    () =>
      (data as DomainRow[])
        .filter((row) => Boolean(row.keyword?.trim()) && row.search_volume == null)
        .sort((a, b) => a.domain.localeCompare(b.domain)),
    [data],
  );

  const testRow = candidates[0] ?? null;

  async function handleTestOne() {
    if (!testRow?.keyword?.trim()) {
      toast.info("Tidak ada row yang perlu dites");
      return;
    }

    setRunning(true);
    setResult(null);

    try {
      const response = await runVolume({
        data: {
          keyword: testRow.keyword.trim(),
          country: "id",
        },
      });

      setResult(response);

      if (response.error) {
        toast.error(response.error);
      } else {
        toast.success(
          `Test berhasil: ${testRow.keyword} = ${response.searchVolume?.toLocaleString("id-ID") ?? "—"}`,
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Test Apify gagal");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mb-3 rounded-lg border bg-muted/20 p-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <BarChart3 className="size-4 text-primary" />
            Test Search Volume — 1 Row
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Actor: burbn/ahrefs-keyword-explorer · Country: Indonesia (ID) · test tidak menyimpan ke database.
          </p>
          {testRow ? (
            <p className="mt-1 text-xs">
              Domain: <strong>{testRow.domain}</strong> · Keyword: <strong>{testRow.keyword}</strong>
            </p>
          ) : (
            <p className="mt-1 text-xs text-muted-foreground">
              Tidak ada row dengan keyword yang Search Volume-nya masih kosong.
            </p>
          )}
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => void handleTestOne()}
          disabled={running || !testRow}
          className="shrink-0"
        >
          {running ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
          {running ? "Mengetes..." : "Test 1 Row"}
        </Button>
      </div>

      {result && (
        <div className="mt-3 grid gap-2 rounded-md border bg-background p-3 text-sm sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Search Volume</p>
            <p className="font-semibold">
              {result.searchVolume != null ? result.searchVolume.toLocaleString("id-ID") : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Difficulty</p>
            <p className="font-semibold">{result.difficulty ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Global Volume</p>
            <p className="font-semibold">
              {result.globalSearchVolume != null
                ? result.globalSearchVolume.toLocaleString("id-ID")
                : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Traffic Potential</p>
            <p className="font-semibold">
              {result.trafficPotential != null
                ? result.trafficPotential.toLocaleString("id-ID")
                : "—"}
            </p>
          </div>
          {result.error && (
            <p className="sm:col-span-4 text-xs text-destructive">{result.error}</p>
          )}
        </div>
      )}
    </div>
  );
}
