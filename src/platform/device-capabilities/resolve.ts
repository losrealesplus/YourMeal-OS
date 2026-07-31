import { Capacitor } from "@capacitor/core";
import type { DeviceCapabilities } from "./contract";
import { createCapacitorDeviceCapabilities } from "./capacitor-adapter";
import { createWebDeviceCapabilities } from "./web-adapter";

let testOverride: DeviceCapabilities | null = null;

/**
 * Test-only injection. Production code must not call this.
 */
export function setDeviceCapabilitiesForTests(
  value: DeviceCapabilities | null,
): void {
  testOverride = value;
}

function isNativeShell(): boolean {
  try {
    return typeof window !== "undefined" && Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Resolves the correct DeviceCapabilities adapter for the current runtime.
 * Single entry point for UI/domain — never import adapters directly from business code.
 */
export function getDeviceCapabilities(): DeviceCapabilities {
  if (testOverride) return testOverride;

  if (typeof window === "undefined") {
    return createWebDeviceCapabilities("ssr");
  }

  if (isNativeShell()) {
    return createCapacitorDeviceCapabilities();
  }

  return createWebDeviceCapabilities("web");
}
