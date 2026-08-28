import { useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  ArrowUpDown,
  Download,
  Pencil,
  Sparkles,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { BacklinkSuggestionDialog } from "@/components/BacklinkSuggestionDialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EditDomainDialog } from "@/components/EditDomainDialog";

import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  deleteRow,
  downloadCSV,
  fetchDomainPriceTotal,
  fetchTable,
  TABLE_META,
  toCSV,
  type DomainRow,
  type TableKey,
} from "@/lib/domains";

type SortKey =
  | "domain"
  | "dr"
  | "traffic"
  | "checked_at";

export function DomainTable({
  table,
  searchQuery = "",
}: {
  table: TableKey;
  searchQuery?: string;
}) {
  const qc = useQueryClient();

  const [editRow, setEditRow] =
    useState<DomainRow | null>(null);

  const [
    suggestionRow,
    setSuggestionRow,
  ] =
    useState<DomainRow | null>(null);

  const [sortKey, setSortKey] =
    useState<SortKey>("checked_at");

  const [asc, setAsc] =
    useState(false);

  const detail =
    table !== "traffic_nol";

  const {
    data = [],
    isLoading,
  } = useQuery({
    queryKey: ["table", table],
    queryFn: () =>
      fetchTable(table),
  });

  const {
    data: priceTotal,
  } = useQuery({
    queryKey: [
      "domain-price-total",
      table,
    ],

    queryFn: () =>
      fetchDomainPriceTotal(
        table as
          | "sudah_dibeli"
          | "domain_sudah_pernah",
      ),

    enabled: detail,
  });

  const hapus =
    useMutation({
      mutationFn: (
        id: string,
      ) =>
        deleteRow(
          table,
          id,
        ),

      onSuccess: () => {
        toast.success(
          "Baris dihapus",
        );

        qc.invalidateQueries({
          queryKey: [
            "table",
            table,
          ],
        });

        qc.invalidateQueries({
          queryKey: [
            "domain-price-total",
            table,
          ],
        });

        qc.invalidateQueries({
          queryKey: [
            "ringkasan",
          ],
        });
      },

      onError: () => {
        toast.error(
          "Gagal menghapus baris",
        );
      },
    });

  /**
   * Search universal.
   *
   * Search akan mencocokkan:
   * - Domain
   * - Keyword
   * - Halaman Target
   * - Status
   * - Status Riset
   * - Catatan
   * - DA / DR
   * - Traffic
   * - Harga
   * - Tanggal
   */
  const rows =
    useMemo(() => {
      const term =
        searchQuery
          .trim()
          .toLowerCase();

      const filtered =
        data.filter(
          (
            r: DomainRow,
          ) => {
            if (!term) {
              return true;
            }

            const searchableValues =
              [
                r.domain,
                r.keyword,
                r.target_page,
                r.status,
                r.research_status,
                r.notes,
                r.dr,
                r.traffic,
                r.price,
                r.checked_at,
                r.purchase_date,
              ];

            const searchableText =
              searchableValues
                .filter(
                  (
                    value,
                  ) =>
                    value !==
                      null &&
                    value !==
                      undefined &&
                    value !==
                      "",
                )
                .map(
                  (
                    value,
                  ) =>
                    String(
                      value,
                    ),
                )
                .join(" ")
                .toLowerCase();

            return searchableText.includes(
              term,
            );
          },
        );

      return [
        ...filtered,
      ].sort(
        (a, b) => {
          const va =
            a[sortKey] ??
            "";

          const vb =
            b[sortKey] ??
            "";

          if (
            typeof va ===
              "number" &&
            typeof vb ===
              "number"
          ) {
            return asc
              ? va - vb
              : vb - va;
          }

          return asc
            ? String(
                va,
              ).localeCompare(
                String(
                  vb,
                ),
              )
            : String(
                vb,
              ).localeCompare(
                String(
                  va,
                ),
              );
        },
      );
    }, [
      data,
      searchQuery,
      sortKey,
      asc,
    ]);

  function sortBy(
    key: SortKey,
  ) {
    if (
      key === sortKey
    ) {
      setAsc(
        (
          value,
        ) =>
          !value,
      );

      return;
    }

    setSortKey(key);
    setAsc(true);
  }

  const Th = ({
    label,
    k,
  }: {
    label: string;
    k: SortKey;
  }) => (
    <TableHead>
      <button
        type="button"
        onClick={() =>
          sortBy(k)
        }
        className="inline-flex items-center gap-1 font-medium hover:text-primary"
      >
        {label}

        <ArrowUpDown className="size-3.5 opacity-60" />
      </button>
    </TableHead>
  );

  function ResearchStatus({
    row,
  }: {
    row: DomainRow;
  }) {
    const status =
      row.research_status ??
      (
        row.dr != null ||
        row.traffic !=
          null
          ? "selesai"
          : "belum_diriset"
      );

    const labels = {
      belum_diriset:
        "Belum diriset",

      sedang_diriset:
        "Sedang diriset",

      selesai:
        "Selesai",

      gagal:
        "Gagal",
    } as const;

    return (
      <Badge
        variant={
          status ===
          "gagal"
            ? "destructive"
            : status ===
                "selesai"
              ? "default"
              : "secondary"
        }
      >
        {labels[status]}
      </Badge>
    );
  }

  const formatCurrency = (
    value: number,
  ) =>
    new Intl.NumberFormat(
      "id-ID",
      {
        style:
          "currency",

        currency:
          "IDR",

        maximumFractionDigits:
          0,
      },
    ).format(value);

  const searchActive =
    searchQuery
      .trim()
      .length > 0;

  return (
    <div className="rounded-xl border bg-card shadow-[var(--shadow-card)]">
      {/* HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
        <div>
          <h2 className="text-base font-semibold">
            {
              TABLE_META[
                table
              ].label
            }
          </h2>

          <p className="text-sm text-muted-foreground">
            {
              TABLE_META[
                table
              ].deskripsi
            }
          </p>

          {searchActive && (
            <p className="mt-1 text-xs text-primary">
              Menampilkan
              hasil untuk:{" "}

              <span className="font-medium">
                {
                  searchQuery
                }
              </span>

              {" · "}

              {
                rows.length
              }{" "}
              hasil
            </p>
          )}
        </div>

        <Button
          variant="outline"
          onClick={() => {
            if (
              rows.length ===
              0
            ) {
              toast.info(
                "Tidak ada data untuk diekspor",
              );

              return;
            }

            downloadCSV(
              `${table}-${Date.now()}.csv`,
              toCSV(rows),
            );
          }}
        >
          <Download className="size-4" />

          Export CSV
        </Button>
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <Th
                label="Domain"
                k="domain"
              />

              <Th
                label="DA / DR"
                k="dr"
              />

              <Th
                label="Traffic"
                k="traffic"
              />

              <TableHead>
                Status Riset
              </TableHead>

              <Th
                label="Tanggal Dicek"
                k="checked_at"
              />

              {detail && (
                <>
                  <TableHead>
                    Keyword
                  </TableHead>

                  <TableHead>
                    Halaman
                    Target
                  </TableHead>

                  <TableHead>
                    Tgl. Dibeli
                  </TableHead>

                  <TableHead>
                    Harga
                  </TableHead>
                </>
              )}

              <TableHead>
                Catatan
              </TableHead>

              <TableHead className="text-right">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell
                  colSpan={
                    detail
                      ? 11
                      : 7
                  }
                  className="py-10 text-center text-muted-foreground"
                >
                  Memuat
                  data...
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              rows.length ===
                0 && (
                <TableRow>
                  <TableCell
                    colSpan={
                      detail
                        ? 11
                        : 7
                    }
                    className="py-10 text-center text-muted-foreground"
                  >
                    {searchActive
                      ? "Tidak ada data yang cocok dengan pencarian."
                      : "Belum ada data pada tabel ini."}
                  </TableCell>
                </TableRow>
              )}

            {rows.map(
              (r) => (
                <TableRow
                  key={r.id}
                >
                  {/* DOMAIN */}
                  <TableCell className="font-medium">
                    {
                      r.domain
                    }
                  </TableCell>

                  {/* DR */}
                  <TableCell>
                    {r.dr ??
                      "-"}
                  </TableCell>

                  {/* TRAFFIC */}
                  <TableCell>
                    {r.traffic ??
                      "-"}
                  </TableCell>

                  {/* RESEARCH STATUS */}
                  <TableCell>
                    <ResearchStatus
                      row={r}
                    />
                  </TableCell>

                  {/* CHECK DATE */}
                  <TableCell className="text-muted-foreground">
                    {new Date(
                      r.checked_at,
                    ).toLocaleString(
                      "id-ID",
                    )}
                  </TableCell>

                  {/* DETAIL FIELDS */}
                  {detail && (
                    <>
                      {/* KEYWORD */}
                      <TableCell className="max-w-[220px] truncate">
                        {r.keyword ||
                          "-"}
                      </TableCell>

                      {/* TARGET PAGE */}
                      <TableCell className="max-w-[260px] truncate">
                        {r.target_page ? (
                          <a
                            href={
                              r.target_page
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline"
                          >
                            {r.target_page.replace(
                              /^https?:\/\/(www\.)?arsjadrasjid\.com/,
                              "",
                            ) ||
                              "/"}
                          </a>
                        ) : (
                          "-"
                        )}
                      </TableCell>

                      {/* PURCHASE DATE */}
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {r.purchase_date
                          ? new Date(
                              r.purchase_date,
                            ).toLocaleDateString(
                              "id-ID",
                            )
                          : "-"}
                      </TableCell>

                      {/* PRICE */}
                      <TableCell className="whitespace-nowrap">
                        {r.price !=
                        null
                          ? formatCurrency(
                              Number(
                                r.price,
                              ),
                            )
                          : "-"}
                      </TableCell>
                    </>
                  )}

                  {/* NOTES */}
                  <TableCell className="max-w-[240px] truncate text-muted-foreground">
                    {r.notes ??
                      "-"}
                  </TableCell>

                  {/* ACTIONS */}
                  <TableCell className="text-right">
                    <div className="inline-flex items-center">
                      {table ===
                        "sudah_dibeli" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            setSuggestionRow(
                              r,
                            )
                          }
                          aria-label={`Cari saran backlink ${r.domain}`}
                          title="Cari Saran Backlink"
                        >
                          <Sparkles className="size-4 text-primary" />
                        </Button>
                      )}

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditRow(
                            r,
                          )
                        }
                        aria-label={`Edit ${r.domain}`}
                        title="Edit"
                      >
                        <Pencil className="size-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          hapus.mutate(
                            r.id,
                          )
                        }
                        aria-label={`Hapus ${r.domain}`}
                        title="Hapus"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ),
            )}
          </TableBody>

          {/* TOTAL PRICE */}
          {detail && (
            <TableFooter>
              <TableRow className="font-semibold">
                <TableCell
                  colSpan={8}
                  className="text-right"
                >
                  TOTAL
                  HARGA
                </TableCell>

                <TableCell>
                  {formatCurrency(
                    Number(
                      priceTotal
                        ?.total_price ??
                        0,
                    ),
                  )}
                </TableCell>

                <TableCell
                  colSpan={
                    2
                  }
                />
              </TableRow>
            </TableFooter>
          )}
        </Table>
      </div>

      {/* EDIT DIALOG */}
      {editRow && (
        <EditDomainDialog
          table={table}
          row={editRow}
          open={
            editRow !==
            null
          }
          onOpenChange={(
            open,
          ) => {
            if (!open) {
              setEditRow(
                null,
              );
            }
          }}
        />
      )}

      {/* BACKLINK SUGGESTION DIALOG */}
      {suggestionRow &&
        table ===
          "sudah_dibeli" && (
          <BacklinkSuggestionDialog
            row={
              suggestionRow
            }
            open={
              suggestionRow !==
              null
            }
            onOpenChange={(
              open,
            ) => {
              if (
                !open
              ) {
                setSuggestionRow(
                  null,
                );
              }
            }}
          />
        )}
    </div>
  );
}
