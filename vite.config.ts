// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  vite: {
    // Public browser configuration for the Lovable Cloud backend. These values
    // are intentionally publishable; privileged server credentials stay in the
    // managed runtime environment.
    plugins: [
      {
        name: "lovable-cloud-public-config",
        enforce: "pre",
        transform(code, id) {
          if (!id.endsWith("/src/integrations/supabase/client.ts")) return null;

          return code
            .replaceAll(
              'import.meta.env["VITE_SUPABASE_URL"]',
              JSON.stringify("https://xbfrnttqgvjbgsgqnjzz.supabase.co"),
            )
            .replaceAll(
              'import.meta.env["VITE_SUPABASE_PUBLISHABLE_KEY"]',
              JSON.stringify("sb_publishable_KINmJ5OgjDIX4GkXAaOFiA_uYBY_m1p"),
            );
        },
      },
    ],
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
