import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { KeyRound, Save, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearApiKey, getApiKey, setApiKey } from "@/lib/domains";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Pengaturan Ahrefs API — Dashboard Riset Backlink" },
      {
        name: "description",
        content: "Simpan Ahrefs API Key untuk riset otomatis Domain Rating dan organic traffic.",
      },
      { property: "og:title", content: "Pengaturan Ahrefs API — Dashboard Riset Backlink" },
      {
        property: "og:description",
        content: "Kelola kredensial Ahrefs API yang dipakai untuk riset domain backlink.",
      },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [key, setKey] = useState("");

  useEffect(() => {
    setKey(getApiKey());
  }, []);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-sm text-muted-foreground">
          Kredensial Ahrefs untuk riset DR &amp; organic traffic domain.
        </p>
      </header>

      <div className="rounded-xl border bg-card p-6 shadow-[var(--shadow-card)]">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
          <KeyRound className="size-4 text-primary" /> Ahrefs API Key
        </div>
        <Label htmlFor="apikey">API Key</Label>
        <Input
          id="apikey"
          type="password"
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Tempel Ahrefs API token di sini"
          className="mt-1.5 font-mono"
        />
        <p className="mt-2 text-xs text-muted-foreground">
          Key disimpan hanya di browser ini (local storage) dan dikirim langsung ke Ahrefs saat
          pengecekan — tidak disimpan di database.
        </p>
        <div className="mt-4 flex gap-2">
          <Button
            onClick={() => {
              setApiKey(key.trim());
              toast.success("API Key tersimpan");
            }}
          >
            <Save className="size-4" /> Simpan
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              clearApiKey();
              setKey("");
              toast.info("API Key dihapus");
            }}
          >
            <Trash2 className="size-4" /> Hapus
          </Button>
        </div>
      </div>
    </div>
  );
}
