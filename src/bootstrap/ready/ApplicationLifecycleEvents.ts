/**
 * Application lifecycle events — observe-only (Doctor may subscribe later).
 * Does not import Runtime / Doctor engines.
 */

import type { ApplicationLifecycleState } from "./deriveApplicationReady";

export type ApplicationLifecycleEventName =
  | "application:not_started"
  | "application:bootstrapping"
  | "application:auth_required"
  | "application:ready"
  | "application:failed";

export type ApplicationLifecycleEvent = {
  name: ApplicationLifecycleEventName;
  timestamp: string;
  state: ApplicationLifecycleState;
  payload?: Record<string, unknown>;
};

type Listener = (event: ApplicationLifecycleEvent) => void;

const listeners = new Set<Listener>();

const STATE_TO_EVENT: Record<
  ApplicationLifecycleState,
  ApplicationLifecycleEventName
> = {
  NOT_STARTED: "application:not_started",
  BOOTSTRAPPING: "application:bootstrapping",
  AUTH_REQUIRED: "application:auth_required",
  READY: "application:ready",
  FAILED: "application:failed",
};

export function onApplicationLifecycle(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function emitApplicationLifecycle(
  state: ApplicationLifecycleState,
  payload?: Record<string, unknown>,
): ApplicationLifecycleEvent {
  const event: ApplicationLifecycleEvent = {
    name: STATE_TO_EVENT[state],
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
export function resetApplicationLifecycleListeners(): void {
  listeners.clear();
}
