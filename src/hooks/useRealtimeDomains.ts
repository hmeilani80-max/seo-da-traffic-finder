import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TableKey } from "@/lib/domains";

const TABLES: TableKey[] = ["domain_sudah_pernah", "sudah_dibeli", "traffic_nol"];

/**
 * Berlangganan perubahan realtime seluruh tabel domain.
 * Setiap INSERT/UPDATE/DELETE langsung menyegarkan data di UI.
 */
export function useRealtimeDomains() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase.channel("realtime-domains");

    for (const table of TABLES) {
      channel.on("postgres_changes", { event: "*", schema: "public", table }, () => {
        qc.invalidateQueries({ queryKey: ["table", table] });
        qc.invalidateQueries({ queryKey: ["ringkasan"] });
        qc.invalidateQueries({ queryKey: ["logs"] });
      });
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [qc]);
}
