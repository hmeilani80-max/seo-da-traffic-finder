import { createFileRoute } from "@tanstack/react-router";

import { SearchVolumeBulkUpdater } from "@/components/SearchVolumeBulkUpdater";

export const Route = createFileRoute("/_authenticated/test-search-volume")({
  head: () => ({
    meta: [
      { title: "Test Search Volume Apify" },
      {
        name: "description",
        content: "Test satu keyword dari tabel Sudah Dibeli menggunakan Apify tanpa menyimpan hasil.",
      },
    ],
  }),
  component: TestSearchVolumePage,
});

function TestSearchVolumePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-4 px-4 py-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Test Search Volume Apify</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mengetes satu row Sudah Dibeli menggunakan actor burbn/ahrefs-keyword-explorer.
          Hasil test tidak ditulis ke database.
        </p>
      </div>

      <SearchVolumeBulkUpdater />
    </div>
  );
}
