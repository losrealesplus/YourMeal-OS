import { afterEach, describe, expect, it, vi } from "vitest";
import {
  createCapacitorDeviceCapabilities,
  createWebDeviceCapabilities,
  getDeviceCapabilities,
  setDeviceCapabilitiesForTests,
} from "./index";

vi.mock("@capacitor/core", () => ({
  Capacitor: {
    isNativePlatform: vi.fn(() => false),
  },
}));

import { Capacitor } from "@capacitor/core";

afterEach(() => {
  setDeviceCapabilitiesForTests(null);
  vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
});

describe("DeviceCapabilities · web adapter", () => {
  it("reports web runtime and denies product capabilities by default", () => {
    const caps = createWebDeviceCapabilities("web");
    expect(caps.runtime).toBe("web");
    expect(caps.camera.canCaptureImages()).toBe(false);
    expect(caps.camera.status()).toBe("unavailable");
    expect(caps.location.canReadPosition()).toBe(false);
    expect(caps.notifications.canReceivePush()).toBe(false);
    expect(caps.biometrics.isAvailable()).toBe(false);
    expect(caps.biometrics.kind()).toBe("unsupported");
    expect(caps.fileSystem.canReadWriteFiles()).toBe(false);
    expect(caps.deepLinks.canHandleAppLinks()).toBe(false);
  });

  it("exposes network negotiation without throwing", () => {
    const caps = createWebDeviceCapabilities("web");
    const status = caps.network.status();
    expect(["online", "offline", "constrained", "unknown"]).toContain(status);
    expect(typeof caps.network.isOnline()).toBe("boolean");
  });
});

describe("DeviceCapabilities · capacitor adapter", () => {
  it("reports capacitor runtime while product capabilities stay unavailable (no plugins)", () => {
    const caps = createCapacitorDeviceCapabilities();
    expect(caps.runtime).toBe("capacitor");
    expect(caps.camera.canCaptureImages()).toBe(false);
    expect(caps.notifications.canReceivePush()).toBe(false);
    expect(caps.biometrics.isAvailable()).toBe(false);
  });
});

describe("getDeviceCapabilities · resolver", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns ssr adapter when window is undefined", () => {
    vi.stubGlobal("window", undefined);
    const caps = getDeviceCapabilities();
    expect(caps.runtime).toBe("ssr");
  });

  it("returns web adapter when not native", () => {
    vi.stubGlobal("window", globalThis);
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(false);
    const caps = getDeviceCapabilities();
    expect(caps.runtime).toBe("web");
  });

  it("returns capacitor adapter when native shell is detected", () => {
    vi.stubGlobal("window", globalThis);
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    const caps = getDeviceCapabilities();
    expect(caps.runtime).toBe("capacitor");
  });

  it("honors test override without calling platform detection", () => {
    const stub = createWebDeviceCapabilities("ssr");
    setDeviceCapabilitiesForTests(stub);
    vi.stubGlobal("window", globalThis);
    vi.mocked(Capacitor.isNativePlatform).mockReturnValue(true);
    expect(getDeviceCapabilities()).toBe(stub);
    expect(getDeviceCapabilities().runtime).toBe("ssr");
  });

  it("keeps controlled denial for unready capabilities (no throw)", () => {
    vi.stubGlobal("window", globalThis);
    const caps = getDeviceCapabilities();
    expect(() => caps.camera.status()).not.toThrow();
    expect(() => caps.location.status()).not.toThrow();
    expect(() => caps.deepLinks.status()).not.toThrow();
  });
});
