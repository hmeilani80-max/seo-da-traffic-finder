import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, Check, Loader2, Minus, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { researchDomainViaApify } from "@/lib/apify-research.functions";
import {
  TABLE_META,
  findExistingRow,
  insertLog,
  insertResearchedRow,
  normalizeDomain,
  saveSearchQuery,
  type DomainRow,
  type TableKey,
} from "@/lib/domains";

type StepState = "pending" | "aktif" | "sukses" | "gagal" | "skip";

type Steps = {
  cek: StepState;
  riset: StepState;
  simpan: StepState;
  selesai: StepState;
};

const INITIAL_STEPS: Steps = {
  cek: "pending",
  riset: "pending",
  simpan: "pending",
  selesai: "pending",
};

const STEP_LABELS: Array<{ key: keyof Steps; label: string }> = [
  { key: "cek", label: "1 Cek Database" },
  { key: "riset", label: "2 Riset via Apify" },
  { key: "simpan", label: "3 Simpan Database" },
  { key: "selesai", label: "4 Selesai" },
];

type HasilPencarian = {
  domain: string;
  dr: number | null;
  traffic: number | null;
  status: "Ditemukan di Database" | "Riset Baru Selesai";
  lokasi: TableKey;
  checkedAt: string;
};

function StepIcon({ state }: { state: StepState }) {
  if (state === "aktif") return <Loader2 className="size-3.5 animate-spin" />;
  if (state === "sukses") return <Check className="size-3.5" />;
  if (state === "gagal") return <AlertCircle className="size-3.5" />;
  if (state === "skip") return <Minus className="size-3.5" />;
  return <span className="size-1.5 rounded-full bg-current opacity-50" />;
}

function stepClass(state: StepState) {
  switch (state) {
    case "aktif":
      return "border-primary/40 bg-primary/10 text-primary";
    case "sukses":
      return "border-primary/30 bg-primary/5 text-primary";
    case "gagal":
      return "border-destructive/40 bg-destructive/10 text-destructive";
    case "skip":
      return "border-muted bg-muted/40 text-muted-foreground";
    default:
      return "border-muted bg-background text-muted-foreground";
  }
}

export function DomainSearchResearch({
  searchQuery,
  onSearchQueryChange,
  onFound,
}: {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
  onFound: (table: TableKey) => void;
}) {
  const qc = useQueryClient();
  const runResearch = useServerFn(researchDomainViaApify);

  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Steps>(INITIAL_STEPS);
  const [hasil, setHasil] = useState<HasilPencarian | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function refreshAll(table?: TableKey) {
    if (table) {
      qc.invalidateQueries({ queryKey: ["table", table] });
      qc.invalidateQueries({ queryKey: ["domain-price-total", table] });
    }
    qc.invalidateQueries({ queryKey: ["ringkasan"] });
    qc.invalidateQueries({ queryKey: ["logs"] });
    qc.invalidateQueries({ queryKey: ["search-history"] });
  }

  async function handleSubmit() {
    const domain = normalizeDomain(searchQuery);

    if (!domain || !domain.includes(".")) {
      toast.error("Masukkan domain yang valid, contoh: contoh.com");
      return;
    }

    setRunning(true);
    setHasil(null);
    setErrorMsg(null);
    setSteps({ ...INITIAL_STEPS, cek: "aktif" });

    try {
      await saveSearchQuery(domain);

      // STEP 1 — cek database
      const existing = await findExistingRow(domain);

      if (existing) {
        setSteps({ cek: "sukses", riset: "skip", simpan: "skip", selesai: "sukses" });
        const row = existing.row as DomainRow;
        setHasil({
          domain: row.domain,
          dr: row.dr,
          traffic: row.traffic,
          status: "Ditemukan di Database",
          lokasi: existing.table,
          checkedAt: row.checked_at,
        });
        onSearchQueryChange(row.domain);
        onFound(existing.table);
        await insertLog({
          domain,
          hasil: "ditemukan_di_database",
          dr: row.dr,
          traffic: row.traffic,
          pesan: `Sudah ada di tabel ${TABLE_META[existing.table].label}`,
        });
        refreshAll(existing.table);
        toast.info("Domain sudah ada di database — Apify tidak dijalankan");
        return;
      }

      // STEP 2 — riset Apify
      setSteps((s) => ({ ...s, cek: "sukses", riset: "aktif" }));
      const research = await runResearch({ data: { domain } });

      if (research.error) {
        setSteps((s) => ({ ...s, riset: "gagal", simpan: "skip", selesai: "gagal" }));
        setErrorMsg(research.error);
        await insertLog({
          domain,
          hasil: "gagal_riset",
          dr: null,
          traffic: null,
          pesan: research.error,
        });
        refreshAll();
        toast.error("Riset Apify gagal");
        return;
      }

      // STEP 3 — simpan
      setSteps((s) => ({ ...s, riset: "sukses", simpan: "aktif" }));
      const target: TableKey = (research.traffic ?? 0) > 0 ? "sudah_dibeli" : "traffic_nol";
      const checkedAt = new Date().toISOString();

      await insertResearchedRow(target, {
        domain,
        dr: research.dr,
        traffic: research.traffic ?? 0,
        checked_at: checkedAt,
      });

      await insertLog({
        domain,
        hasil: target,
        dr: research.dr,
        traffic: research.traffic,
        pesan: `Riset Apify selesai — dirutekan ke ${TABLE_META[target].label}`,
      });

      setSteps({ cek: "sukses", riset: "sukses", simpan: "sukses", selesai: "sukses" });
      setHasil({
        domain,
        dr: research.dr,
        traffic: research.traffic,
        status: "Riset Baru Selesai",
        lokasi: target,
        checkedAt,
      });
      onSearchQueryChange(domain);
      onFound(target);
      refreshAll(target);
      toast.success(`Domain disimpan ke ${TABLE_META[target].label}`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Terjadi kesalahan tak terduga";
      setSteps((s) => ({
        ...s,
        cek: s.cek === "aktif" ? "gagal" : s.cek,
        riset: s.riset === "aktif" ? "gagal" : s.riset,
        simpan: s.simpan === "aktif" ? "gagal" : s.simpan,
        selesai: "gagal",
      }));
      setErrorMsg(message);
      toast.error(message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="mb-4 rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-semibold">Cari &amp; Riset Domain</h2>
        <p className="text-sm text-muted-foreground">
          Cek satu domain ke database. Jika belum pernah ada, sistem otomatis riset DA/DR &amp;
          organic traffic lewat Apify lalu menyimpannya ke tabel yang sesuai.
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !running) {
                e.preventDefault();
                void handleSubmit();
              }
            }}
            placeholder="contoh.com atau https://contoh.com/halaman"
            className="pl-8"
            aria-label="Domain yang ingin dicari dan diriset"
          />
        </div>

        <Button onClick={() => void handleSubmit()} disabled={running} className="sm:w-auto">
          {running ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          {running ? "Memproses..." : "Cari & Riset"}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {STEP_LABELS.map(({ key, label }) => (
          <div
            key={key}
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-medium ${stepClass(steps[key])}`}
          >
            <StepIcon state={steps[key]} />
            {label}
            {steps[key] === "skip" && (
              <span className="opacity-70">· Tidak diperlukan</span>
            )}
          </div>
        ))}
      </div>

      {errorMsg && (
        <div className="mt-3 flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <div>
            <p className="font-medium">Riset gagal — tidak ada data yang disimpan.</p>
            <p className="mt-0.5 opacity-90">{errorMsg}</p>
          </div>
        </div>
      )}

      {hasil && (
        <div className="mt-3 grid gap-3 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-3 lg:grid-cols-6">
          <div>
            <p className="text-xs text-muted-foreground">Domain</p>
            <p className="font-medium">{hasil.domain}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">DA / DR</p>
            <p className="font-medium">{hasil.dr ?? "—"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Organic Traffic</p>
            <p className="font-medium">
              {hasil.traffic != null ? hasil.traffic.toLocaleString("id-ID") : "—"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant={hasil.status === "Riset Baru Selesai" ? "default" : "secondary"}>
              {hasil.status}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Lokasi Data</p>
            <p className="font-medium">{TABLE_META[hasil.lokasi].label}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Waktu Pengecekan</p>
            <p className="font-medium">
              {new Date(hasil.checkedAt).toLocaleString("id-ID")}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
