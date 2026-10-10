import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";
import { serverLocalStaging } from "./src/integrations/supabase/local-staging.server";

const mobileSpa = process.env.CAPACITOR_BUILD === "1";

/**
 * Vite plugin for tenant instance commercial runtime bootstrap.
 * Resolves '@tenant-commercial' to import TENANT_COMMERCIAL_CONFIG_PATH when provided,
 * otherwise exports an empty no-op module, keeping Core agnostic.
 */
function tenantCommercialPlugin() {
  const virtualModuleId = "@tenant-commercial";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  return {
    name: "vite-plugin-tenant-commercial",
    resolveId(id: string) {
      if (id === virtualModuleId || id === "virtual:tenant-commercial") {
        return {
          id: resolvedVirtualModuleId,
          moduleSideEffects: true,
        };
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const tenantCommercialPath = process.env.TENANT_COMMERCIAL_CONFIG_PATH;
        if (tenantCommercialPath) {
          const resolvedPath = path.isAbsolute(tenantCommercialPath)
            ? tenantCommercialPath
            : path.resolve(process.cwd(), tenantCommercialPath);
          return `import ${JSON.stringify(resolvedPath)};\nexport const hasTenantCommercial = true;`;
        }
        return `export const hasTenantCommercial = false;`;
      }
    },
  };
}

/**
 * Native Vite + TanStack Start configuration.
 * Lovable wrapper removed — development toolchain is Cursor / Vite / Vitest.
 *
 * Dual build (MF-001 · M-01):
 *   npm run build         → SSR (Cloudflare/Nitro) — spa OFF
 *   npm run build:mobile  → CAPACITOR_BUILD=1 → TanStack SPA shell → .output/public/index.html
 *
 * Mobile disables Nitro: SPA prerender needs Vite's dist/server entry; Nitro's
 * .output/server/index.mjs is not loadable by tanstack-start preview-server.
 */
export default defineConfig(({ mode }) => {
  // Local staging never reads the repository's .env files or their cloud credentials.
  const localStaging = serverLocalStaging(process.env);
  const env = localStaging
    ? { VITE_YOURMEAL_RUNTIME_ENV: "staging_local" }
    : { ...loadEnv(mode, process.cwd(), ""), ...process.env };
  const viteEnvDefines = Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith("VITE_"))
      .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  return {
    ...(localStaging ? { envDir: false as const } : {}),
    envPrefix: localStaging ? [] : ["VITE_", "NEXT_PUBLIC_"],
    define: viteEnvDefines,
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "./src"),
      },
      dedupe: ["react", "react-dom", "@tanstack/react-query", "@tanstack/query-core"],
    },
    server: {
      host: localStaging ? "127.0.0.1" : "::",
      port: 8080,
      ...(localStaging ? { strictPort: true } : {}),
      hmr: {
        overlay: false,
      },
    },
    plugins: [
      tenantCommercialPlugin(),
      tsconfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),
      tanstackStart({
        // Redirect TanStack Start's bundled server entry to src/server.ts.
        server: { entry: "server" },
        // Mobile-only: SPA Mode prerenders a static shell for Capacitor.
        // outputPath '/index' → file index.html (TanStack appends .html).
        ...(mobileSpa
          ? {
              spa: {
                enabled: true,
                prerender: {
                  outputPath: "/index",
                },
              },
            }
          : {}),
      }),
      ...(mobileSpa || localStaging
        ? []
        : [
            nitro({
              // Cloudflare Workers deployment target for the SSR/edge server.
              preset: "cloudflare-module",
            }),
          ]),
      react(),
    ],
    ...(mobileSpa
      ? {
          environments: {
            client: {
              build: {
                outDir: ".output/public",
              },
            },
          },
        }
      : {}),
  };
});
