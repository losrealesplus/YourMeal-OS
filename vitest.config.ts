import path from "node:path";
import { defineConfig } from "vitest/config";

/**
 * Native Vitest configuration (independent of Vite app bootstrap / Lovable).
 * Preserves the @ alias used across the source tree.
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    exclude: ["scripts/**"],
  },
});
