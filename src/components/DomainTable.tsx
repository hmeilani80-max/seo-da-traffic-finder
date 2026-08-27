import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowUpDown, Download, Trash2, Search } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deleteRow,
  downloadCSV,
  fetchTable,
  TABLE_META,
  toCSV,
  type DomainRow,
  type TableKey,
} from "@/lib/domains";

type SortKey = "domain" | "dr" | "traffic" | "checked_at";

export function DomainTable({ table }: { table: TableKey }) {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("checked_at");
  const [asc, setAsc] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["table", table],
    queryFn: () => fetchTable(table),
  });

  const hapus = useMutation({
    mutationFn: (id: string) => deleteRow(table, id),
    onSuccess: () => {
      toast.success("Baris dihapus");
      qc.invalidateQueries({ queryKey: ["table", table] });
      qc.invalidateQueries({ queryKey: ["ringkasan"] });
    },
    onError: () => toast.error("Gagal menghapus baris"),
  });

  const detail = table === "domain_sudah_pernah";

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const filtered = data.filter(
      (r: DomainRow) =>
        r.domain.toLowerCase().includes(term) ||
        (r.keyword ?? "").toLowerCase().includes(term) ||
        (r.target_page ?? "").toLowerCase().includes(term),
    );
    const sorted = [...filtered].sort((a, b) => {
      const va = a[sortKey] ?? "";
      const vb = b[sortKey] ?? "";
      if (typeof va === "number" && typeof vb === "number") return asc ? va - vb : vb - va;
      return asc
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va));
    });
    return sorted;
  }, [data, q, sortKey, asc]);

  function sortBy(key: SortKey) {
    if (key === sortKey) setAsc((v) => !v);
    else {
      setSortKey(key);
      setAsc(true);
    }
  }

  const Th = ({ label, k }: { label: string; k: SortKey }) => (
    <TableHead>
      <button
        onClick={() => sortBy(k)}
        className="inline-flex items-center gap-1 font-medium hover:text-primary"
      >
        {label}
        <ArrowUpDown className="size-3.5 opacity-60" />
      </button>
    </TableHead>
  );

  return (
    <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-base font-semibold">{TABLE_META[table].label}</h2>
          <p className="text-sm text-muted-foreground">{TABLE_META[table].deskripsi}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari domain..."
              className="w-56 pl-8"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => {
              if (rows.length === 0) {
                toast.info("Tidak ada data untuk diekspor");
                return;
              }
              downloadCSV(`${table}-${Date.now()}.csv`, toCSV(rows));
            }}

          >
            <Download className="size-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <Th label="Domain" k="domain" />
              <Th label="DA / DR" k="dr" />
              <Th label="Traffic" k="traffic" />
              <Th label="Tanggal Dicek" k="checked_at" />
              <TableHead>Catatan</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Memuat data...
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  Belum ada data pada tabel ini.
                </TableCell>
              </TableRow>
            )}
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.domain}</TableCell>
                <TableCell>{r.dr ?? "-"}</TableCell>
                <TableCell>{r.traffic ?? "-"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(r.checked_at).toLocaleString("id-ID")}
                </TableCell>
                <TableCell className="max-w-[240px] truncate text-muted-foreground">
                  {r.notes ?? "-"}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => hapus.mutate(r.id)}
                    aria-label={`Hapus ${r.domain}`}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
