import path from "node:path";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { nitro } from "nitro/vite";

const mobileSpa = process.env.CAPACITOR_BUILD === "1";

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
  const env = loadEnv(mode, process.cwd(), "");
  const viteEnvDefines = Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith("VITE_"))
      .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  return {
    envPrefix: ["VITE_", "NEXT_PUBLIC_"],
    define: viteEnvDefines,
    resolve: {
      alias: {
        "@": path.resolve(process.cwd(), "./src"),
      },
      dedupe: [
        "react",
        "react-dom",
        "@tanstack/react-query",
        "@tanstack/query-core",
      ],
    },
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    plugins: [
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
      ...(mobileSpa
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
