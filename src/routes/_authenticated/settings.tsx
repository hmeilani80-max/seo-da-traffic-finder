import { createFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Info, Server } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan Riset Domain — Dashboard Riset Backlink" },
      {
        name: "description",
        content:
          "Informasi integrasi Apify yang dipakai untuk riset Domain Rating dan organic traffic domain backlink.",
      },
      { property: "og:title", content: "Pengaturan Riset Domain — Dashboard Riset Backlink" },
      {
        property: "og:description",
        content: "Status integrasi Apify untuk riset DR dan organic traffic domain.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Sumber data riset DA/DR &amp; organic traffic domain.
        </p>
      </header>

      <div className="rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
          <Server className="size-4 text-primary" /> Integrasi Apify (Ahrefs Scraper)
        </div>

        <p className="text-sm text-muted-foreground">
          Riset domain kini memakai Apify Actor{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            radeance/ahrefs-scraper
          </code>{" "}
          yang dijalankan sepenuhnya di sisi server. Tidak ada API key yang disimpan di browser.
        </p>

        <div className="mt-4 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-sm">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-primary" />
          <span>
            Kredensial Apify dikelola lewat connector workspace dan hanya dapat diakses oleh
            server. Tidak ada konfigurasi yang perlu diisi di halaman ini.
          </span>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          <Info className="mt-0.5 size-4 shrink-0" />
          <span>
            Jika riset gagal dengan pesan koneksi Apify belum tersedia, hubungkan kembali
            connector Apify melalui Project Settings → Connectors.
          </span>
        </div>
      </div>
    </div>
  );
}
