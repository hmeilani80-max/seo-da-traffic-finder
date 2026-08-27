import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if (!sessionStorage.getItem("claimed")) {
      sessionStorage.setItem("claimed", "1");
      await supabase.rpc("claim_unowned_rows");
    }
    return { user: data.user };

  },
  component: () => <Outlet />,
});
