/**
 * Application lifecycle latch — PRODUCT-CORE-004 / ADR 0053.
 * Exactly one module decides "Is the application Ready?"
 */

import type { BootstrapResult } from "@/bootstrap/pipeline/types";
import type { BootstrapIdentitySnapshot } from "@/bootstrap/pipeline/BootstrapIdentityStore";

export type ApplicationLifecycleState =
  | "NOT_STARTED"
  | "BOOTSTRAPPING"
  | "AUTH_REQUIRED"
  | "READY"
  | "FAILED";

export type ApplicationReadySnapshot = {
  state: ApplicationLifecycleState;
  /** True only when Product Core workspaces may mount. */
  isReady: boolean;
  /** Anonymous terminal — auth/landing may render; Product Core must not. */
  isAuthRequired: boolean;
  isFailed: boolean;
  isBootstrapping: boolean;
  bootstrap: BootstrapResult | null;
  identityUserId: string | null;
};

/**
 * Pure derivation — the single decision function for application readiness.
 */
export function deriveApplicationReadySnapshot(
  bootstrap: BootstrapResult | null,
  identity: BootstrapIdentitySnapshot | null,
): ApplicationReadySnapshot {
  const identityReady = Boolean(
    identity &&
      identity.status === "ready" &&
      identity.userId,
  );

  let state: ApplicationLifecycleState = "NOT_STARTED";

  if (bootstrap?.status === "failed") {
    state = "FAILED";
  } else if (bootstrap?.status === "ready" || identityReady) {
    // Post-login: Stages publish identity ready while cold pipeline may still
    // be auth_required — identity ready means Product Core may enter.
    state = "READY";
  } else if (bootstrap?.status === "auth_required") {
    state = "AUTH_REQUIRED";
  } else if (
    bootstrap?.status === "running" ||
    bootstrap?.status === "pending" ||
    identity?.status === "loading"
  ) {
    state = "BOOTSTRAPPING";
  } else if (!bootstrap) {
    state = "NOT_STARTED";
  } else {
    state = "BOOTSTRAPPING";
  }

  return {
    state,
    isReady: state === "READY",
    isAuthRequired: state === "AUTH_REQUIRED",
    isFailed: state === "FAILED",
    isBootstrapping:
      state === "BOOTSTRAPPING" || state === "NOT_STARTED",
    bootstrap,
    identityUserId: identity?.userId ?? null,
  };
}

/** Convenience — single boolean answer for "Is the application Ready?" */
export function isApplicationReady(
  bootstrap: BootstrapResult | null,
  identity: BootstrapIdentitySnapshot | null,
): boolean {
  return deriveApplicationReadySnapshot(bootstrap, identity).isReady;
}
