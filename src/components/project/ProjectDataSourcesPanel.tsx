import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DATA_SOURCE_STATUS,
  DATA_SOURCE_STATUS_LABEL,
  PROJECT_DATA_SOURCE_CATALOG,
  upsertProjectDataSource,
  type ProjectDataSourceRow,
} from "@/lib/project-workspace";
import type { ProjectRow } from "@/lib/projects";

export function ProjectDataSourcesPanel({
  project,
  rows,
  loading,
  onSaved,
}: {
  project: ProjectRow;
  rows: ProjectDataSourceRow[];
  loading: boolean;
  onSaved: () => void;
}) {
  if (loading) {
    return <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Memuat data source…</div>;
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Data Source Registry</h2>
        <p className="text-sm text-muted-foreground">
          Registry mencatat kesiapan/akses Project. Status tidak berarti API sync kecuali integrasinya memang sudah tersedia.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {PROJECT_DATA_SOURCE_CATALOG.map((source) => (
          <DataSourceCard
            key={source.key}
            project={project}
            source={source}
            row={rows.find((item) => item.source_key === source.key)}
            onSaved={onSaved}
          />
        ))}
      </div>
    </div>
  );
}

function DataSourceCard({
  project,
  source,
  row,
  onSaved,
}: {
  project: ProjectRow;
  source: (typeof PROJECT_DATA_SOURCE_CATALOG)[number];
  row?: ProjectDataSourceRow;
  onSaved: () => void;
}) {
  const [status, setStatus] = useState(row?.status ?? "not_connected");
  const [notes, setNotes] = useState(row?.notes ?? "");

  useEffect(() => {
    setStatus(row?.status ?? "not_connected");
    setNotes(row?.notes ?? "");
  }, [row]);

  const save = useMutation({
    mutationFn: () => upsertProjectDataSource(project, { sourceKey: source.key, status, notes }),
    onSuccess: () => {
      toast.success(`${source.label} diperbarui`);
      onSaved();
    },
    onError: (error: unknown) =>
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan data source"),
  });

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base">{source.label}</CardTitle>
            <CardDescription>{source.category}</CardDescription>
          </div>
          <Badge variant="secondary">{DATA_SOURCE_STATUS_LABEL[status] ?? status}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{source.note}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {DATA_SOURCE_STATUS.map((value) => (
              <SelectItem key={value} value={value}>{DATA_SOURCE_STATUS_LABEL[value]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Account/property/access notes. Jangan simpan password atau secret."
        />
        <Button size="sm" variant="outline" onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          Simpan Registry
        </Button>
      </CardContent>
    </Card>
  );
}
