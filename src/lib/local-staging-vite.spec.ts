import { afterEach, expect, it, vi } from "vitest";
import { LOCAL_STAGING_URL, LOCAL_STAGING_PUBLIC_KEY } from "./local-staging-runtime";
import { LOCAL_STAGING_SERVICE_KEY } from "@/integrations/supabase/local-staging.server";
const mocks = vi.hoisted(() => ({ loadEnv: vi.fn(() => ({ VITE_UNRELATED: "synthetic" })) }));
vi.mock("vite", () => ({ defineConfig: (fn: unknown) => fn, loadEnv: mocks.loadEnv }));
vi.mock("nitro/vite", () => ({ nitro: () => ({ name: "nitro" }) }));
vi.mock("@tailwindcss/vite", () => ({ default: () => ({ name: "tailwind" }) }));
vi.mock("@tanstack/react-start/plugin/vite", () => ({ tanstackStart: () => ({ name: "start" }) }));
vi.mock("@vitejs/plugin-react", () => ({ default: () => ({ name: "react" }) }));
vi.mock("vite-tsconfig-paths", () => ({ default: () => ({ name: "paths" }) }));
import config from "../../vite.config";
const run = config as unknown as (arg: { mode: string }) => {
  envDir?: boolean;
  envPrefix: string[];
  define: Record<string, string>;
  server: { host: string };
  plugins: { name: string }[];
};
afterEach(() => {
  vi.unstubAllEnvs();
  vi.clearAllMocks();
});
it("local config does not read .env, expose unrelated VITE fields, or enable Nitro dotenv loader", () => {
  for (const [k, v] of Object.entries({
    YOURMEAL_RUNTIME_ENV: "staging_local",
    TENANT_SLUG: "eatclean-staging",
    SUPABASE_URL: LOCAL_STAGING_URL,
    SUPABASE_PUBLISHABLE_KEY: LOCAL_STAGING_PUBLIC_KEY,
    SUPABASE_SERVICE_ROLE_KEY: LOCAL_STAGING_SERVICE_KEY,
    VITE_UNRELATED: "must-not-expose",
  }))
    vi.stubEnv(k, v);
  const result = run({ mode: "staging-local" });
  expect(result.envDir).toBe(false);
  expect(result.envPrefix).toEqual([]);
  expect(mocks.loadEnv).not.toHaveBeenCalled();
  expect(result.define).toEqual({ "import.meta.env.VITE_YOURMEAL_RUNTIME_ENV": '"staging_local"' });
  expect(result.server.host).toBe("127.0.0.1");
  expect(result.plugins.map((p) => p.name)).not.toContain("nitro");
});
it("production retains original configuration and Nitro integration", () => {
  for (const k of ["YOURMEAL_RUNTIME_ENV", "TENANT_SLUG"]) vi.stubEnv(k, undefined);
  const result = run({ mode: "production" });
  expect(mocks.loadEnv).toHaveBeenCalled();
  expect(result.envDir).toBeUndefined();
  expect(result.envPrefix).toEqual(["VITE_", "NEXT_PUBLIC_"]);
  expect(result.server.host).toBe("::");
  expect(result.plugins.map((p) => p.name)).toContain("nitro");
});
