import { Capacitor } from "@capacitor/core";
import type { StorageProvider } from "./contract";
import { createCapacitorStorageProvider } from "./capacitor-adapter";
import { createMemoryStorageProvider } from "./memory-adapter";
import { createWebStorageProvider } from "./web-adapter";

let testOverride: StorageProvider | null = null;
let cached: StorageProvider | null = null;

/**
 * Test-only injection. Production code must not call this.
 */
export function setStorageProviderForTests(value: StorageProvider | null): void {
  testOverride = value;
  cached = null;
}

function isNativeShell(): boolean {
  try {
    return typeof window !== "undefined" && Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

function resolveProvider(): StorageProvider {
  if (typeof window === "undefined") {
    return createMemoryStorageProvider();
  }

  if (isNativeShell()) {
    return createCapacitorStorageProvider();
  }

  return createWebStorageProvider();
}

/**
 * Resolves the correct StorageProvider for the current runtime.
 * Single entry point — never import adapters from business code.
 */
export function getStorageProvider(): StorageProvider {
  if (testOverride) return testOverride;
  if (!cached) cached = resolveProvider();
  return cached;
}

/** Clears the resolver cache (tests / hot reload). */
export function resetStorageProviderCache(): void {
  cached = null;
}
