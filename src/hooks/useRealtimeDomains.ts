import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Berlangganan perubahan realtime tabel "domain_sudah_pernah".
 * Setiap INSERT/UPDATE/DELETE langsung menyegarkan data di UI.
 */
export function useRealtimeDomains() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("realtime-domain-sudah-pernah")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "domain_sudah_pernah" },
        () => {
          qc.invalidateQueries({ queryKey: ["table", "domain_sudah_pernah"] });
          qc.invalidateQueries({ queryKey: ["ringkasan"] });
          qc.invalidateQueries({ queryKey: ["logs"] });
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}
