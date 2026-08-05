/**
 * Runtime capability recovery — clear Suite dismiss / re-enable overlay gate.
 * Deliberately simple & reversible. DEVELOPER-PLATFORM-010
 */

import type {
  CapabilityContext,
  RuntimeRecoveryResult,
  RuntimeVerificationResult,
} from "./capability.types";

const STORAGE_KEY = "ymos.runtime-inspector";

export async function recoverRuntimeCapability(
  _ctx: CapabilityContext,
): Promise<RuntimeRecoveryResult> {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return {
        ok: true,
        code: "NO_SESSION_STORAGE",
        message: "No sessionStorage in this environment — treated as recovered",
        supported: true,
      };
    }
    const before = window.sessionStorage.getItem(STORAGE_KEY);
    // Clear explicit dismiss ("0") and mark open-eligible ("1").
    window.sessionStorage.setItem(STORAGE_KEY, "1");
    return {
      ok: true,
      code: "CLEARED_DISMISS",
      message: `Cleared runtime dismiss (was ${before ?? "null"}) · session set to 1`,
      supported: true,
    };
  } catch (err) {
    return {
      ok: false,
      code: "RECOVER_FAILED",
      message: err instanceof Error ? err.message : String(err),
      supported: true,
    };
  }
}

export async function verifyRuntimeCapability(
  _ctx: CapabilityContext,
): Promise<RuntimeVerificationResult> {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) {
      return {
        ok: true,
        code: "NO_SESSION_STORAGE",
        message: "Verify skipped — no sessionStorage",
        supported: true,
      };
    }
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const ok = raw !== "0";
    return {
      ok,
      code: ok ? "OVERLAY_GATE_OK" : "STILL_DISMISSED",
      message: ok
        ? `Overlay gate not dismissed (value=${raw ?? "null"})`
        : "sessionStorage still dismissed (0)",
      supported: true,
    };
  } catch (err) {
    return {
      ok: false,
      code: "VERIFY_FAILED",
      message: err instanceof Error ? err.message : String(err),
      supported: true,
    };
  }
}
