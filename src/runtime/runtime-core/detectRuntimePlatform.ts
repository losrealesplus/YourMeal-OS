/**
 * Platform-agnostic runtime platform detection (Core · no Host dependency).
 * DEVELOPER-PLATFORM-011 — moved out of Host so Recovery/engines stay Host-free.
 */

import type { RuntimePlatform } from "./types";

export function detectRuntimePlatform(): RuntimePlatform {
  try {
    // Lazy string check avoids hard Capacitor import in pure helpers/tests.
    const cap = (globalThis as { Capacitor?: { getPlatform?: () => string } })
      .Capacitor;
    const p = cap?.getPlatform?.() ?? "web";
    if (p === "android" || p === "ios" || p === "web") return p;
    return "web";
  } catch {
    return "web";
  }
}
