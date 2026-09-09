import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, LogOut, ShieldAlert } from "lucide-react";

import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { joinDefaultWorkspace } from "@/lib/workspace.functions";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [denied, setDenied] = useState(false);
  const navigate = useNavigate();
  const ensureWorkspace = useServerFn(joinDefaultWorkspace);

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error || !data.session?.user) {
          setChecking(false);
          setAllowed(false);
          navigate({ to: "/auth", replace: true });
          return;
        }

        // Internal-only gate. Existing authorized users are already backfilled by
        // migration. If the workspace has no member yet, only the oldest existing
        // Auth account may bootstrap the first admin membership.
        const membership = await ensureWorkspace();
        if (!isMounted) return;

        if (!membership) {
          setAllowed(false);
          setDenied(true);
          setChecking(false);
          return;
        }

        setAllowed(true);
        setDenied(false);
        setChecking(false);
      } catch {
        if (isMounted) {
          setAllowed(false);
          setDenied(true);
          setChecking(false);
        }
      }
    }

    void checkAccess();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT" || !session?.user) {
        setAllowed(false);
        setDenied(false);
        navigate({ to: "/auth", replace: true });
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [ensureWorkspace, navigate]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (denied || !allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
          <ShieldAlert className="mx-auto size-9 text-muted-foreground" />
          <h1 className="mt-3 text-lg font-semibold">Akses workspace belum diberikan</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Akun berhasil login, tetapi belum terdaftar sebagai anggota aktif workspace SEO internal.
            Hubungi admin internal untuk provisioning akses.
          </p>
          <Button
            variant="outline"
            className="mt-5"
            onClick={async () => {
              await supabase.auth.signOut();
              navigate({ to: "/auth", replace: true });
            }}
          >
            <LogOut className="mr-2 size-4" /> Keluar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <AppSidebar>
      <Outlet />
    </AppSidebar>
  );
}
