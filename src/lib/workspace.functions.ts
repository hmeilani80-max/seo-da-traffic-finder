import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Workspace aktif milik user yang sedang login (dipakai mulai Wave 1). */
export const getMyWorkspaces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listMemberships } = await import("./workspace.server");
    return listMemberships(context.userId);
  });

/** Mendaftarkan user internal yang sedang login ke workspace default (idempoten). */
export const joinDefaultWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureDefaultMembership } = await import("./workspace.server");
    return ensureDefaultMembership(context.userId);
  });

/** Status konfigurasi provider AI (tanpa memanggil provider berbayar). */
export const getAiProviderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { getAiProvider } = await import("./seo/ai/ai.provider");
    const { openAiProvider } = await import("./seo/ai/openai.provider");
    const { lovableAiProvider } = await import("./seo/ai/lovable-ai.provider");

    const active = await getAiProvider();
    return {
      activeProvider: active.id,
      openaiConfigured: openAiProvider.isConfigured(),
      lovableConfigured: lovableAiProvider.isConfigured(),
    };
  });
