import { afterEach, expect, it, vi } from "vitest";
import {
  CANONICAL_INSTANCE_BINDINGS,
  resolveInstanceRuntimeConfig,
} from "./instance-runtime-boundary";
import { EnvironmentStage } from "@/bootstrap/pipeline/stages/EnvironmentStage";
import { createBootstrapContext } from "@/bootstrap/pipeline/BootstrapContext";

afterEach(() => vi.unstubAllGlobals());

it("rejects the legacy staging hostname before any production fallback", () => {
  expect(() => resolveInstanceRuntimeConfig("eatclean-staging.yourmealos.com")).toThrow(
    /SECURITY_VIOLATION/,
  );
});

it("a loopback URL alone cannot silently turn the frozen application into isolated staging", async () => {
  vi.stubGlobal("window", {
    location: { hostname: "localhost" },
    __INSTANCE_CONFIG__: {
      ...CANONICAL_INSTANCE_BINDINGS.eatclean,
      supabaseUrl: "http://127.0.0.1:54321",
    },
  });
  const result = await EnvironmentStage.run(
    createBootstrapContext("staging-qualification", "cold"),
  );
  expect(result.status).toBe("failed");
  expect(result.error?.code).toBe("ENV_INVALID");
});

it("an unregistered synthetic instance is rejected before application readiness", async () => {
  vi.stubGlobal("window", {
    location: { hostname: "localhost" },
    __INSTANCE_CONFIG__: {
      ...CANONICAL_INSTANCE_BINDINGS.eatclean,
      tenantSlug: "eatclean-local-synthetic",
      supabaseProjectRef: "local-synthetic",
      supabaseUrl: "http://127.0.0.1:54321",
    },
  });
  const result = await EnvironmentStage.run(
    createBootstrapContext("staging-qualification", "cold"),
  );
  expect(result.error?.code).toBe("ENV_INVALID");
});
