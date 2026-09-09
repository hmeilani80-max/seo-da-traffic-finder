import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Workspace aktif milik user yang sedang login. */
export const getMyWorkspaces = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { listMemberships } = await import("./workspace.server");
    return listMemberships(context.userId);
  });

/** Bootstrap aman untuk member pertama workspace default. */
export const joinDefaultWorkspace = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureDefaultMembership } = await import("./workspace.server");
    return ensureDefaultMembership(context.userId);
  });

/** Status OpenAI tanpa memanggil model atau menggunakan token AI. */
export const getAiProviderStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async () => {
    const { openAiProvider } = await import("./seo/ai/openai.provider");
    return {
      activeProvider: "openai" as const,
      openaiConfigured: openAiProvider.isConfigured(),
      lovableConfigured: false,
      lovableDisabled: true,
    };
  });
