/**
 * Runtime Secret Gateway — internal events (no React, no analytics).
 *
 * RUNTIME-SUITE-001: primary path is ymos-runtime-toggle (open/close).
 * ymos-runtime-open kept for compatibility.
 */

/** @deprecated Prefer YMOS_RUNTIME_TOGGLE_EVENT — kept for compatibility. */
export const YMOS_RUNTIME_OPEN_EVENT = "ymos-runtime-open";

/** Toggle Runtime Suite open ↔ closed (YMOS Horus). */
export const YMOS_RUNTIME_TOGGLE_EVENT = "ymos-runtime-toggle";

/**
 * Suite closed — defined/emitted by enable.ts (no inverse Gateway←Inspector dep).
 * Re-exported here only as a documented constant name for consumers.
 */
export const YMOS_RUNTIME_CLOSE_EVENT = "ymos-runtime-close";

/** Fired after a secret command matches (payload: command id only, never the typed buffer). */
export const YMOS_SECRET_GATEWAY_TRIGGERED_EVENT = "ymos-secret-gateway-triggered";

export type YmosSecretGatewayTriggeredDetail = {
  /** Normalized command key, e.g. "ymos horus" — not the raw buffer. */
  command: string;
};

/** @deprecated Prefer dispatchRuntimeToggle. */
export function dispatchRuntimeOpen(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(YMOS_RUNTIME_OPEN_EVENT));
}

export function dispatchRuntimeToggle(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(YMOS_RUNTIME_TOGGLE_EVENT));
}

export function dispatchSecretGatewayTriggered(command: string): void {
  if (typeof window === "undefined") return;
  const detail: YmosSecretGatewayTriggeredDetail = { command };
  window.dispatchEvent(
    new CustomEvent(YMOS_SECRET_GATEWAY_TRIGGERED_EVENT, { detail }),
  );
}
