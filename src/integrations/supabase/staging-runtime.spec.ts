import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LOCAL_STAGING_CONFIG,
  LOCAL_STAGING_URL,
  LOCAL_STAGING_PUBLIC_KEY,
  assertLocalStagingRequest,
  localStagingFromEnvironment,
} from "@/lib/local-staging-runtime";
import { resolveInstanceRuntimeConfig } from "@/lib/instance-runtime-boundary";
import { LOCAL_STAGING_SERVICE_KEY, serverLocalStaging } from "./local-staging.server";
import { EnvironmentStage } from "@/bootstrap/pipeline/stages/EnvironmentStage";
import { createBootstrapContext } from "@/bootstrap/pipeline/BootstrapContext";
const mocks = vi.hoisted(() => ({ create: vi.fn(), request: vi.fn(), claims: vi.fn() }));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.create }));
vi.mock("@/platform/storage-provider", () => ({ createSupabaseAuthStorage: () => undefined }));
vi.mock("@tanstack/react-start", () => ({
  createMiddleware: () => ({ server: (fn: unknown) => fn }),
}));
vi.mock("@tanstack/react-start/server", () => ({ getRequest: mocks.request }));
const env = {
  YOURMEAL_RUNTIME_ENV: "staging_local",
  TENANT_SLUG: "eatclean-staging",
  SUPABASE_URL: LOCAL_STAGING_URL,
  SUPABASE_PUBLISHABLE_KEY: LOCAL_STAGING_PUBLIC_KEY,
  SUPABASE_SERVICE_ROLE_KEY: LOCAL_STAGING_SERVICE_KEY,
};
beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  for (const k of Object.keys(env)) vi.stubEnv(k, undefined);
  vi.stubGlobal("window", undefined);
  vi.stubEnv("VITE_YOURMEAL_RUNTIME_ENV", undefined);
  mocks.create.mockReturnValue({ marker: "client", auth: { getClaims: mocks.claims } });
  mocks.claims.mockResolvedValue({ data: { claims: { sub: "synthetic-user" } }, error: null });
  mocks.request.mockReturnValue(
    new Request("http://localhost:3000/api/test", {
      headers: { authorization: "Bearer synthetic.token.signature" },
    }),
  );
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
function stagingEnv() {
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
}
function browser(config: unknown = LOCAL_STAGING_CONFIG, host = "localhost") {
  vi.stubGlobal("window", { location: { hostname: host }, __INSTANCE_CONFIG__: config });
}
describe("explicit local staging boundary", () => {
  it("accepts exact synthetic configuration and reaches environment readiness", async () => {
    browser();
    expect(resolveInstanceRuntimeConfig("localhost")).toEqual(LOCAL_STAGING_CONFIG);
    expect((await EnvironmentStage.run(createBootstrapContext("local", "cold"))).status).toBe("ok");
  });
  it("explicit local build chooses synthetic backend without window injection", () => {
    vi.stubEnv("VITE_YOURMEAL_RUNTIME_ENV", "staging_local");
    vi.stubGlobal("window", { location: { hostname: "localhost" } });
    expect(resolveInstanceRuntimeConfig("localhost")).toEqual(LOCAL_STAGING_CONFIG);
    expect(() => resolveInstanceRuntimeConfig("eatclean.yourmealos.com")).toThrow(
      /SECURITY_VIOLATION/,
    );
  });
  it("explicit local build rejects a production injection", () => {
    vi.stubEnv("VITE_YOURMEAL_RUNTIME_ENV", "staging_local");
    browser({ ...LOCAL_STAGING_CONFIG, supabasePublishableKey: "unused-cloud-key" });
    expect(() => resolveInstanceRuntimeConfig("localhost")).toThrow(/SECURITY_VIOLATION/);
  });
  it.each([
    "supabaseUrl",
    "supabaseProjectRef",
    "supabasePublishableKey",
    "tenantSlug",
    "instanceType",
    "runtimeEnvironment",
  ])("rejects mixed field %s", (field) => {
    browser({ ...LOCAL_STAGING_CONFIG, [field]: "production-value" });
    expect(() => resolveInstanceRuntimeConfig("localhost")).toThrow(/SECURITY_VIOLATION/);
  });
  it("rejects additional credential fields in staging injection", () => {
    browser({ ...LOCAL_STAGING_CONFIG, serviceRoleKey: "must-not-be-used" });
    expect(() => resolveInstanceRuntimeConfig("localhost")).toThrow(/SECURITY_VIOLATION/);
  });
  it("rejects stage identity on production host", () => {
    browser(LOCAL_STAGING_CONFIG, "eatclean.yourmealos.com");
    expect(() => resolveInstanceRuntimeConfig("eatclean.yourmealos.com")).toThrow(
      /SECURITY_VIOLATION/,
    );
  });
  it("does not fall back when staging host has no declaration", () => {
    expect(() => resolveInstanceRuntimeConfig("eatclean-staging.yourmealos.com")).toThrow(
      /SECURITY_VIOLATION/,
    );
  });
  it.each(["YOURMEAL_RUNTIME_ENV", "TENANT_SLUG", "SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"])(
    "server rejects absent field %s",
    (field) => {
      expect(() => localStagingFromEnvironment({ ...env, [field]: undefined })).toThrow(
        /SECURITY_VIOLATION/,
      );
    },
  );
  it("rejects cloud service credentials without displaying them", () => {
    expect(() => serverLocalStaging({ ...env, SUPABASE_SERVICE_ROLE_KEY: "do-not-log" })).toThrow(
      "SECURITY_VIOLATION: Mixed staging service credential.",
    );
  });
  it.each([
    "https://nhirlpkuvonggctdzzad.supabase.co/auth/v1",
    "https://djangucecsphnejplvic.supabase.co",
    "http://127.0.0.1:54322",
    "http://user:password@127.0.0.1:54331",
  ])("rejects non-pinned backend %s", (url) => {
    expect(() => assertLocalStagingRequest(url)).toThrow(/SECURITY_VIOLATION/);
  });
  it("browser creates only local client, ignores fallback cloud key, and separates session storage", async () => {
    browser();
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "unused-cloud-key");
    const { supabase } = await import("./client");
    expect((supabase as unknown as { marker: string }).marker).toBe("client");
    const [url, key, options] = mocks.create.mock.calls[0];
    expect(url).toBe(LOCAL_STAGING_URL);
    expect(key).toBe(LOCAL_STAGING_PUBLIC_KEY);
    expect(options.auth.storageKey).toBe("yourmeal-local-staging-auth");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}")));
    await options.global.fetch(LOCAL_STAGING_URL + "/rest/v1/test");
    expect(fetch).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ redirect: "error" }),
    );
    expect(() => options.global.fetch("https://nhirlpkuvonggctdzzad.supabase.co")).toThrow(
      /SECURITY_VIOLATION/,
    );
  });
  it("invalid browser config fails before createClient", async () => {
    browser({ ...LOCAL_STAGING_CONFIG, supabasePublishableKey: undefined });
    const { supabase } = await import("./client");
    expect(() => supabase.auth).toThrow(/SECURITY_VIOLATION/);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("admin uses only synthetic local key", async () => {
    stagingEnv();
    const { supabaseAdmin } = await import("./client.server");
    expect((supabaseAdmin as unknown as { marker: string }).marker).toBe("client");
    expect(mocks.create).toHaveBeenCalledWith(
      LOCAL_STAGING_URL,
      LOCAL_STAGING_SERVICE_KEY,
      expect.anything(),
    );
    const opts = mocks.create.mock.calls[0][2];
    expect(() => opts.global.fetch("https://example.com")).toThrow(/SECURITY_VIOLATION/);
  });
  it("admin fails before client creation on mixed config", async () => {
    stagingEnv();
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "unused-cloud-key");
    const { supabaseAdmin } = await import("./client.server");
    expect(() => supabaseAdmin.auth).toThrow(/SECURITY_VIOLATION/);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("middleware authenticates only through local client", async () => {
    stagingEnv();
    const { requireSupabaseAuth } = await import("./auth-middleware");
    const next = vi.fn().mockResolvedValue("ok");
    await (requireSupabaseAuth as unknown as (arg: { next: typeof next }) => Promise<unknown>)({
      next,
    });
    expect(mocks.create).toHaveBeenCalledWith(
      LOCAL_STAGING_URL,
      LOCAL_STAGING_PUBLIC_KEY,
      expect.anything(),
    );
    expect(next).toHaveBeenCalledWith({
      context: expect.objectContaining({ userId: "synthetic-user" }),
    });
  });
  it("middleware rejects a production request host in local mode", async () => {
    stagingEnv();
    mocks.request.mockReturnValue(new Request("https://eatclean.yourmealos.com/api/test"));
    const { requireSupabaseAuth } = await import("./auth-middleware");
    await expect(
      (requireSupabaseAuth as unknown as (arg: { next: unknown }) => Promise<unknown>)({
        next: vi.fn(),
      }),
    ).rejects.toThrow(/SECURITY_VIOLATION/);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("middleware rejects staging request without declaration", async () => {
    mocks.request.mockReturnValue(new Request("https://eatclean-staging.yourmealos.com/api/test"));
    vi.stubEnv("SUPABASE_URL", "https://nhirlpkuvonggctdzzad.supabase.co");
    vi.stubEnv("SUPABASE_PUBLISHABLE_KEY", "unused-key");
    const { requireSupabaseAuth } = await import("./auth-middleware");
    await expect(
      (requireSupabaseAuth as unknown as (arg: { next: unknown }) => Promise<unknown>)({
        next: vi.fn(),
      }),
    ).rejects.toThrow(/SECURITY_VIOLATION/);
    expect(mocks.create).not.toHaveBeenCalled();
  });
  it("existing production admin contract remains unchanged", async () => {
    vi.stubEnv("SUPABASE_URL", "https://nhirlpkuvonggctdzzad.supabase.co");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "synthetic-production-contract-placeholder");
    const { supabaseAdmin } = await import("./client.server");
    expect((supabaseAdmin as unknown as { marker: string }).marker).toBe("client");
    expect(mocks.create).toHaveBeenCalledWith(
      "https://nhirlpkuvonggctdzzad.supabase.co",
      "synthetic-production-contract-placeholder",
      expect.anything(),
    );
  });
});
