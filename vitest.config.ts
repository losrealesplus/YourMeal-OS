import path from "node:path";
import { defineConfig } from "vitest/config";

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
 * Native Vitest configuration (independent of Vite app bootstrap / Lovable).
 * Preserves the @ alias used across the source tree.
 */
export default defineConfig({
  plugins: [tenantCommercialPlugin()],
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
