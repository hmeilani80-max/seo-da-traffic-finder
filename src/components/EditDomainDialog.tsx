import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  findDuplicateDomain,
  insertLog,
  normalizeDomain,
  TABLE_META,
  updateDomainRow,
  type DomainPatch,
  type DomainRow,
  type TableKey,
} from "@/lib/domains";

type ResearchStatus =
  | "belum_diriset"
  | "sedang_diriset"
  | "selesai"
  | "gagal";

const STATUS_OPTIONS: { value: ResearchStatus; label: string }[] = [
  { value: "belum_diriset", label: "Belum diriset" },
  { value: "sedang_diriset", label: "Sedang diriset" },
  { value: "selesai", label: "Selesai" },
  { value: "gagal", label: "Gagal" },
];

export function EditDomainDialog({
  table,
  row,
  open,
  onOpenChange,
}: {
  table: TableKey;
  row: DomainRow;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const qc = useQueryClient();
  const detail = table !== "traffic_nol";

  // Search Volume hanya berlaku untuk tabel "sudah_dibeli".
  const showSearchVolume = table === "sudah_dibeli";

  const [domain, setDomain] = useState(row.domain);
  const [dr, setDr] = useState(row.dr?.toString() ?? "");
  const [traffic, setTraffic] = useState(row.traffic?.toString() ?? "");
  const [researchStatus, setResearchStatus] = useState<ResearchStatus>(
    row.research_status ?? "belum_diriset",
  );
  const [notes, setNotes] = useState(row.notes ?? "");
  const [keyword, setKeyword] = useState(row.keyword ?? "");
  const [targetPage, setTargetPage] = useState(row.target_page ?? "");
  const [purchaseDate, setPurchaseDate] = useState(row.purchase_date ?? "");
  const [price, setPrice] = useState(row.price?.toString() ?? "");
  const [searchVolume, setSearchVolume] = useState(
    row.search_volume?.toString() ?? "",
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    setDomain(row.domain);
    setDr(row.dr?.toString() ?? "");
    setTraffic(row.traffic?.toString() ?? "");
    setResearchStatus(row.research_status ?? "belum_diriset");
    setNotes(row.notes ?? "");
    setKeyword(row.keyword ?? "");
    setTargetPage(row.target_page ?? "");
    setPurchaseDate(row.purchase_date ?? "");
    setPrice(row.price?.toString() ?? "");
    setSearchVolume(row.search_volume?.toString() ?? "");
    setError(null);
  }, [open, row]);

  const simpan = useMutation({
    mutationFn: async () => {
      const normalized = normalizeDomain(domain);

      if (!normalized || !normalized.includes(".")) {
        throw new Error("Domain tidak valid. Contoh yang benar: contoh.com");
      }

      const parseNumber = (
        value: string,
        label: string,
        max?: number,
      ): number | null => {
        const trimmed = value.trim();
        if (!trimmed) return null;

        const parsed = Number(trimmed);

        if (!Number.isFinite(parsed) || parsed < 0) {
          throw new Error(`${label} harus berupa angka minimal 0.`);
        }

        if (max != null && parsed > max) {
          throw new Error(`${label} maksimal ${max}.`);
        }

        return parsed;
      };

      const drValue = parseNumber(dr, "DA / DR", 100);
      let trafficValue = parseNumber(traffic, "Organic Traffic");
      const priceValue = parseNumber(price, "Harga");

      if (table === "traffic_nol" && trafficValue === null) {
        trafficValue = row.traffic ?? 0;
      }

      if (normalized !== row.domain) {
        const duplicate = await findDuplicateDomain(normalized, row.id);

        if (duplicate) {
          throw new Error(
            `Domain "${normalized}" sudah ada di tabel ${TABLE_META[duplicate].label}. Gunakan domain lain atau edit baris tersebut.`,
          );
        }
      }

      const patch: DomainPatch = {
        domain: normalized,
        dr: drValue,
        traffic: trafficValue,
        notes: notes.trim() ? notes.trim() : null,
        research_status: researchStatus,
      };

      if (detail) {
        patch.keyword = keyword.trim() ? keyword.trim() : null;
        patch.target_page = targetPage.trim() ? targetPage.trim() : null;
        patch.purchase_date = purchaseDate.trim() ? purchaseDate.trim() : null;
        patch.price = priceValue;
      }

      if (showSearchVolume) {
        patch.search_volume = parseNumber(searchVolume, "Search Volume");
      }

      await updateDomainRow(table, row.id, patch);

      await insertLog({
        domain: normalized,
        hasil: table,
        dr: drValue,
        traffic: trafficValue,
        pesan: "Data domain diedit manual",
      });
    },

    onSuccess: () => {
      toast.success("Perubahan disimpan");

      qc.invalidateQueries({ queryKey: ["table", table] });
      qc.invalidateQueries({ queryKey: ["domain-price-total", table] });
      qc.invalidateQueries({ queryKey: ["ringkasan"] });
      qc.invalidateQueries({ queryKey: ["logs"] });

      onOpenChange(false);
    },

    onError: (err: unknown) => {
      const message =
        err instanceof Error ? err.message : "Gagal menyimpan perubahan.";
      setError(message);
      toast.error(message);
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Domain</DialogTitle>

          <DialogDescription>
            Tabel asal: {TABLE_META[table].label} · Status: {row.status}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-domain">Domain</Label>

            <Input
              id="edit-domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="contoh.com"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-dr">DA / DR</Label>

              <Input
                id="edit-dr"
                inputMode="decimal"
                value={dr}
                onChange={(e) => setDr(e.target.value)}
                placeholder="0 - 100"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="edit-traffic">Organic Traffic</Label>

              <Input
                id="edit-traffic"
                inputMode="numeric"
                value={traffic}
                onChange={(e) => setTraffic(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Status Riset</Label>

            <Select
              value={researchStatus}
              onValueChange={(value) =>
                setResearchStatus(value as ResearchStatus)
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>

              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {detail && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="edit-keyword">Keyword</Label>

                <Input
                  id="edit-keyword"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="edit-target">Halaman Target</Label>

                <Input
                  id="edit-target"
                  value={targetPage}
                  onChange={(e) => setTargetPage(e.target.value)}
                  placeholder="https://arsjadrasjid.com/..."
                />
              </div>

              {showSearchVolume && (
                <div className="grid gap-2">
                  <Label htmlFor="edit-search-volume">Search Volume</Label>

                  <Input
                    id="edit-search-volume"
                    inputMode="numeric"
                    value={searchVolume}
                    onChange={(e) => setSearchVolume(e.target.value)}
                    placeholder="0"
                  />
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="edit-date">Tanggal Dibeli</Label>

                  <Input
                    id="edit-date"
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="edit-price">Harga (Rp)</Label>

                  <Input
                    id="edit-price"
                    inputMode="numeric"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
              </div>
            </>
          )}

          <div className="grid gap-2">
            <Label htmlFor="edit-notes">Catatan</Label>

            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={simpan.isPending}
          >
            Batal
          </Button>

          <Button
            onClick={() => {
              setError(null);
              simpan.mutate();
            }}
            disabled={simpan.isPending}
          >
            {simpan.isPending ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
