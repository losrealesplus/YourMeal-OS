/**
 * Runtime Secret Gateway — internal events (no React, no analytics).
 */

/** Opens the Runtime Inspector — Inspector listens; gateway never mounts UI. */
export const YMOS_RUNTIME_OPEN_EVENT = "ymos-runtime-open";

/** Fired after a secret command matches (payload: command id only, never the typed buffer). */
export const YMOS_SECRET_GATEWAY_TRIGGERED_EVENT = "ymos-secret-gateway-triggered";

export type YmosSecretGatewayTriggeredDetail = {
  /** Normalized command key, e.g. "ymos horus" — not the raw buffer. */
  command: string;
};

export function dispatchRuntimeOpen(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(YMOS_RUNTIME_OPEN_EVENT));
}

export function dispatchSecretGatewayTriggered(command: string): void {
  if (typeof window === "undefined") return;
  const detail: YmosSecretGatewayTriggeredDetail = { command };
  window.dispatchEvent(
    new CustomEvent(YMOS_SECRET_GATEWAY_TRIGGERED_EVENT, { detail }),
  );
}
