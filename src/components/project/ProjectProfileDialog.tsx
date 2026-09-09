import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, PencilLine } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { updateProjectProfile, type ProjectFull } from "@/lib/project-profile";

function toList(value: string) {
  return value
    .split(/[,\n;]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

/**
 * Pengisian profil proyek bersifat progresif: tidak ada field wajib selain nama.
 * Nilai yang disimpan di sini adalah nilai otoritatif hasil keputusan manusia.
 */
export function ProjectProfileDialog({ project }: { project: ProjectFull }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: project.name,
    client_domain: project.client_domain ?? "",
    industry: project.industry ?? "",
    objectives: project.objectives.join(", "),
    target_market: project.target_market ?? "",
    current_problem: project.current_problem ?? "",
    contact_person: project.contact_person ?? "",
    budget_indication: project.budget_indication ?? "",
    competitors: project.competitors.join(", "),
    discovery_notes: project.discovery_notes ?? "",
  });

  const mutation = useMutation({
    mutationFn: () =>
      updateProjectProfile(project.id, {
        name: form.name,
        client_domain: form.client_domain || null,
        industry: form.industry || null,
        objectives: toList(form.objectives),
        target_market: form.target_market || null,
        current_problem: form.current_problem || null,
        contact_person: form.contact_person || null,
        budget_indication: form.budget_indication || null,
        competitors: toList(form.competitors),
        discovery_notes: form.discovery_notes || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["project", project.id] });
      qc.invalidateQueries({ queryKey: ["projects-full"] });
      setOpen(false);
      toast.success("Profil proyek diperbarui");
    },
    onError: (e: unknown) => toast.error(e instanceof Error ? e.message : "Gagal menyimpan"),
  });

  const field = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <PencilLine className="mr-2 size-4" /> Lengkapi Profil
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Profil Proyek</DialogTitle>
          <DialogDescription>
            Semua field opsional kecuali nama. Isi bertahap sesuai informasi yang tersedia.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="pf-name">Nama Proyek / Klien</Label>
            <Input id="pf-name" {...field("name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-domain">Website Utama</Label>
            <Input id="pf-domain" placeholder="contoh.com" {...field("client_domain")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-industry">Industri</Label>
            <Input id="pf-industry" placeholder="Kesehatan, Fintech, …" {...field("industry")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-market">Target Market</Label>
            <Input id="pf-market" placeholder="Indonesia, B2B" {...field("target_market")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pf-obj">Objective (pisahkan dengan koma)</Label>
            <Input id="pf-obj" placeholder="Lead Generation, Brand Awareness" {...field("objectives")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pf-problem">Masalah / Pain Point Saat Ini</Label>
            <Textarea id="pf-problem" rows={2} {...field("current_problem")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-contact">Kontak Person</Label>
            <Input id="pf-contact" {...field("contact_person")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="pf-budget">Indikasi Budget</Label>
            <Input id="pf-budget" placeholder="Rp 15–25 juta/bulan" {...field("budget_indication")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pf-comp">Kompetitor (pisahkan dengan koma)</Label>
            <Input id="pf-comp" {...field("competitors")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="pf-notes">Catatan Discovery</Label>
            <Textarea id="pf-notes" rows={3} {...field("discovery_notes")} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Batal
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending}>
            {mutation.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
