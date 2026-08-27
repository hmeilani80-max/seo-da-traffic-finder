import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { BacklinkSuggestionPanel } from "@/components/BacklinkSuggestionPanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { normalizeDomain, insertLog } from "@/lib/domains";

const kosong = {
  domain: "",
  dr: "",
  traffic: "",
  keyword: "",
  target_page: "",
  purchase_date: "",
  price: "",
  notes: "",
};

export function TambahDomainDibeli() {
  const qc = useQueryClient();
  const [form, setForm] = useState(kosong);

  const set = (k: keyof typeof kosong) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  const simpan = useMutation({
    mutationFn: async () => {
      const domain = normalizeDomain(form.domain);
      if (!domain) throw new Error("Domain wajib diisi");

      const { data: dupe, error: cekError } = await supabase
        .from("sudah_dibeli")
        .select("id")
        .ilike("domain", domain)
        .limit(1);
      if (cekError) throw cekError;
      if (dupe && dupe.length > 0) throw new Error(`${domain} sudah ada di tabel Sudah Dibeli`);

      const { error } = await supabase.from("sudah_dibeli").insert({
        domain,
        dr: form.dr === "" ? null : Number(form.dr),
        traffic: form.traffic === "" ? null : Number(form.traffic),
        keyword: form.keyword.trim() || null,
        target_page: form.target_page.trim() || null,
        purchase_date: form.purchase_date || null,
        price: form.price === "" ? null : Number(form.price),
        notes: form.notes.trim() || null,
        checked_at: new Date().toISOString(),
        status: "sudah_dibeli",
      });
      if (error) throw error;

      await insertLog({
        domain,
        hasil: "sudah_dibeli",
        dr: form.dr === "" ? null : Number(form.dr),
        traffic: form.traffic === "" ? null : Number(form.traffic),
        pesan: "Ditambahkan manual",
      });
      return domain;
    },
    onSuccess: (domain) => {
      toast.success(`${domain} ditambahkan ke Sudah Dibeli`);
      setForm(kosong);
      qc.invalidateQueries({ queryKey: ["table", "sudah_dibeli"] });
      qc.invalidateQueries({ queryKey: ["ringkasan"] });
      qc.invalidateQueries({ queryKey: ["logs"] });
    },
    onError: (e: Error) => toast.error(e.message || "Gagal menyimpan data"),
  });

  const F = ({
    id,
    label,
    type = "text",
    placeholder,
  }: {
    id: keyof typeof kosong;
    label: string;
    type?: string;
    placeholder?: string;
  }) => (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        value={form[id]}
        placeholder={placeholder}
        onChange={(e) => set(id)(e.target.value)}
      />
    </div>
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        simpan.mutate();
      }}
      className="rounded-xl border bg-card p-4 shadow-[var(--shadow-card)]"
    >
      <div className="mb-4">
        <h2 className="text-base font-semibold">Tambah Domain ke "Sudah Dibeli"</h2>
        <p className="text-sm text-muted-foreground">
          Input domain lalu gunakan saran OpenSEO untuk memilih keyword dan target page yang paling
          masuk akal. Semua field tetap bisa diubah manual sebelum disimpan.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <F id="domain" label="Domain" placeholder="contoh.com" />
        <F id="dr" label="DA / DR" type="number" placeholder="0" />
        <F id="traffic" label="Traffic" type="number" placeholder="0" />
        <F id="purchase_date" label="Tanggal Dibeli" type="date" />

        <BacklinkSuggestionPanel
          domain={form.domain}
          sourceDr={form.dr}
          onUse={(suggestion) =>
            setForm((current) => ({
              ...current,
              keyword: suggestion.keyword,
              target_page: suggestion.targetPage,
            }))
          }
        />

        <F id="keyword" label="Keyword / Anchor" placeholder="anchor text" />
        <F id="target_page" label="Halaman Target" placeholder="https://arsjadrasjid.com/..." />
        <F id="price" label="Harga (Rp)" type="number" placeholder="150000" />
        <div className="space-y-1.5">
          <Label htmlFor="notes">Catatan</Label>
          <Textarea
            id="notes"
            rows={1}
            value={form.notes}
            onChange={(e) => set("notes")(e.target.value)}
            placeholder="Opsional"
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Button type="submit" disabled={simpan.isPending}>
          <Plus className="size-4" />
          {simpan.isPending ? "Menyimpan..." : "Tambah Domain"}
        </Button>
      </div>
    </form>
  );
}
