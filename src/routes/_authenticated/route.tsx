import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { AppSidebar } from "@/components/AppSidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (error || !data.session?.user) {
          setIsAuthenticated(false);
          setAuthChecked(true);
          navigate({ to: "/auth", replace: true });
          return;
        }

        setIsAuthenticated(true);
        setAuthChecked(true);

      } catch {
        if (isMounted) {
          setIsAuthenticated(false);
          setAuthChecked(true);
          navigate({ to: "/auth", replace: true });
        }
      }
    }

    void checkAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === "SIGNED_OUT" || !session?.user) {
        setIsAuthenticated(false);
        navigate({ to: "/auth", replace: true });
      } else if (session?.user) {
        setIsAuthenticated(true);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  if (!authChecked || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <AppSidebar>
      <Outlet />
    </AppSidebar>
  );
}
