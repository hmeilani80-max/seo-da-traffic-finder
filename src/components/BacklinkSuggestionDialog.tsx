import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Save, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { BacklinkSuggestionPanel } from "@/components/BacklinkSuggestionPanel";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  insertLog,
  updateDomainRow,
  type DomainRow,
} from "@/lib/domains";

export function BacklinkSuggestionDialog({
  row,
  open,
  onOpenChange,
}: {
  row: DomainRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();

  const [keyword, setKeyword] = useState(
    row.keyword ?? "",
  );

  const [targetPage, setTargetPage] = useState(
    row.target_page ?? "",
  );

  /**
   * Setiap dialog dibuka,
   * isi field dari data row terbaru.
   */
  useEffect(() => {
    if (!open) return;

    setKeyword(row.keyword ?? "");
    setTargetPage(row.target_page ?? "");
  }, [open, row]);

  /**
   * Simpan rekomendasi kembali
   * ke row yang sama di tabel sudah_dibeli.
   */
  const saveMutation = useMutation({
    mutationFn: async () => {
      const cleanKeyword = keyword.trim();
      const cleanTargetPage = targetPage.trim();

      if (!cleanKeyword) {
        throw new Error(
          "Pilih atau isi Keyword / Anchor terlebih dahulu.",
        );
      }

      if (!cleanTargetPage) {
        throw new Error(
          "Pilih atau isi Halaman Target terlebih dahulu.",
        );
      }

      try {
        const parsed = new URL(cleanTargetPage);

        const hostname = parsed.hostname
          .toLowerCase()
          .replace(/^www\./, "");

        if (hostname !== "arsjadrasjid.com") {
          throw new Error(
            "Halaman Target harus berasal dari arsjadrasjid.com.",
          );
        }
      } catch (error) {
        if (error instanceof Error) {
          throw error;
        }

        throw new Error(
          "Format Halaman Target tidak valid.",
        );
      }

      /**
       * Penting:
       *
       * updateDomainRow akan ikut memproses traffic.
       * Karena itu traffic existing dikirim kembali
       * agar nilainya tidak berubah menjadi null.
       */
      await updateDomainRow(
        "sudah_dibeli",
        row.id,
        {
          keyword: cleanKeyword,
          target_page: cleanTargetPage,

          traffic: row.traffic,
        },
      );

      /**
       * Simpan histori perubahan.
       */
      await insertLog({
        domain: row.domain,

        hasil: "sudah_dibeli",

        dr: row.dr,

        traffic: row.traffic,

        pesan:
          `Rekomendasi backlink disimpan: ${cleanKeyword} → ${cleanTargetPage}`,
      });
    },

    onSuccess: async () => {
      toast.success(
        "Keyword dan Halaman Target berhasil disimpan",
      );

      await queryClient.invalidateQueries({
        queryKey: [
          "table",
          "sudah_dibeli",
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: [
          "domain-price-total",
          "sudah_dibeli",
        ],
      });

      await queryClient.invalidateQueries({
        queryKey: ["ringkasan"],
      });

      onOpenChange(false);
    },

    onError: (error: Error) => {
      toast.error(
        error.message ||
          "Gagal menyimpan rekomendasi backlink",
      );
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent className="max-h-[92vh] max-w-7xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="size-5 text-primary" />

            Cari Saran Backlink
          </DialogTitle>

          <DialogDescription>
            Analisa OpenSEO untuk{" "}
            <strong>{row.domain}</strong>{" "}
            dan pilih Keyword + Halaman Target
            terbaik di arsjadrasjid.com.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* DOMAIN INFORMATION */}
          <div className="grid gap-3 rounded-lg border bg-muted/20 p-4 sm:grid-cols-3">
            <div>
              <p className="text-[11px] text-muted-foreground">
                Domain Sumber
              </p>

              <p className="mt-1 font-semibold">
                {row.domain}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-muted-foreground">
                DA / DR
              </p>

              <p className="mt-1 font-semibold">
                {row.dr ?? "—"}
              </p>
            </div>

            <div>
              <p className="text-[11px] text-muted-foreground">
                Organic Traffic
              </p>

              <p className="mt-1 font-semibold">
                {row.traffic != null
                  ? Number(
                      row.traffic,
                    ).toLocaleString(
                      "id-ID",
                    )
                  : "—"}
              </p>
            </div>
          </div>

          {/* OPENSEO RECOMMENDATION ENGINE */}
          <BacklinkSuggestionPanel
            domain={row.domain}
            sourceDr={
              row.dr != null
                ? String(row.dr)
                : ""
            }
            onUse={(suggestion) => {
              setKeyword(
                suggestion.keyword,
              );

              setTargetPage(
                suggestion.targetPage,
              );
            }}
          />

          {/* SELECTED RECOMMENDATION */}
          <div className="rounded-lg border p-4">
            <div>
              <p className="text-sm font-semibold">
                Pilihan yang Akan Disimpan
              </p>

              <p className="mt-1 text-xs text-muted-foreground">
                Setelah memilih rekomendasi,
                Anda masih dapat mengubah
                Keyword atau Halaman Target
                secara manual.
              </p>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="backlink-keyword">
                  Keyword / Anchor
                </Label>

                <Input
                  id="backlink-keyword"
                  value={keyword}
                  onChange={(event) =>
                    setKeyword(
                      event.target.value,
                    )
                  }
                  placeholder="Contoh: kendaraan listrik Indonesia"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="backlink-target-page">
                  Halaman Target
                </Label>

                <Input
                  id="backlink-target-page"
                  value={targetPage}
                  onChange={(event) =>
                    setTargetPage(
                      event.target.value,
                    )
                  }
                  placeholder="https://arsjadrasjid.com/..."
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              onOpenChange(false)
            }
            disabled={
              saveMutation.isPending
            }
          >
            Batal
          </Button>

          <Button
            type="button"
            onClick={() =>
              saveMutation.mutate()
            }
            disabled={
              saveMutation.isPending ||
              !keyword.trim() ||
              !targetPage.trim()
            }
          >
            <Save className="size-4" />

            {saveMutation.isPending
              ? "Menyimpan..."
              : "Simpan ke Sudah Dibeli"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
