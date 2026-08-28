import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BarChart3, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { researchKeywordVolumeViaApify } from "@/lib/apify-keyword-volume.functions";
import { fetchTable, updateDomainRow, type DomainRow } from "@/lib/domains";

function normalizeKeyword(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

export function SearchVolumeBulkUpdater() {
  const queryClient = useQueryClient();
  const runVolume = useServerFn(researchKeywordVolumeViaApify);

  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });

  const { data = [] } = useQuery({
    queryKey: ["table", "sudah_dibeli"],
    queryFn: () => fetchTable("sudah_dibeli"),
  });

  const candidates = useMemo(
    () =>
      (data as DomainRow[]).filter(
        (row) => Boolean(row.keyword?.trim()) && row.search_volume == null,
      ),
    [data],
  );

  const uniqueKeywordCount = useMemo(() => {
    return new Set(
      candidates.map((row) => normalizeKeyword(String(row.keyword ?? ""))),
    ).size;
  }, [candidates]);

  async function handleFillVolume() {
    if (candidates.length === 0) {
      toast.info("Semua row ber-keyword sudah memiliki Search Volume");
      return;
    }

    setRunning(true);
    setProgress({ done: 0, total: uniqueKeywordCount });

    const grouped = new Map<string, DomainRow[]>();

    for (const row of candidates) {
      const key = normalizeKeyword(String(row.keyword ?? ""));
      const rows = grouped.get(key) ?? [];
      rows.push(row);
      grouped.set(key, rows);
    }

    let successKeywords = 0;
    let failedKeywords = 0;
    let updatedRows = 0;
    let done = 0;

    try {
      for (const [, rows] of grouped) {
        const keyword = String(rows[0]?.keyword ?? "").trim();

        const result = await runVolume({
          data: {
            keyword,
            country: "id",
          },
        });

        if (result.error || result.searchVolume == null) {
          failedKeywords += 1;
          console.error(`[Search Volume] ${keyword}: ${result.error ?? "tidak ada volume"}`);
        } else {
          successKeywords += 1;

          for (const row of rows) {
            await updateDomainRow("sudah_dibeli", row.id, {
              search_volume: result.searchVolume,
              traffic: row.traffic,
            });
            updatedRows += 1;
          }
        }

        done += 1;
        setProgress({ done, total: uniqueKeywordCount });
      }

      await queryClient.invalidateQueries({
        queryKey: ["table", "sudah_dibeli"],
      });

      toast.success(
        `${updatedRows} row diperbarui · ${successKeywords} keyword berhasil · ${failedKeywords} gagal`,
      );
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Gagal mengisi Search Volume",
      );
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mb-3 flex flex-col gap-2 rounded-lg border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <BarChart3 className="size-4 text-primary" />
          Search Volume via Apify
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Mengisi row yang Search Volume-nya masih kosong berdasarkan Keyword existing. Database
          Indonesia (ID). Keyword dan Halaman Target tidak diubah.
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {candidates.length} row perlu diisi · {uniqueKeywordCount} keyword unik = maksimal {uniqueKeywordCount} run Actor
        </p>
      </div>

      <Button
        type="button"
        variant="outline"
        onClick={() => void handleFillVolume()}
        disabled={running || candidates.length === 0}
        className="shrink-0"
      >
        {running ? <Loader2 className="size-4 animate-spin" /> : <BarChart3 className="size-4" />}
        {running
          ? `Memproses ${progress.done}/${progress.total}`
          : candidates.length === 0
            ? "Search Volume Lengkap"
            : `Isi Search Volume (${candidates.length})`}
      </Button>
    </div>
  );
}
