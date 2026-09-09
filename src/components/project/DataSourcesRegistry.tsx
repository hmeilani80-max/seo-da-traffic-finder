import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PlugZap } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DATA_SOURCE_CATALOG,
  SOURCE_STATUS,
  SOURCE_STATUS_LABEL,
  fetchProjectDataSources,
  upsertProjectDataSource,
} from "@/lib/data-sources";

export function DataSourcesRegistry({
  projectId,
  workspaceId,
}: {
  projectId: string;
  workspaceId: string;
}) {
  const qc = useQueryClient();
  const sources = useQuery({
    queryKey: ["project-data-sources", projectId],
    queryFn: () => fetchProjectDataSources(projectId),
  });

  const mutation = useMutation({
    mutationFn: (params: { sourceKey: string; status: string }) =>
      upsertProjectDataSource({ workspaceId, projectId, ...params }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project-data-sources", projectId] });
      toast.success("Status sumber data diperbarui");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal menyimpan"),
  });

  const byKey = new Map((sources.data ?? []).map((s) => [s.source_key, s]));

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-5 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold">Sumber Data &amp; Koneksi</h2>
        <p className="text-sm text-muted-foreground">
          Status di bawah dicatat manual oleh tim. Aplikasi belum melakukan koneksi OAuth otomatis,
          jadi pilih <strong>Bukti Manual</strong> bila data diperoleh lewat file/screenshot dari klien.
        </p>
      </header>

      <div className="grid gap-3 md:grid-cols-2">
        {DATA_SOURCE_CATALOG.map((source) => {
          const row = byKey.get(source.key);
          const status = row?.status ?? "not_connected";
          return (
            <div key={source.key} className="rounded-xl border border-border p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    <PlugZap className="size-4 text-muted-foreground" />
                    {source.label}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{source.description}</p>
                </div>
                <Badge variant="outline" className="shrink-0">
                  {source.availability === "connector_available"
                    ? "Konektor tersedia"
                    : "Belum didukung"}
                </Badge>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <Select
                  value={status}
                  onValueChange={(value) => mutation.mutate({ sourceKey: source.key, status: value })}
                >
                  <SelectTrigger className="w-52">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_STATUS.filter(
                      (s) => s !== "connected" || source.availability === "connector_available",
                    ).map((s) => (
                      <SelectItem key={s} value={s}>
                        {SOURCE_STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {row && (
                  <span className="text-xs text-muted-foreground">
                    diperbarui {new Date(row.updated_at).toLocaleDateString("id-ID")}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
