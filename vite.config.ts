// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
//
// Dual build (MF-001 · M-01):
//   npm run build         → SSR (Cloudflare/Nitro) — spa OFF
//   npm run build:mobile  → CAPACITOR_BUILD=1 → TanStack SPA shell → .output/public/index.html
//
// Mobile disables Nitro: SPA prerender needs Vite's dist/server entry; Nitro's
// .output/server/index.mjs is not loadable by tanstack-start preview-server.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

const mobileSpa = process.env.CAPACITOR_BUILD === "1";

export default defineConfig({
  // Skip Nitro only for the Capacitor/SPA pipeline; web SSR keeps Cloudflare Nitro.
  ...(mobileSpa ? { nitro: false as const } : {}),
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Mobile-only: SPA Mode prerenders a static shell for Capacitor (does not alter web SSR).
    // outputPath '/index' → file index.html (TanStack appends .html for the SPA shell).
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
  },
  vite: {
    // node:test suites under scripts/ run via dedicated npm scripts
    // (test:doctor:unit, test:capacitor:unit, …) — keep them out of vitest.
    test: {
      exclude: [
        "**/node_modules/**",
        "**/dist/**",
        "**/cypress/**",
        "**/.{idea,git,cache,output,temp}/**",
        "**/scripts/**",
      ],
    },
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
  },
});
