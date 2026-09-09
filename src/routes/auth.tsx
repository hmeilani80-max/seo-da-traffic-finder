import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Masuk — SEO Operating System" },
      {
        name: "description",
        content: "Masuk ke workspace internal SEO Operating System.",
      },
      { property: "og:title", content: "Masuk — SEO Operating System" },
      {
        property: "og:description",
        content: "Akses internal untuk SEO Specialist dan tim operasional SEO.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (isMounted && data.session) {
        navigate({ to: "/", replace: true });
      }
    });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal masuk");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="mb-2 flex items-center gap-2">
            <span className="grid size-10 place-items-center rounded-xl bg-brand-teal text-sm font-bold text-brand-teal-foreground">
              SO
            </span>
            <div>
              <p className="text-sm font-semibold">SEO Operating System</p>
              <p className="text-xs text-muted-foreground">Internal Workspace</p>
            </div>
          </div>
          <CardTitle>Masuk</CardTitle>
          <CardDescription>
            Platform ini hanya untuk SEO Specialist dan tim internal yang memiliki akun.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Kata Sandi</Label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 size-4 animate-spin" />}
              Masuk
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-muted-foreground">
            Membutuhkan akun? Hubungi admin internal untuk provisioning akses.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
