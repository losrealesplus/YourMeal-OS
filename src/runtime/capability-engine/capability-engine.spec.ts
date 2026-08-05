import { afterEach, describe, expect, it } from "vitest";
import {
  findModule,
  resetRuntimeEvents,
  resetRuntimeRegistry,
} from "../runtime-core";
import { resetModuleRenderers } from "../runtime-host";
import {
  FOUNDATION_CAPABILITY_IDS,
  capabilityHealth,
  getCapability,
  getCapabilityState,
  listCapabilities,
  registerBuiltinCapabilities,
  registerCapabilitiesModule,
  resetBuiltinCapabilitiesFlag,
  resetCapabilitiesModuleFlags,
  resetCapabilityLifecycle,
  resetCapabilityRegistry,
  runAllCapabilities,
  runCapability,
  recoverCapability,
} from "./index";

afterEach(() => {
  resetCapabilityRegistry();
  resetCapabilityLifecycle();
  resetBuiltinCapabilitiesFlag();
  resetCapabilitiesModuleFlags();
  resetRuntimeRegistry();
  resetRuntimeEvents();
  resetModuleRenderers();
});

describe("Capability Engine", () => {
  it("registers foundation capabilities idempotently", () => {
    registerBuiltinCapabilities();
    registerBuiltinCapabilities();
    expect(listCapabilities().map((c) => c.id).sort()).toEqual(
      [...FOUNDATION_CAPABILITY_IDS, "development-environment"].sort(),
    );
    expect(getCapability("assets")?.name).toBe("Assets");
    expect(getCapability("supabase")?.name).toBe("Supabase");
    expect(getCapability("development-environment")?.name).toBe(
      "Development Environment",
    );
  });

  it("diagnose updates lifecycle Idle → Diagnosing → Healthy|Warning|Error", async () => {
    registerBuiltinCapabilities();
    expect(getCapabilityState("runtime")).toBe("idle");
    const result = await runCapability("runtime", {
      platform: "web",
      runAt: new Date().toISOString(),
    });
    expect(result).toBeTruthy();
    expect(result!.results.length).toBeGreaterThan(0);
    const state = getCapabilityState("runtime");
    expect(["healthy", "warning", "error"]).toContain(state);
    expect(capabilityHealth(result!.capability).recoverSupported).toBe(true);
    expect(capabilityHealth(result!.capability).verifySupported).toBe(true);
  });

  it("assets capability still has no recover/verify", () => {
    registerBuiltinCapabilities();
    const assets = getCapability("assets")!;
    expect(capabilityHealth(assets).recoverSupported).toBe(false);
    expect(capabilityHealth(assets).verifySupported).toBe(false);
  });

  it("runAllCapabilities returns all foundation results", async () => {
    registerBuiltinCapabilities();
    const runs = await runAllCapabilities({
      platform: "web",
      runAt: new Date().toISOString(),
    });
    expect(runs.map((r) => r.capability.id).sort()).toEqual(
      [...FOUNDATION_CAPABILITY_IDS, "development-environment"].sort(),
    );
  });

  it("recoverCapability returns NOT_SUPPORTED when recover absent", async () => {
    registerBuiltinCapabilities();
    const r = await recoverCapability("assets", {
      platform: "web",
      runAt: new Date().toISOString(),
    });
    expect(r.supported).toBe(false);
    expect(r.code).toMatch(/NOT_SUPPORTED|NOT_FOUND/);
  });

  it("registers Host Capabilities module", () => {
    registerCapabilitiesModule();
    expect(findModule("capabilities")?.category).toBe("Capabilities");
  });
});
