import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as boundary from "@/lib/instance-runtime-boundary";
import { EnvironmentStage } from "./EnvironmentStage";
import { createBootstrapContext } from "../BootstrapContext";
import { BootstrapOrchestrator } from "../BootstrapOrchestrator";
import { deriveApplicationReadySnapshot } from "@/bootstrap/ready/deriveApplicationReady";
import {
  getBootstrapIdentitySnapshot,
  publishBootstrapIdentitySnapshot,
  resetBootstrapIdentitySnapshot,
} from "../BootstrapIdentityStore";

const eatclean = boundary.CANONICAL_INSTANCE_BINDINGS.eatclean;
const run = () => EnvironmentStage.run(createBootstrapContext("env-test", "cold"));
function browser(config = eatclean, hostname = "eatclean.yourmealos.com") {
  vi.stubGlobal("window", { location: { hostname }, __INSTANCE_CONFIG__: config });
}

beforeEach(() => {
  for (const key of [
    "VITE_SUPABASE_URL",
    "VITE_SUPABASE_PUBLISHABLE_KEY",
    "SUPABASE_URL",
    "SUPABASE_PUBLISHABLE_KEY",
  ]) {
    vi.stubEnv(key, undefined);
  }
  resetBootstrapIdentitySnapshot();
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  resetBootstrapIdentitySnapshot();
});

describe("EnvironmentStage canonical instance contract", () => {
  it.each(["eatclean.yourmealos.com", "eatclean-staging.yourmealos.com", "yourmealos.com"])(
    "accepts hostname %s without duplicated Vite environment",
    async (hostname) => {
      vi.stubGlobal("window", { location: { hostname } });
      expect((await run()).status).toBe("ok");
    },
  );
  it("accepts the canonical non-browser demo binding", async () => {
    vi.stubGlobal("window", undefined);
    expect((await run()).status).toBe("ok");
  });
  it("fails closed when the resolver returns no configuration", async () => {
    vi.spyOn(boundary, "resolveInstanceRuntimeConfig").mockReturnValue(
      undefined as unknown as boundary.InstanceRuntimeConfig,
    );
    expect((await run()).error?.code).toBe("ENV_INVALID");
  });
  it.each([
    "",
    "REPLACE_ME",
    "not-a-url",
    "http://nhirlpkuvonggctdzzad.supabase.co",
    "https://unrelated.supabase.co",
    "https://nhirlpkuvonggctdzzad.supabase.co/path",
    "https://nhirlpkuvonggctdzzad.supabase.co?token=private",
    "https://user:password@nhirlpkuvonggctdzzad.supabase.co",
  ])("rejects invalid URL %s", async (supabaseUrl) => {
    browser({ ...eatclean, supabaseUrl });
    expect((await run()).error?.code).toBe("ENV_INVALID");
  });
  it.each([
    undefined,
    "",
    "   ",
    "sb_publishable_REPLACE_ME",
    "changeme",
    "invalid-key",
    "sb_secret_private",
  ])("rejects missing/placeholder key %s", async (supabasePublishableKey) => {
    browser({ ...eatclean, supabasePublishableKey });
    expect((await run()).error?.code).toBe("ENV_INVALID");
  });
  it.each(["eatclean", "yourmeal-os"])("rejects cross-project bindings for %s", async (slug) => {
    const config = boundary.CANONICAL_INSTANCE_BINDINGS[slug];
    const other =
      boundary.CANONICAL_INSTANCE_BINDINGS[slug === "eatclean" ? "yourmeal-os" : "eatclean"];
    browser({
      ...config,
      supabaseProjectRef: other.supabaseProjectRef,
      supabaseUrl: other.supabaseUrl,
    });
    expect((await run()).error?.code).toBe("ENV_INVALID");
  });
  it("rejects unregistered instance identities", async () => {
    browser({ ...eatclean, tenantSlug: "unregistered" });
    expect((await run()).error?.code).toBe("ENV_INVALID");
  });
  it("keeps failure evidence free of configuration values and keys", async () => {
    browser({ ...eatclean, supabaseUrl: "https://user:private-password@invalid.test" });
    expect(JSON.stringify(await run())).not.toContain("private-password");
    expect(JSON.stringify(await run())).not.toContain(eatclean.supabasePublishableKey);
  });
  it("reaches READY through the real orchestrator with a valid environment and ready identity", async () => {
    browser();
    const orchestrator = new BootstrapOrchestrator([
      EnvironmentStage,
      {
        id: "session",
        blocking: true,
        async run() {
          publishBootstrapIdentitySnapshot({ userId: "local-user", status: "ready" });
          return { status: "ok" };
        },
      },
    ]);
    const result = await orchestrator.run({ mode: "cold" });
    expect(result.status).toBe("ready");
    expect(deriveApplicationReadySnapshot(result, getBootstrapIdentitySnapshot()).isReady).toBe(
      true,
    );
  });
  it("does not let ready identity rescue invalid configuration", async () => {
    browser({ ...eatclean, supabasePublishableKey: undefined });
    publishBootstrapIdentitySnapshot({ userId: "local-user", status: "ready" });
    const next = vi.fn(async () => ({ status: "ok" as const }));
    const result = await new BootstrapOrchestrator([
      EnvironmentStage,
      { id: "session", blocking: true, run: next },
    ]).run();
    expect(result.status).toBe("failed");
    expect(next).not.toHaveBeenCalled();
    expect(deriveApplicationReadySnapshot(result, getBootstrapIdentitySnapshot()).state).toBe(
      "FAILED",
    );
  });
});
