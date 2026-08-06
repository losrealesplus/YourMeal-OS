/**
 * Identity lifecycle events — observe-only (Doctor may subscribe later).
 */

import type { IdentityState } from "./IdentityContext";

export type IdentityLifecycleEventName =
  | "identity:unknown"
  | "identity:authenticating"
  | "identity:anonymous"
  | "identity:resolving"
  | "identity:operational_ready"
  | "identity:active"
  | "identity:failed"
  | "identity:cleared";

export type IdentityLifecycleEvent = {
  name: IdentityLifecycleEventName;
  timestamp: string;
  state: IdentityState;
  payload?: Record<string, unknown>;
};

type Listener = (event: IdentityLifecycleEvent) => void;

const listeners = new Set<Listener>();

const STATE_TO_EVENT: Partial<Record<IdentityState, IdentityLifecycleEventName>> = {
  unknown: "identity:unknown",
  authenticating: "identity:authenticating",
  anonymous: "identity:anonymous",
  resolving: "identity:resolving",
  operational_ready: "identity:operational_ready",
  active: "identity:active",
  failed: "identity:failed",
};

export function onIdentityLifecycle(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitIdentityLifecycle(
  state: IdentityState,
  payload?: Record<string, unknown>,
): IdentityLifecycleEvent | null {
  const name = STATE_TO_EVENT[state] ?? null;
  if (!name) return null;
  const event: IdentityLifecycleEvent = {
    name,
    timestamp: new Date().toISOString(),
    state,
    payload,
  };
  for (const listener of [...listeners]) {
    try {
      listener(event);
    } catch {
      /* observe-only */
    }
  }
  return event;
}

/** Test helper */
export function resetIdentityLifecycleListeners(): void {
  listeners.clear();
}
